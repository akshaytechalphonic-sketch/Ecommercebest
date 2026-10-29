const {
  sequelize,
  Order,
  OrderItem,
  Payment,
  Commission,
  SellerPayout,
  Refund,
  Vendor,
  Product,
  Cart,
  CartItem,
  User,
  Address,
  Setting,
} = require('../models');
const { Op } = require('sequelize');

class FinancialService {
  /**
   * Helper: Generate unique human-readable tracking codes
   */
  generateCode(prefix = 'ORD') {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${dateStr}-${rand}`;
  }

  /**
   * Resolve effective commission rate for a vendor
   * Priority: 1. Vendor custom rate -> 2. Setting 'default_commission_rate' -> 3. Global default 10.00
   */
  async getEffectiveCommissionRate(vendorId) {
    if (vendorId) {
      const vendor = await Vendor.findByPk(vendorId, { attributes: ['id', 'commission_rate'] });
      if (vendor && vendor.commission_rate !== null && vendor.commission_rate !== undefined) {
        const vRate = parseFloat(vendor.commission_rate);
        if (!isNaN(vRate) && vRate >= 0) return vRate;
      }
    }

    try {
      const defaultSetting = await Setting.findOne({ where: { key: 'default_commission_rate' } });
      if (defaultSetting && defaultSetting.value) {
        const sRate = parseFloat(defaultSetting.value);
        if (!isNaN(sRate) && sRate >= 0) return sRate;
      }
    } catch (e) {
      // Fallback
    }

    return 10.00;
  }

  /**
   * Idempotent calculation and recording of vendor commission & net earning for an order item.
   * Handles database transactions, row-level locks, and prevents duplicate commission entries.
   */
  async calculateOrderItemCommission({ order, orderItem, status = 'pending', transaction = null }) {
    const grossAmount = parseFloat(orderItem.subtotal || orderItem.unit_price * orderItem.quantity);
    const discountAmount = parseFloat(orderItem.discount_amount || 0.00);
    const netAmount = Math.max(0, parseFloat((grossAmount - discountAmount).toFixed(2)));

    const commissionRate = await this.getEffectiveCommissionRate(orderItem.vendor_id);
    const commissionAmount = parseFloat(((netAmount * commissionRate) / 100).toFixed(2));
    const vendorEarning = parseFloat((netAmount - commissionAmount).toFixed(2));

    // Check if commission record already exists for this order item (idempotency check)
    let commission = await Commission.findOne({
      where: { order_item_id: orderItem.id },
      transaction,
      lock: transaction ? transaction.LOCK.UPDATE : undefined,
    });

    const isNowCrediting = (status === 'credited' || status === 'available');

    if (!commission) {
      commission = await Commission.create(
        {
          order_id: order.id,
          order_item_id: orderItem.id,
          vendor_id: orderItem.vendor_id,
          gross_amount: grossAmount,
          discount_amount: discountAmount,
          net_amount: netAmount,
          commission_rate: commissionRate,
          commission_amount: commissionAmount,
          vendor_earning: vendorEarning,
          status,
          settlement_status: 'unsettled',
          credited_at: isNowCrediting ? new Date() : null,
        },
        { transaction }
      );

      // If crediting immediately upon creation, increment vendor wallet
      if (isNowCrediting) {
        const vendor = await Vendor.findByPk(orderItem.vendor_id, {
          transaction,
          lock: transaction ? transaction.LOCK.UPDATE : undefined,
        });
        if (vendor) {
          await vendor.increment('wallet_balance', { by: vendorEarning, transaction });
        }
      }
    } else {
      // Existing record: only update and credit if transitioning from pending to credited/available
      const wasCredited =
        commission.status === 'credited' ||
        commission.status === 'available' ||
        commission.status === 'settled';

      if (!wasCredited && isNowCrediting) {
        await commission.update(
          {
            gross_amount: grossAmount,
            discount_amount: discountAmount,
            net_amount: netAmount,
            commission_rate: commissionRate,
            commission_amount: commissionAmount,
            vendor_earning: vendorEarning,
            status,
            credited_at: new Date(),
          },
          { transaction }
        );

        const vendor = await Vendor.findByPk(orderItem.vendor_id, {
          transaction,
          lock: transaction ? transaction.LOCK.UPDATE : undefined,
        });
        if (vendor) {
          await vendor.increment('wallet_balance', { by: vendorEarning, transaction });
        }
      } else if (!wasCredited && status === 'cancelled') {
        await commission.update(
          {
            status: 'cancelled',
            notes: 'Order cancelled before settlement',
          },
          { transaction }
        );
      }
    }

    return commission;
  }

  // =========================================================================
  // 1. ORDER CREATION & CHECKOUT
  // =========================================================================

  /**
   * Create an order from customer's active shopping cart
   */
  async createOrderFromCart(userId, { shipping_address_id = null, notes = null } = {}) {
    return await sequelize.transaction(async (t) => {
      // 1. Find cart with items & products
      const cart = await Cart.findOne({
        where: { user_id: userId },
        include: [
          {
            model: CartItem,
            as: 'items',
            include: [
              {
                model: Product,
                as: 'product',
                include: [{ model: Vendor, as: 'vendor' }],
              },
            ],
          },
        ],
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!cart || !cart.items || cart.items.length === 0) {
        const error = new Error('Your cart is empty. Please add products before placing an order.');
        error.statusCode = 400;
        throw error;
      }

      // 2. Validate items stock and availability
      let totalAmount = 0;
      const orderItemsData = [];

      for (const item of cart.items) {
        const product = item.product;
        if (!product || product.status !== 'active' || product.approval_status !== 'approved') {
          const error = new Error(`Product "${product ? product.name : 'Unknown'}" is currently unavailable.`);
          error.statusCode = 400;
          throw error;
        }

        if (product.stock < item.quantity) {
          const error = new Error(`Insufficient stock for "${product.name}". Available: ${product.stock}, requested: ${item.quantity}.`);
          error.statusCode = 400;
          throw error;
        }

        const unitPrice = parseFloat(product.price);
        const subtotal = parseFloat((unitPrice * item.quantity).toFixed(2));
        totalAmount += subtotal;

        orderItemsData.push({
          vendor_id: product.vendor_id,
          product_id: product.id,
          quantity: item.quantity,
          unit_price: unitPrice,
          subtotal,
          item_status: 'pending',
        });
      }

      totalAmount = parseFloat(totalAmount.toFixed(2));

      // 3. Create Order
      const orderNumber = this.generateCode('ORD');
      const order = await Order.create(
        {
          order_number: orderNumber,
          user_id: userId,
          shipping_address_id,
          total_amount: totalAmount,
          tax_amount: 0.00,
          shipping_fee: 0.00,
          discount_amount: 0.00,
          payment_status: 'pending',
          order_status: 'placed',
          notes,
        },
        { transaction: t }
      );

      // 4. Create OrderItems & Initial Pending Commission Records
      for (const itemData of orderItemsData) {
        const orderItem = await OrderItem.create(
          {
            ...itemData,
            order_id: order.id,
          },
          { transaction: t }
        );

        // Record initial pending commission for this item
        await this.calculateOrderItemCommission({
          order,
          orderItem,
          status: 'pending',
          transaction: t,
        });
      }

      // 5. Clear customer cart items
      await CartItem.destroy({
        where: { cart_id: cart.id },
        transaction: t,
      });

      return await Order.findByPk(order.id, {
        include: [
          {
            model: OrderItem,
            as: 'items',
            include: [{ model: Product, as: 'product' }, { model: Vendor, as: 'vendor' }],
          },
          { model: User, as: 'customer', attributes: ['id', 'name', 'email'] },
        ],
        transaction: t,
      });
    });
  }

  /**
   * Get Orders (for admin, vendor, or customer)
   */
  async getOrders({ user_id = null, vendor_id = null, status = null, payment_status = null, search = null, page = 1, limit = 10 } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    const where = {};
    if (user_id) where.user_id = user_id;
    if (status) where.order_status = status;
    if (payment_status) where.payment_status = payment_status;
    if (search) {
      where.order_number = { [Op.like]: `%${search.trim()}%` };
    }

    const itemInclude = {
      model: OrderItem,
      as: 'items',
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name', 'price', 'images'] },
        { model: Vendor, as: 'vendor', attributes: ['id', 'store_name', 'store_slug'] },
      ],
    };

    if (vendor_id) {
      itemInclude.where = { vendor_id };
    }

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [
        itemInclude,
        { model: User, as: 'customer', attributes: ['id', 'name', 'email', 'phone'] },
        { model: Payment, as: 'payments' },
      ],
      order: [['created_at', 'DESC']],
      distinct: true,
      limit: limitNum,
      offset,
    });

    return {
      orders: rows,
      pagination: {
        total: count,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(count / limitNum),
      },
    };
  }

  // =========================================================================
  // 2. PAYMENTS MANAGEMENT
  // =========================================================================

  /**
   * Process & Record Payment for an Order
   * Calculates commissions, credits vendor balances, and updates inventory
   */
  async recordPayment({ order_id, user_id, amount, payment_method = 'upi', gateway = 'razorpay', transaction_id = null, gateway_response = null }) {
    return await sequelize.transaction(async (t) => {
      // 1. Fetch Order with items & products
      const order = await Order.findByPk(order_id, {
        include: [
          {
            model: OrderItem,
            as: 'items',
            include: [{ model: Product, as: 'product' }, { model: Vendor, as: 'vendor' }],
          },
        ],
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!order) {
        const error = new Error('Order not found.');
        error.statusCode = 404;
        throw error;
      }

      if (order.payment_status === 'paid') {
        const error = new Error('Order has already been paid for.');
        error.statusCode = 400;
        throw error;
      }

      const txId = transaction_id || `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // 2. Create Payment Record
      const payment = await Payment.create(
        {
          order_id: order.id,
          user_id: user_id || order.user_id,
          amount: parseFloat(amount || order.total_amount),
          currency: 'INR',
          payment_method,
          gateway,
          transaction_id: txId,
          status: 'completed',
          gateway_response: gateway_response || { simulated: true, timestamp: new Date().toISOString() },
          paid_at: new Date(),
        },
        { transaction: t }
      );

      // 3. Update Order status
      await order.update(
        {
          payment_status: 'paid',
          order_status: 'confirmed',
        },
        { transaction: t }
      );

      // 4. Commission Transition to Available/Credited & Vendor Balance Credit (Idempotent)
      for (const item of order.items) {
        await this.calculateOrderItemCommission({
          order,
          orderItem: item,
          status: 'credited',
          transaction: t,
        });

        // Deduct product stock & log stock change
        if (item.product) {
          const newStock = Math.max(0, item.product.stock - item.quantity);
          await item.product.update({ stock: newStock }, { transaction: t });
        }

        // Update item status
        await item.update({ item_status: 'confirmed' }, { transaction: t });
      }

      return {
        payment,
        order,
      };
    });
  }

  /**
   * List all Payments with analytics and filters
   */
  async getPayments({ status = null, payment_method = null, search = null, page = 1, limit = 10 } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    const where = {};
    if (status) where.status = status;
    if (payment_method) where.payment_method = payment_method;
    if (search) {
      where[Op.or] = [
        { transaction_id: { [Op.like]: `%${search.trim()}%` } },
      ];
    }

    const { count, rows } = await Payment.findAndCountAll({
      where,
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'order_number', 'total_amount', 'payment_status', 'order_status'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone'],
        },
      ],
      order: [['created_at', 'DESC']],
      limit: limitNum,
      offset,
    });

    // Calculate aggregated metrics
    const [stats] = await sequelize.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) AS total_collected,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) AS total_pending,
        COALESCE(SUM(CASE WHEN status IN ('refunded', 'partially_refunded') THEN amount ELSE 0 END), 0) AS total_refunded,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) AS successful_count,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) AS failed_count
      FROM payments
    `);

    return {
      payments: rows,
      stats: {
        total_collected: parseFloat(stats[0]?.total_collected || 0).toFixed(2),
        total_pending: parseFloat(stats[0]?.total_pending || 0).toFixed(2),
        total_refunded: parseFloat(stats[0]?.total_refunded || 0).toFixed(2),
        successful_count: parseInt(stats[0]?.successful_count || 0, 10),
        failed_count: parseInt(stats[0]?.failed_count || 0, 10),
      },
      pagination: {
        total: count,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(count / limitNum),
      },
    };
  }

  // =========================================================================
  // 3. COMMISSION & VENDOR EARNINGS LEDGER
  // =========================================================================

  /**
   * List Commission Records with multi-status, settlement status, and date range filters
   */
  async getCommissions({
    vendor_id = null,
    status = null,
    settlement_status = null,
    start_date = null,
    end_date = null,
    search = null,
    page = 1,
    limit = 10,
  } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    const where = {};
    if (vendor_id) where.vendor_id = vendor_id;
    if (status) where.status = status;
    if (settlement_status) where.settlement_status = settlement_status;

    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at[Op.gte] = new Date(start_date);
      if (end_date) where.created_at[Op.lte] = new Date(end_date);
    }

    const orderWhere = {};
    if (search) {
      orderWhere.order_number = { [Op.like]: `%${search.trim()}%` };
    }

    const { count, rows } = await Commission.findAndCountAll({
      where,
      include: [
        {
          model: Vendor,
          as: 'vendor',
          attributes: ['id', 'store_name', 'store_slug', 'wallet_balance', 'total_withdrawn'],
        },
        {
          model: Order,
          as: 'order',
          where: Object.keys(orderWhere).length ? orderWhere : undefined,
          attributes: ['id', 'order_number', 'order_status', 'payment_status', 'created_at'],
        },
        {
          model: OrderItem,
          as: 'orderItem',
          include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'price', 'images'] }],
        },
      ],
      order: [['created_at', 'DESC']],
      limit: limitNum,
      offset,
      distinct: true,
    });

    const whereClauses = [];
    const replacements = {};

    if (vendor_id) {
      whereClauses.push('vendor_id = :vendor_id');
      replacements.vendor_id = parseInt(vendor_id, 10);
    }
    if (start_date) {
      whereClauses.push('created_at >= :start_date');
      replacements.start_date = new Date(start_date);
    }
    if (end_date) {
      whereClauses.push('created_at <= :end_date');
      replacements.end_date = new Date(end_date);
    }

    const statsWhereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const [totals] = await sequelize.query(`
      SELECT 
        COALESCE(SUM(gross_amount), 0) AS total_gross,
        COALESCE(SUM(discount_amount), 0) AS total_discount,
        COALESCE(SUM(net_amount), 0) AS total_net,
        COALESCE(SUM(CASE WHEN status IN ('credited', 'available', 'settled') THEN commission_amount ELSE 0 END), 0) AS total_commission_earned,
        COALESCE(SUM(CASE WHEN status IN ('credited', 'available', 'settled') THEN vendor_earning ELSE 0 END), 0) AS total_vendor_earnings,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN vendor_earning ELSE 0 END), 0) AS pending_earnings,
        COALESCE(SUM(CASE WHEN status IN ('credited', 'available') THEN vendor_earning ELSE 0 END), 0) AS available_earnings,
        COALESCE(SUM(CASE WHEN status = 'settled' OR settlement_status = 'settled' THEN vendor_earning ELSE 0 END), 0) AS settled_earnings,
        COALESCE(SUM(CASE WHEN status = 'refunded' THEN commission_amount ELSE 0 END), 0) AS refunded_commission,
        COALESCE(SUM(CASE WHEN status = 'cancelled' THEN commission_amount ELSE 0 END), 0) AS cancelled_commission,
        COUNT(DISTINCT order_id) AS total_orders
      FROM commissions
      ${statsWhereSql}
    `, { replacements });

    return {
      commissions: rows,
      stats: {
        total_gross: parseFloat(totals[0]?.total_gross || 0).toFixed(2),
        total_discount: parseFloat(totals[0]?.total_discount || 0).toFixed(2),
        total_net: parseFloat(totals[0]?.total_net || 0).toFixed(2),
        total_commission_earned: parseFloat(totals[0]?.total_commission_earned || 0).toFixed(2),
        total_vendor_earnings: parseFloat(totals[0]?.total_vendor_earnings || 0).toFixed(2),
        pending_earnings: parseFloat(totals[0]?.pending_earnings || 0).toFixed(2),
        available_earnings: parseFloat(totals[0]?.available_earnings || 0).toFixed(2),
        settled_earnings: parseFloat(totals[0]?.settled_earnings || 0).toFixed(2),
        refunded_commission: parseFloat(totals[0]?.refunded_commission || 0).toFixed(2),
        cancelled_commission: parseFloat(totals[0]?.cancelled_commission || 0).toFixed(2),
        total_orders: parseInt(totals[0]?.total_orders || 0, 10),
      },
      pagination: {
        total: count,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(count / limitNum),
      },
    };
  }

  /**
   * Get Vendor Financial Summary (Wallet Balance, Pending, Available, Settled & Lifetime Metrics)
   */
  async getVendorEarningsSummary(vendorId) {
    const vendor = await Vendor.findByPk(vendorId);
    if (!vendor) {
      const error = new Error('Vendor store not found.');
      error.statusCode = 404;
      throw error;
    }

    const [stats] = await sequelize.query(`
      SELECT
        COALESCE(SUM(gross_amount), 0) AS lifetime_gross,
        COALESCE(SUM(discount_amount), 0) AS lifetime_discount,
        COALESCE(SUM(net_amount), 0) AS lifetime_net,
        COALESCE(SUM(CASE WHEN status IN ('credited', 'available', 'settled') THEN commission_amount ELSE 0 END), 0) AS lifetime_commission_paid,
        COALESCE(SUM(CASE WHEN status IN ('credited', 'available', 'settled') THEN vendor_earning ELSE 0 END), 0) AS lifetime_earnings,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN vendor_earning ELSE 0 END), 0) AS pending_earnings,
        COALESCE(SUM(CASE WHEN status IN ('credited', 'available') THEN vendor_earning ELSE 0 END), 0) AS available_earnings,
        COALESCE(SUM(CASE WHEN status = 'settled' OR settlement_status = 'settled' THEN vendor_earning ELSE 0 END), 0) AS settled_earnings,
        COALESCE(SUM(CASE WHEN status = 'refunded' THEN vendor_earning ELSE 0 END), 0) AS refunded_earnings,
        COUNT(DISTINCT order_id) AS total_orders
      FROM commissions
      WHERE vendor_id = :vendorId
    `, { replacements: { vendorId } });

    const [payoutStats] = await sequelize.query(`
      SELECT
        COALESCE(SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END), 0) AS total_withdrawn,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) AS pending_payouts,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending_payout_count
      FROM seller_payouts
      WHERE vendor_id = :vendorId
    `, { replacements: { vendorId } });

    // Recent Settlements / Payouts history
    const recentSettlements = await SellerPayout.findAll({
      where: { vendor_id: vendorId },
      order: [['created_at', 'DESC']],
      limit: 5,
    });

    return {
      vendor: {
        id: vendor.id,
        store_name: vendor.store_name,
        store_slug: vendor.store_slug,
        wallet_balance: parseFloat(vendor.wallet_balance || 0).toFixed(2),
        total_withdrawn: parseFloat(vendor.total_withdrawn || 0).toFixed(2),
        commission_rate: parseFloat(vendor.commission_rate || 10.00),
      },
      earnings: {
        pending_earnings: parseFloat(stats[0]?.pending_earnings || 0).toFixed(2),
        available_earnings: parseFloat(vendor.wallet_balance || 0).toFixed(2),
        settled_earnings: parseFloat(vendor.total_withdrawn || payoutStats[0]?.total_withdrawn || 0).toFixed(2),
        refunded_earnings: parseFloat(stats[0]?.refunded_earnings || 0).toFixed(2),
      },
      lifetime: {
        gross_sales: parseFloat(stats[0]?.lifetime_gross || 0).toFixed(2),
        net_sales: parseFloat(stats[0]?.lifetime_net || 0).toFixed(2),
        commission_paid: parseFloat(stats[0]?.lifetime_commission_paid || 0).toFixed(2),
        net_earnings: parseFloat(stats[0]?.lifetime_earnings || 0).toFixed(2),
        total_orders: parseInt(stats[0]?.total_orders || 0, 10),
      },
      payouts: {
        total_withdrawn: parseFloat(vendor.total_withdrawn || payoutStats[0]?.total_withdrawn || 0).toFixed(2),
        pending_payouts: parseFloat(payoutStats[0]?.pending_payouts || 0).toFixed(2),
        pending_payout_count: parseInt(payoutStats[0]?.pending_payout_count || 0, 10),
      },
      recent_settlements: recentSettlements,
      effective_commission_rate: parseFloat(vendor.commission_rate || 10.00),
    };
  }

  /**
   * Overall platform commission reports and vendor-wise earnings breakdown (Admin Only)
   */
  async getCommissionReportsOverview({ start_date = null, end_date = null } = {}) {
    const whereClauses = [];
    const replacements = {};

    if (start_date) {
      whereClauses.push('created_at >= :start_date');
      replacements.start_date = new Date(start_date);
    }
    if (end_date) {
      whereClauses.push('created_at <= :end_date');
      replacements.end_date = new Date(end_date);
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const [overall] = await sequelize.query(`
      SELECT
        COALESCE(SUM(gross_amount), 0) AS total_gmv,
        COALESCE(SUM(discount_amount), 0) AS total_discount,
        COALESCE(SUM(net_amount), 0) AS total_net_volume,
        COALESCE(SUM(CASE WHEN status IN ('credited', 'available', 'settled') THEN commission_amount ELSE 0 END), 0) AS total_commission_earned,
        COALESCE(SUM(CASE WHEN status IN ('credited', 'available', 'settled') THEN vendor_earning ELSE 0 END), 0) AS total_vendor_earnings,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN vendor_earning ELSE 0 END), 0) AS pending_vendor_earnings,
        COALESCE(SUM(CASE WHEN status = 'refunded' THEN commission_amount ELSE 0 END), 0) AS refunded_commission,
        COUNT(DISTINCT order_id) AS total_orders_with_commission,
        COUNT(DISTINCT vendor_id) AS active_vendors_count
      FROM commissions
      ${whereSql}
    `, { replacements });

    const [vendorBreakdown] = await sequelize.query(`
      SELECT
        v.id AS vendor_id,
        v.store_name,
        v.commission_rate,
        v.wallet_balance,
        v.total_withdrawn,
        COUNT(c.id) AS total_items_sold,
        COUNT(DISTINCT c.order_id) AS total_orders,
        COALESCE(SUM(c.gross_amount), 0) AS gross_sales,
        COALESCE(SUM(CASE WHEN c.status IN ('credited', 'available', 'settled') THEN c.commission_amount ELSE 0 END), 0) AS total_commission_paid,
        COALESCE(SUM(CASE WHEN c.status IN ('credited', 'available', 'settled') THEN c.vendor_earning ELSE 0 END), 0) AS net_vendor_earnings,
        COALESCE(SUM(CASE WHEN c.status = 'pending' THEN c.vendor_earning ELSE 0 END), 0) AS pending_earnings
      FROM vendors v
      LEFT JOIN commissions c ON v.id = c.vendor_id ${start_date ? 'AND c.created_at >= :start_date' : ''} ${end_date ? 'AND c.created_at <= :end_date' : ''}
      GROUP BY v.id, v.store_name, v.commission_rate, v.wallet_balance, v.total_withdrawn
      ORDER BY net_vendor_earnings DESC
    `, { replacements });

    const summaryData = {
      total_gmv: parseFloat(overall[0]?.total_gmv || 0).toFixed(2),
      total_discount: parseFloat(overall[0]?.total_discount || 0).toFixed(2),
      total_net_volume: parseFloat(overall[0]?.total_net_volume || 0).toFixed(2),
      total_commission_earned: parseFloat(overall[0]?.total_commission_earned || 0).toFixed(2),
      total_vendor_earnings: parseFloat(overall[0]?.total_vendor_earnings || 0).toFixed(2),
      pending_vendor_earnings: parseFloat(overall[0]?.pending_vendor_earnings || 0).toFixed(2),
      refunded_commission: parseFloat(overall[0]?.refunded_commission || 0).toFixed(2),
      total_orders_with_commission: parseInt(overall[0]?.total_orders_with_commission || 0, 10),
      active_vendors_count: parseInt(overall[0]?.active_vendors_count || 0, 10),
    };

    return {
      overview: summaryData,
      platform_summary: summaryData,
      vendor_breakdown: vendorBreakdown.map((v) => ({
        vendor_id: v.vendor_id,
        store_name: v.store_name,
        commission_rate: parseFloat(v.commission_rate || 10.00),
        wallet_balance: parseFloat(v.wallet_balance || 0).toFixed(2),
        total_withdrawn: parseFloat(v.total_withdrawn || 0).toFixed(2),
        total_items_sold: parseInt(v.total_items_sold || 0, 10),
        total_orders: parseInt(v.total_orders || 0, 10),
        gross_sales: parseFloat(v.gross_sales || 0).toFixed(2),
        total_commission_paid: parseFloat(v.total_commission_paid || 0).toFixed(2),
        net_vendor_earnings: parseFloat(v.net_vendor_earnings || 0).toFixed(2),
        pending_earnings: parseFloat(v.pending_earnings || 0).toFixed(2),
      })),
    };
  }

  /**
   * Cancel an order with full inventory and commission/earnings adjustment
   */
  async cancelOrder(orderId, { reason = 'Order cancelled', userRole = 'admin', userId = null } = {}) {
    return await sequelize.transaction(async (t) => {
      const order = await Order.findByPk(orderId, {
        include: [
          {
            model: OrderItem,
            as: 'items',
            include: [{ model: Product, as: 'product' }, { model: Commission, as: 'commission' }],
          },
        ],
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!order) {
        const error = new Error('Order not found.');
        error.statusCode = 404;
        throw error;
      }

      if (order.order_status === 'cancelled') {
        const error = new Error('Order has already been cancelled.');
        error.statusCode = 400;
        throw error;
      }

      if (order.order_status === 'delivered') {
        const error = new Error('Delivered orders cannot be cancelled directly. Please initiate a return/refund.');
        error.statusCode = 400;
        throw error;
      }

      // Check authorization if called by customer
      if (userRole === 'customer' && order.user_id !== userId) {
        const error = new Error('Unauthorized to cancel this order.');
        error.statusCode = 403;
        throw error;
      }

      // Update order status
      await order.update(
        {
          order_status: 'cancelled',
          notes: order.notes ? `${order.notes} | Cancelled: ${reason}` : `Cancelled: ${reason}`,
        },
        { transaction: t }
      );

      // Adjust commissions and vendor earnings
      for (const item of order.items) {
        await item.update({ item_status: 'cancelled' }, { transaction: t });

        // Restock inventory
        if (item.product) {
          await item.product.increment('stock', { by: item.quantity, transaction: t });
        }

        const commission = item.commission;
        if (commission) {
          // If already credited to vendor wallet, deduct it
          if (commission.status === 'credited' || commission.status === 'available') {
            const vendor = await Vendor.findByPk(commission.vendor_id, {
              transaction: t,
              lock: t.LOCK.UPDATE,
            });
            if (vendor) {
              await vendor.decrement('wallet_balance', {
                by: parseFloat(commission.vendor_earning),
                transaction: t,
              });
            }
          }

          await commission.update(
            {
              status: 'cancelled',
              notes: `Order cancelled. Reason: ${reason}`,
            },
            { transaction: t }
          );
        }
      }

      return order;
    });
  }

  // =========================================================================
  // 4. WITHDRAWALS & SETTLEMENT MANAGEMENT (SELLER PAYOUTS)
  // =========================================================================

  /**
   * Vendor requests a payout/withdrawal
   */
  async requestWithdrawal(vendorId, { amount, payout_method = 'bank_transfer', account_details = null }) {
    return await sequelize.transaction(async (t) => {
      const vendor = await Vendor.findByPk(vendorId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!vendor) {
        const error = new Error('Vendor not found.');
        error.statusCode = 404;
        throw error;
      }

      if (vendor.status !== 'approved') {
        const error = new Error('Only approved vendors can request withdrawals.');
        error.statusCode = 403;
        throw error;
      }

      const withdrawAmount = parseFloat(amount);
      if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
        const error = new Error('Invalid withdrawal amount.');
        error.statusCode = 400;
        throw error;
      }

      const currentBalance = parseFloat(vendor.wallet_balance || 0);
      if (withdrawAmount > currentBalance) {
        const error = new Error(`Insufficient wallet balance. Available: ₹${currentBalance.toFixed(2)}, requested: ₹${withdrawAmount.toFixed(2)}.`);
        error.statusCode = 400;
        throw error;
      }

      const minPayout = 100.00;
      if (withdrawAmount < minPayout) {
        const error = new Error(`Minimum payout request amount is ₹${minPayout}.`);
        error.statusCode = 400;
        throw error;
      }

      // 1. Deduct amount from vendor wallet balance to hold in escrow
      await vendor.decrement('wallet_balance', { by: withdrawAmount, transaction: t });

      // 2. Prepare bank details fallback from vendor profile
      const details = account_details || {
        bank_name: vendor.bank_name,
        bank_account_name: vendor.bank_account_name,
        bank_account_number: vendor.bank_account_number,
        bank_ifsc_code: vendor.bank_ifsc_code,
      };

      // 3. Create SellerPayout record
      const payoutNumber = this.generateCode('PAY');
      const payout = await SellerPayout.create(
        {
          payout_number: payoutNumber,
          vendor_id: vendor.id,
          amount: withdrawAmount,
          payout_method,
          account_details: details,
          status: 'pending',
          requested_at: new Date(),
        },
        { transaction: t }
      );

      return payout;
    });
  }

  /**
   * List Withdrawals (Admin or Vendor)
   */
  async getWithdrawals({ vendor_id = null, status = null, page = 1, limit = 10 } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    const where = {};
    if (vendor_id) where.vendor_id = vendor_id;
    if (status) where.status = status;

    const { count, rows } = await SellerPayout.findAndCountAll({
      where,
      include: [
        {
          model: Vendor,
          as: 'vendor',
          attributes: ['id', 'store_name', 'store_slug', 'wallet_balance', 'total_withdrawn'],
        },
      ],
      order: [['requested_at', 'DESC']],
      limit: limitNum,
      offset,
    });

    const [stats] = await sequelize.query(`
      SELECT
        COALESCE(SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END), 0) AS total_settled,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) AS total_pending_settlement,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending_count
      FROM seller_payouts
      ${vendor_id ? `WHERE vendor_id = ${parseInt(vendor_id, 10)}` : ''}
    `);

    return {
      payouts: rows,
      stats: {
        total_settled: parseFloat(stats[0]?.total_settled || 0).toFixed(2),
        total_pending_settlement: parseFloat(stats[0]?.total_pending_settlement || 0).toFixed(2),
        pending_count: parseInt(stats[0]?.pending_count || 0, 10),
      },
      pagination: {
        total: count,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(count / limitNum),
      },
    };
  }

  /**
   * Admin approves or rejects a withdrawal request
   */
  async processWithdrawal(payoutId, adminUserIdOrPayload, maybePayload = {}) {
    const payload = typeof adminUserIdOrPayload === 'object' && adminUserIdOrPayload !== null ? adminUserIdOrPayload : maybePayload;
    const { action, transaction_reference = null, rejection_reason = null, admin_notes = null } = payload;

    return await sequelize.transaction(async (t) => {
      const payout = await SellerPayout.findByPk(payoutId, {
        include: [{ model: Vendor, as: 'vendor' }],
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!payout) {
        const error = new Error('Withdrawal request not found.');
        error.statusCode = 404;
        throw error;
      }

      if (payout.status !== 'pending') {
        const error = new Error(`Withdrawal request has already been ${payout.status}.`);
        error.statusCode = 400;
        throw error;
      }

      const vendor = payout.vendor;
      const payoutAmount = parseFloat(payout.amount);

      if (action === 'approve') {
        // Mark as approved & update total withdrawn
        await payout.update(
          {
            status: 'approved',
            transaction_reference: transaction_reference || `TXN-SETTLE-${Date.now()}`,
            admin_notes,
            processed_at: new Date(),
          },
          { transaction: t }
        );

        if (vendor) {
          await vendor.increment('total_withdrawn', { by: payoutAmount, transaction: t });

          // Transition vendor's unsettled credited/available commissions to settled
          await Commission.update(
            {
              settlement_status: 'settled',
              status: 'settled',
              settled_at: new Date(),
              notes: payout.transaction_reference
                ? `Settled via payout #${payout.payout_number} (Ref: ${payout.transaction_reference})`
                : `Settled via payout #${payout.payout_number}`,
            },
            {
              where: {
                vendor_id: vendor.id,
                settlement_status: 'unsettled',
                status: { [Op.in]: ['credited', 'available'] },
              },
              transaction: t,
            }
          );
        }
      } else if (action === 'reject') {
        // Revert held amount back to vendor balance
        await payout.update(
          {
            status: 'rejected',
            rejection_reason: rejection_reason || 'Rejected by marketplace administration',
            admin_notes,
            processed_at: new Date(),
          },
          { transaction: t }
        );

        if (vendor) {
          await vendor.increment('wallet_balance', { by: payoutAmount, transaction: t });
        }
      } else {
        const error = new Error('Invalid action. Must be "approve" or "reject".');
        error.statusCode = 400;
        throw error;
      }

      return payout;
    });
  }

  // =========================================================================
  // 5. RETURNS & REFUNDS MANAGEMENT
  // =========================================================================

  /**
   * Request a return / refund for an order or order item
   */
  async requestRefund(userId, { order_id, order_item_id = null, reason, amount = null }) {
    return await sequelize.transaction(async (t) => {
      const order = await Order.findOne({
        where: { id: order_id, user_id: userId },
        include: [
          {
            model: OrderItem,
            as: 'items',
            include: [{ model: Product, as: 'product' }, { model: Vendor, as: 'vendor' }],
          },
          { model: Payment, as: 'payments' },
        ],
        transaction: t,
      });

      if (!order) {
        const error = new Error('Order not found or access denied.');
        error.statusCode = 404;
        throw error;
      }

      if (order.payment_status !== 'paid') {
        const error = new Error('Only paid orders can be returned or refunded.');
        error.statusCode = 400;
        throw error;
      }

      // Determine vendor and refund amount
      let targetItem = null;
      let vendorId = null;
      let refundAmount = 0;

      if (order_item_id) {
        targetItem = order.items.find((i) => i.id == order_item_id);
        if (!targetItem) {
          const error = new Error('Order item not found.');
          error.statusCode = 404;
          throw error;
        }
        vendorId = targetItem.vendor_id;
        refundAmount = amount ? parseFloat(amount) : parseFloat(targetItem.subtotal);
      } else {
        // Entire order refund
        vendorId = order.items[0]?.vendor_id;
        refundAmount = amount ? parseFloat(amount) : parseFloat(order.total_amount);
      }

      const completedPayment = order.payments.find((p) => p.status === 'completed');

      const refundNumber = this.generateCode('REF');
      const refund = await Refund.create(
        {
          refund_number: refundNumber,
          order_id: order.id,
          order_item_id: targetItem ? targetItem.id : null,
          payment_id: completedPayment ? completedPayment.id : null,
          user_id: userId,
          vendor_id: vendorId,
          amount: refundAmount,
          reason,
          status: 'requested',
        },
        { transaction: t }
      );

      return refund;
    });
  }

  /**
   * List Refunds (Admin or Vendor or Customer)
   */
  async getRefunds({ user_id = null, vendor_id = null, status = null, page = 1, limit = 10 } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    const where = {};
    if (user_id) where.user_id = user_id;
    if (vendor_id) where.vendor_id = vendor_id;
    if (status) where.status = status;

    const { count, rows } = await Refund.findAndCountAll({
      where,
      include: [
        { model: Order, as: 'order', attributes: ['id', 'order_number', 'total_amount'] },
        { model: Vendor, as: 'vendor', attributes: ['id', 'store_name', 'store_slug'] },
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        {
          model: OrderItem,
          as: 'orderItem',
          include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'price'] }],
        },
      ],
      order: [['created_at', 'DESC']],
      limit: limitNum,
      offset,
    });

    const [stats] = await sequelize.query(`
      SELECT
        COALESCE(SUM(CASE WHEN status = 'refunded' THEN amount ELSE 0 END), 0) AS total_refunded_amount,
        COUNT(CASE WHEN status = 'requested' THEN 1 END) AS pending_request_count
      FROM refunds
      ${vendor_id ? `WHERE vendor_id = ${parseInt(vendor_id, 10)}` : ''}
    `);

    return {
      refunds: rows,
      stats: {
        total_refunded_amount: parseFloat(stats[0]?.total_refunded_amount || 0).toFixed(2),
        pending_request_count: parseInt(stats[0]?.pending_request_count || 0, 10),
      },
      pagination: {
        total: count,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(count / limitNum),
      },
    };
  }

  /**
   * Admin approves or rejects a refund
   * On approval: reverses vendor balance, updates commission status, restocks product, updates payment
   */
  async processRefund(refundId, { action, rejection_reason = null, gateway_refund_id = null }) {
    return await sequelize.transaction(async (t) => {
      const refund = await Refund.findByPk(refundId, {
        include: [
          { model: Order, as: 'order' },
          { model: Vendor, as: 'vendor' },
          { model: OrderItem, as: 'orderItem', include: [{ model: Product, as: 'product' }] },
          { model: Payment, as: 'payment' },
        ],
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!refund) {
        const error = new Error('Refund record not found.');
        error.statusCode = 404;
        throw error;
      }

      if (refund.status !== 'requested') {
        const error = new Error(`Refund has already been ${refund.status}.`);
        error.statusCode = 400;
        throw error;
      }

      if (action === 'approve') {
        const vendor = refund.vendor;
        const refundAmount = parseFloat(refund.amount);

        // Find associated commission record for this order/order_item
        const commissionWhere = { order_id: refund.order_id, vendor_id: refund.vendor_id };
        if (refund.order_item_id) {
          commissionWhere.order_item_id = refund.order_item_id;
        }

        const commission = await Commission.findOne({
          where: commissionWhere,
          transaction: t,
          lock: t.LOCK.UPDATE,
        });

        let vendorEarningToDeduct = refundAmount;
        let commissionReversed = 0;

        if (commission && commission.status === 'credited') {
          vendorEarningToDeduct = parseFloat(commission.vendor_earning);
          commissionReversed = parseFloat(commission.commission_amount);
          await commission.update({ status: 'refunded' }, { transaction: t });
        }

        // Deduct vendor earnings from wallet balance
        if (vendor) {
          await vendor.decrement('wallet_balance', { by: vendorEarningToDeduct, transaction: t });
        }

        // Restock product inventory if item was returned
        if (refund.orderItem && refund.orderItem.product) {
          await refund.orderItem.product.increment('stock', {
            by: refund.orderItem.quantity,
            transaction: t,
          });
          await refund.orderItem.update({ item_status: 'refunded' }, { transaction: t });
        }

        // Update payment status
        if (refund.payment) {
          await refund.payment.update({ status: 'refunded' }, { transaction: t });
        }

        // Update order status
        if (refund.order) {
          await refund.order.update({ payment_status: 'refunded', order_status: 'returned' }, { transaction: t });
        }

        // Finalize refund record
        await refund.update(
          {
            status: 'refunded',
            vendor_balance_deducted: vendorEarningToDeduct,
            commission_reversed: commissionReversed,
            gateway_refund_id: gateway_refund_id || `RFD-GATEWAY-${Date.now()}`,
            processed_at: new Date(),
          },
          { transaction: t }
        );
      } else if (action === 'reject') {
        await refund.update(
          {
            status: 'rejected',
            rejection_reason: rejection_reason || 'Refund rejected by marketplace administration',
            processed_at: new Date(),
          },
          { transaction: t }
        );
      } else {
        const error = new Error('Invalid action. Must be "approve" or "reject".');
        error.statusCode = 400;
        throw error;
      }

      return refund;
    });
  }
}

module.exports = new FinancialService();
