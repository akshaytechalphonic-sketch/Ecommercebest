const { Op } = require('sequelize');
const { sequelize, Product, Vendor, Category, User, InventoryLog } = require('../models');
const { AppError } = require('../middleware/error.middleware');

class InventoryService {
  /**
   * Helper: Ensure authenticated user owns an approved vendor profile
   */
  async getApprovedVendorForUser(user) {
    if (user.role === 'admin') {
      return null; // Admin has global access
    }

    const vendor = await Vendor.findOne({
      where: { user_id: user.id },
    });

    if (!vendor) {
      throw new AppError(
        'Seller store profile not found for this account. Please register as a seller first.',
        404,
        'VENDOR_NOT_FOUND'
      );
    }

    if (vendor.status !== 'approved') {
      throw new AppError(
        `Only approved sellers can access and manage inventory. Your store application is currently '${vendor.status}'.`,
        403,
        'VENDOR_NOT_APPROVED'
      );
    }

    return vendor;
  }

  /**
   * Helper: Verify product existence and seller ownership
   */
  async checkProductOwnership(user, productId, transaction = null, lock = false) {
    const options = {};
    if (transaction) options.transaction = transaction;
    if (lock && transaction) options.lock = transaction.LOCK.UPDATE;

    const product = await Product.findByPk(productId, options);

    if (!product) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }

    if (user.role !== 'admin') {
      const vendor = await this.getApprovedVendorForUser(user);
      if (Number(product.vendor_id) !== Number(vendor.id)) {
        throw new AppError(
          'You are not authorized to view or manage stock for this product',
          403,
          'UNAUTHORIZED_PRODUCT_ACCESS'
        );
      }
    }

    return product;
  }

  /**
   * 1. Get Inventory List (Seller can view their products, Admin can view all or filter by seller)
   */
  async getInventory(user, queryParams = {}) {
    const {
      page = 1,
      limit = 20,
      search,
      status = 'all',
      filter = 'all',
      vendor_id,
      category_id,
      sortBy = 'updated_at',
      sortOrder = 'DESC',
    } = queryParams;

    const offset = (Number(page) - 1) * Number(limit);
    const where = {};

    // Scope to seller or allow admin filtering
    if (user.role === 'admin') {
      if (vendor_id) {
        where.vendor_id = vendor_id;
      }
    } else {
      const vendor = await this.getApprovedVendorForUser(user);
      where.vendor_id = vendor.id;
    }

    // Status filtering
    if (status && status !== 'all') {
      where.status = status;
    }

    // Category filtering
    if (category_id) {
      where.category_id = category_id;
    }

    // Keyword search
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      where[Op.or] = [
        { name: { [Op.like]: term } },
        { sku: { [Op.like]: term } },
      ];
    }

    // Stock condition filtering
    if (filter === 'low_stock') {
      where[Op.and] = [
        sequelize.where(
          sequelize.col('Product.stock'),
          '<=',
          sequelize.col('Product.low_stock_threshold')
        ),
      ];
    } else if (filter === 'out_of_stock') {
      where.stock = 0;
    } else if (filter === 'in_stock') {
      where.stock = { [Op.gt]: 0 };
    }

    const { count, rows } = await Product.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [[sortBy, sortOrder.toUpperCase()]],
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug'],
        },
        {
          model: Vendor,
          as: 'vendor',
          attributes: ['id', 'store_name', 'store_slug', 'status'],
        },
      ],
    });

    // Compute inventory summary statistics
    const statsWhere = {};
    if (where.vendor_id) {
      statsWhere.vendor_id = where.vendor_id;
    }

    const allVendorProducts = await Product.findAll({
      where: statsWhere,
      attributes: ['id', 'stock', 'low_stock_threshold'],
    });

    let totalStockUnits = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    allVendorProducts.forEach((p) => {
      const stock = Number(p.stock || 0);
      const threshold = Number(p.low_stock_threshold !== undefined ? p.low_stock_threshold : 5);
      totalStockUnits += stock;
      if (stock === 0) {
        outOfStockCount++;
      }
      if (stock <= threshold) {
        lowStockCount++;
      }
    });

    const totalPages = Math.ceil(count / Number(limit)) || 1;

    return {
      products: rows.map((p) => p.toJSON()),
      summary: {
        total_products: allVendorProducts.length,
        total_stock_units: totalStockUnits,
        low_stock_count: lowStockCount,
        out_of_stock_count: outOfStockCount,
        in_stock_count: allVendorProducts.length - outOfStockCount,
      },
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages,
        hasNextPage: Number(page) < totalPages,
        hasPrevPage: Number(page) > 1,
      },
    };
  }

  /**
   * 2. Get Low Stock Products (Dedicated shortcut API)
   */
  async getLowStockProducts(user, queryParams = {}) {
    return this.getInventory(user, { ...queryParams, filter: 'low_stock' });
  }

  /**
   * 3. Get Stock Details for a Single Product
   */
  async getProductStockDetails(user, productId) {
    const product = await this.checkProductOwnership(user, productId);

    const fullProduct = await Product.findByPk(productId, {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug'],
        },
        {
          model: Vendor,
          as: 'vendor',
          attributes: ['id', 'store_name', 'store_slug', 'status'],
        },
        {
          model: InventoryLog,
          as: 'inventoryLogs',
          limit: 5,
          order: [
            ['created_at', 'DESC'],
            ['id', 'DESC'],
          ],
          include: [
            {
              model: User,
              as: 'actor',
              attributes: ['id', 'name', 'email', 'role'],
            },
          ],
        },
      ],
    });

    return fullProduct.toJSON();
  }

  /**
   * 4. Adjust Stock (Increase, Decrease, or Set) with Database Transaction and Row Locking
   */
  async adjustStock(user, productId, { action, quantity, reason }) {
    const t = await sequelize.transaction();

    try {
      // Row-level pessimistic locking to guarantee atomic concurrency safety and prevent overselling
      const product = await Product.findByPk(productId, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!product) {
        throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
      }

      // Check seller ownership if not admin
      if (user.role !== 'admin') {
        const vendor = await this.getApprovedVendorForUser(user);
        if (Number(product.vendor_id) !== Number(vendor.id)) {
          throw new AppError(
            'You are not authorized to modify stock for this product',
            403,
            'UNAUTHORIZED_PRODUCT_ACCESS'
          );
        }
      }

      const currentStock = Number(product.stock || 0);
      const qty = Number(quantity);
      const normalizedAction = String(action).toLowerCase();
      let newStock = currentStock;
      let changedQuantity = 0;
      let actionType = 'increase';

      if (normalizedAction === 'increase' || normalizedAction === 'increment') {
        newStock = currentStock + qty;
        changedQuantity = qty;
        actionType = 'increase';
      } else if (normalizedAction === 'decrease' || normalizedAction === 'decrement') {
        if (currentStock - qty < 0) {
          throw new AppError(
            `Insufficient stock. Current stock is ${currentStock}, cannot reduce by ${qty}. Stock cannot be negative.`,
            400,
            'INSUFFICIENT_STOCK'
          );
        }
        newStock = currentStock - qty;
        changedQuantity = -qty;
        actionType = 'decrease';
      } else if (normalizedAction === 'set') {
        if (qty < 0) {
          throw new AppError('Stock cannot be negative', 400, 'NEGATIVE_STOCK_NOT_ALLOWED');
        }
        newStock = qty;
        changedQuantity = newStock - currentStock;
        actionType = 'set';
      } else {
        throw new AppError("Action must be 'increase', 'decrease', or 'set'", 400, 'INVALID_ACTION');
      }

      // Atomic update
      product.stock = newStock;
      await product.save({ transaction: t });

      // Audit history creation inside the same transaction
      const log = await InventoryLog.create(
        {
          product_id: product.id,
          vendor_id: product.vendor_id,
          user_id: user.id,
          action_type: actionType,
          previous_stock: currentStock,
          changed_quantity: changedQuantity,
          new_stock: newStock,
          reason: reason.trim(),
        },
        { transaction: t }
      );

      await t.commit();

      const threshold = Number(product.low_stock_threshold !== undefined ? product.low_stock_threshold : 5);

      return {
        product_id: product.id,
        name: product.name,
        sku: product.sku,
        previous_stock: currentStock,
        changed_quantity: changedQuantity,
        new_stock: newStock,
        low_stock_threshold: threshold,
        is_low_stock: newStock <= threshold,
        action_type: actionType,
        reason: reason.trim(),
        log_id: log.id,
        updated_at: product.updated_at,
      };
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  /**
   * 5. Configure Low-Stock Threshold
   */
  async updateLowStockThreshold(user, productId, lowStockThreshold) {
    const product = await this.checkProductOwnership(user, productId);
    const prevThreshold = Number(product.low_stock_threshold !== undefined ? product.low_stock_threshold : 5);
    const newThreshold = Number(lowStockThreshold);

    if (newThreshold < 0) {
      throw new AppError('Low-stock threshold cannot be negative', 400, 'NEGATIVE_THRESHOLD_NOT_ALLOWED');
    }

    product.low_stock_threshold = newThreshold;
    await product.save();

    // Optionally record threshold change in inventory log
    await InventoryLog.create({
      product_id: product.id,
      vendor_id: product.vendor_id,
      user_id: user.id,
      action_type: 'threshold_update',
      previous_stock: Number(product.stock),
      changed_quantity: 0,
      new_stock: Number(product.stock),
      reason: `Low-stock threshold updated from ${prevThreshold} to ${newThreshold}`,
    });

    const isLowStock = Number(product.stock) <= newThreshold;

    return {
      product_id: product.id,
      name: product.name,
      sku: product.sku,
      current_stock: Number(product.stock),
      previous_threshold: prevThreshold,
      low_stock_threshold: newThreshold,
      is_low_stock: isLowStock,
      updated_at: product.updated_at,
    };
  }

  /**
   * 6. Get Stock Audit History for a Specific Product
   */
  async getProductStockHistory(user, productId, queryParams = {}) {
    await this.checkProductOwnership(user, productId);

    const { page = 1, limit = 20, action_type } = queryParams;
    const offset = (Number(page) - 1) * Number(limit);
    const where = { product_id: productId };

    if (action_type) {
      where.action_type = action_type;
    }

    const { count, rows } = await InventoryLog.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [
        ['created_at', 'DESC'],
        ['id', 'DESC'],
      ],
      include: [
        {
          model: User,
          as: 'actor',
          attributes: ['id', 'name', 'email', 'role'],
        },
      ],
    });

    const totalPages = Math.ceil(count / Number(limit)) || 1;

    return {
      product_id: Number(productId),
      logs: rows,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages,
        hasNextPage: Number(page) < totalPages,
        hasPrevPage: Number(page) > 1,
      },
    };
  }

  /**
   * 7. Get Recent Inventory Logs (Cross-product activity feed for Seller or Admin)
   */
  async getAllInventoryLogs(user, queryParams = {}) {
    const { page = 1, limit = 20, product_id, action_type } = queryParams;
    const offset = (Number(page) - 1) * Number(limit);
    const where = {};

    if (user.role !== 'admin') {
      const vendor = await this.getApprovedVendorForUser(user);
      where.vendor_id = vendor.id;
    }

    if (product_id) {
      where.product_id = product_id;
    }

    if (action_type) {
      where.action_type = action_type;
    }

    const { count, rows } = await InventoryLog.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [
        ['created_at', 'DESC'],
        ['id', 'DESC'],
      ],
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'sku', 'stock', 'low_stock_threshold'],
        },
        {
          model: User,
          as: 'actor',
          attributes: ['id', 'name', 'email', 'role'],
        },
        {
          model: Vendor,
          as: 'vendor',
          attributes: ['id', 'store_name', 'store_slug'],
        },
      ],
    });

    const totalPages = Math.ceil(count / Number(limit)) || 1;

    return {
      logs: rows,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages,
        hasNextPage: Number(page) < totalPages,
        hasPrevPage: Number(page) > 1,
      },
    };
  }
}

module.exports = new InventoryService();
