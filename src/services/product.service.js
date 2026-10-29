const { Op } = require('sequelize');
const { Product, Vendor, Category, User } = require('../models');
const { AppError } = require('../middleware/error.middleware');

class ProductService {
  /**
   * Helper: Ensure authenticated user owns an approved vendor profile
   */
  async getApprovedVendorByUserId(userId) {
    const vendor = await Vendor.findOne({
      where: { user_id: userId },
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
        `Only approved sellers can add and manage products. Your store application is currently '${vendor.status}'.`,
        403,
        'VENDOR_NOT_APPROVED'
      );
    }

    return vendor;
  }

  /**
   * Helper: Generate unique URL-friendly slug for products
   */
  async generateUniqueSlug(baseText, currentProductId = null, transaction = null) {
    let slug = Product.slugify(baseText);
    if (!slug) {
      slug = 'product-' + Math.floor(1000 + Math.random() * 9000);
    }

    let candidate = slug;
    let count = 1;

    while (true) {
      const where = { slug: candidate };
      if (currentProductId) {
        where.id = { [Op.ne]: currentProductId };
      }

      const existing = await Product.findOne({
        where,
        transaction,
      });

      if (!existing) {
        return candidate;
      }

      count += 1;
      candidate = `${slug}-${count}`;
    }
  }

  /**
   * Helper: Validate Category and Subcategory Hierarchy
   */
  async validateCategoryHierarchy(categoryId, subcategoryId = null) {
    const category = await Category.findByPk(categoryId);
    if (!category) {
      throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
    }

    if (category.status !== 'active') {
      throw new AppError('The selected category is inactive', 400, 'CATEGORY_INACTIVE');
    }

    if (subcategoryId) {
      const subcategory = await Category.findByPk(subcategoryId);
      if (!subcategory) {
        throw new AppError('Subcategory not found', 404, 'SUBCATEGORY_NOT_FOUND');
      }

      if (subcategory.status !== 'active') {
        throw new AppError('The selected subcategory is inactive', 400, 'SUBCATEGORY_INACTIVE');
      }

      if (Number(subcategory.parent_id) !== Number(category.id)) {
        throw new AppError(
          'The specified subcategory does not belong to the selected parent category',
          400,
          'INVALID_SUBCATEGORY_PARENT'
        );
      }
    }
  }

  /**
   * 1. Seller: Create a New Product
   */
  async createProduct(user, productData) {
    let vendor;
    if (user.role === 'admin') {
      if (productData.vendor_id) {
        vendor = await Vendor.findByPk(productData.vendor_id);
        if (!vendor) {
          throw new AppError('Specified vendor store was not found', 404, 'VENDOR_NOT_FOUND');
        }
      } else {
        vendor = await Vendor.findOne({ where: { user_id: user.id } });
        if (!vendor) {
          vendor = await Vendor.findOne({ where: { status: 'approved' } });
        }
        if (!vendor) {
          vendor = await Vendor.create({
            user_id: user.id,
            store_name: 'Marketplace Official Store',
            store_slug: 'marketplace-official-store',
            status: 'approved',
            approved_at: new Date(),
            commission_rate: 0,
          });
        }
      }
    } else {
      vendor = await this.getApprovedVendorByUserId(user.id);
    }

    // Validate SKU uniqueness
    const existingSku = await Product.findOne({
      where: { sku: productData.sku.trim() },
    });
    if (existingSku) {
      throw new AppError(
        'A product with this SKU already exists',
        409,
        'DUPLICATE_SKU',
        [{ field: 'sku', message: 'SKU must be unique' }]
      );
    }

    // Validate category & subcategory hierarchy
    await this.validateCategoryHierarchy(
      productData.category_id,
      productData.subcategory_id
    );

    // Slug generation or uniqueness validation
    let finalSlug;
    if (productData.slug) {
      finalSlug = Product.slugify(productData.slug);
      const existingSlug = await Product.findOne({ where: { slug: finalSlug } });
      if (existingSlug) {
        throw new AppError(
          'Product slug is already in use',
          409,
          'DUPLICATE_SLUG',
          [{ field: 'slug', message: 'Slug already in use' }]
        );
      }
    } else {
      finalSlug = await this.generateUniqueSlug(productData.name);
    }

    // Admin created products are approved immediately, seller products default to pending
    const approvalStatus = user.role === 'admin' ? 'approved' : 'pending';

    const product = await Product.create({
      vendor_id: vendor.id,
      category_id: productData.category_id,
      subcategory_id: productData.subcategory_id || null,
      name: productData.name.trim(),
      slug: finalSlug,
      description: productData.description || null,
      images: productData.images || [],
      price: productData.price,
      discount_price: productData.discount_price ?? null,
      sku: productData.sku.trim(),
      stock: productData.stock ?? 0,
      status: productData.status || 'active',
      approval_status: approvalStatus,
      rejection_reason: null,
    });

    return this.getProductById(product.id);
  }

  /**
   * Helper: Retrieve Product by ID with associations
   */
  async getProductById(id) {
    const product = await Product.findByPk(id, {
      include: [
        {
          model: Vendor,
          as: 'vendor',
          attributes: ['id', 'store_name', 'store_slug', 'store_email', 'store_phone', 'logo_url', 'status'],
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug', 'status'],
        },
        {
          model: Category,
          as: 'subcategory',
          attributes: ['id', 'name', 'slug', 'status'],
        },
      ],
    });

    if (!product) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }

    return product;
  }

  /**
   * 2. Seller: List My Products
   */
  async getSellerProducts(user, queryParams = {}) {
    const vendor = await this.getApprovedVendorByUserId(user.id);
    const {
      page = 1,
      limit = 10,
      status,
      approval_status,
      category_id,
      subcategory_id,
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = queryParams;

    const offset = (Number(page) - 1) * Number(limit);
    const where = { vendor_id: vendor.id };

    if (status) {
      where.status = status;
    }
    if (approval_status) {
      where.approval_status = approval_status;
    }
    if (category_id) {
      where.category_id = category_id;
    }
    if (subcategory_id) {
      where.subcategory_id = subcategory_id;
    }
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { sku: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
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
          model: Category,
          as: 'subcategory',
          attributes: ['id', 'name', 'slug'],
        },
      ],
    });

    const totalPages = Math.ceil(count / Number(limit)) || 1;

    return {
      products: rows,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages,
      },
    };
  }

  /**
   * 3. Seller: Get Single Product Details (Ownership Enforced)
   */
  async getSellerProductById(user, productId) {
    const product = await this.getProductById(productId);

    if (user.role !== 'admin') {
      const vendor = await this.getApprovedVendorByUserId(user.id);
      if (Number(product.vendor_id) !== Number(vendor.id)) {
        throw new AppError(
          'You are not authorized to view or manage this product',
          403,
          'UNAUTHORIZED_PRODUCT_ACCESS'
        );
      }
    }

    return product;
  }

  /**
   * 4. Seller: Update Product (Ownership Enforced)
   */
  async updateSellerProduct(user, productId, updateData) {
    const product = await Product.findByPk(productId);

    if (!product) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }

    if (user.role !== 'admin') {
      const vendor = await this.getApprovedVendorByUserId(user.id);
      if (Number(product.vendor_id) !== Number(vendor.id)) {
        throw new AppError(
          'You are not authorized to modify this product',
          403,
          'UNAUTHORIZED_PRODUCT_ACCESS'
        );
      }
    }

    // Check SKU uniqueness if changed
    if (updateData.sku && updateData.sku.trim() !== product.sku) {
      const existingSku = await Product.findOne({
        where: {
          sku: updateData.sku.trim(),
          id: { [Op.ne]: product.id },
        },
      });
      if (existingSku) {
        throw new AppError(
          'A product with this SKU already exists',
          409,
          'DUPLICATE_SKU',
          [{ field: 'sku', message: 'SKU must be unique' }]
        );
      }
    }

    // Category / Subcategory validation if updated
    const targetCategoryId = updateData.category_id || product.category_id;
    const targetSubcategoryId =
      updateData.subcategory_id !== undefined
        ? updateData.subcategory_id
        : product.subcategory_id;

    if (
      updateData.category_id !== undefined ||
      updateData.subcategory_id !== undefined
    ) {
      await this.validateCategoryHierarchy(targetCategoryId, targetSubcategoryId);
    }

    // Slug update or generation
    let finalSlug = product.slug;
    if (updateData.slug) {
      finalSlug = Product.slugify(updateData.slug);
      const existingSlug = await Product.findOne({
        where: {
          slug: finalSlug,
          id: { [Op.ne]: product.id },
        },
      });
      if (existingSlug) {
        throw new AppError(
          'Product slug is already in use',
          409,
          'DUPLICATE_SLUG',
          [{ field: 'slug', message: 'Slug already in use' }]
        );
      }
    } else if (updateData.name && updateData.name.trim() !== product.name) {
      finalSlug = await this.generateUniqueSlug(updateData.name, product.id);
    }

    // Strip unauthorized admin-only fields if provided by seller
    delete updateData.approval_status;
    delete updateData.rejection_reason;
    delete updateData.vendor_id;

    // If product was previously rejected and seller updates details, re-submit for review
    const newApprovalStatus =
      product.approval_status === 'rejected' ? 'pending' : product.approval_status;
    const newRejectionReason =
      product.approval_status === 'rejected' ? null : product.rejection_reason;

    await product.update({
      ...updateData,
      slug: finalSlug,
      approval_status: newApprovalStatus,
      rejection_reason: newRejectionReason,
    });

    return this.getProductById(product.id);
  }

  /**
   * 5. Seller: Delete or Deactivate Product (Ownership Enforced)
   */
  async deleteSellerProduct(user, productId, { deactivate = false } = {}) {
    const product = await Product.findByPk(productId);

    if (!product) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }

    if (user.role !== 'admin') {
      const vendor = await this.getApprovedVendorByUserId(user.id);
      if (Number(product.vendor_id) !== Number(vendor.id)) {
        throw new AppError(
          'You are not authorized to delete this product',
          403,
          'UNAUTHORIZED_PRODUCT_ACCESS'
        );
      }
    }

    if (deactivate) {
      await product.update({ status: 'inactive' });
      return {
        message: 'Product deactivated successfully',
        id: product.id,
        status: 'inactive',
        deactivated: true,
      };
    }

    await product.destroy();
    return {
      message: 'Product deleted permanently',
      id: Number(productId),
    };
  }

  /**
   * 6. Admin: List All Products with Filters & Pagination
   */
  async adminListProducts(queryParams = {}) {
    const {
      page = 1,
      limit = 10,
      vendor_id,
      category_id,
      subcategory_id,
      status,
      approval_status,
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = queryParams;

    const offset = (Number(page) - 1) * Number(limit);
    const where = {};

    if (vendor_id) {
      where.vendor_id = vendor_id;
    }
    if (category_id) {
      where.category_id = category_id;
    }
    if (subcategory_id) {
      where.subcategory_id = subcategory_id;
    }
    if (status) {
      where.status = status;
    }
    if (approval_status) {
      where.approval_status = approval_status;
    }
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { sku: { [Op.like]: `%${search}%` } },
        { slug: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Product.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [[sortBy, sortOrder.toUpperCase()]],
      include: [
        {
          model: Vendor,
          as: 'vendor',
          attributes: ['id', 'store_name', 'store_slug', 'store_email', 'status'],
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug'],
        },
        {
          model: Category,
          as: 'subcategory',
          attributes: ['id', 'name', 'slug'],
        },
      ],
    });

    const totalPages = Math.ceil(count / Number(limit)) || 1;

    return {
      products: rows,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages,
      },
    };
  }

  /**
   * 7. Admin: Approve or Reject a Product
   */
  async adminUpdateProductApproval(productId, { approval_status, rejection_reason }) {
    const product = await Product.findByPk(productId);

    if (!product) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }

    if (approval_status === 'rejected' && (!rejection_reason || !rejection_reason.trim())) {
      throw new AppError(
        'Rejection reason is required when rejecting a product',
        400,
        'REJECTION_REASON_REQUIRED'
      );
    }

    await product.update({
      approval_status,
      rejection_reason: approval_status === 'rejected' ? rejection_reason.trim() : null,
    });

    return this.getProductById(product.id);
  }

  /**
   * 8. Public Catalog: List & Search Active & Approved Products
   */
  async getPublicProducts(queryParams = {}) {
    const {
      page = 1,
      limit = 12,
      category_id,
      subcategory_id,
      category_slug,
      category,
      subcategory_slug,
      subcategory,
      vendor_id,
      search,
      name,
      q,
      min_price,
      max_price,
      in_stock,
      sort,
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = queryParams;

    const offset = (Number(page) - 1) * Number(limit);

    // Dynamic AND conditions
    const andConditions = [
      { status: 'active' },
      { approval_status: 'approved' },
    ];

    // Resolve Category ID if slug/name provided
    let resolvedCategoryId = category_id;
    const catIdentifier = category_slug || category;
    if (!resolvedCategoryId && catIdentifier) {
      const isNum = /^\d+$/.test(catIdentifier);
      const cat = await Category.findOne({
        where: isNum
          ? { id: Number(catIdentifier), status: 'active' }
          : { slug: catIdentifier, status: 'active' },
      });
      if (cat) {
        resolvedCategoryId = cat.id;
      } else {
        // Requested category not found or inactive -> 0 results
        return {
          products: [],
          pagination: {
            total: 0,
            page: Number(page),
            limit: Number(limit),
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
          },
        };
      }
    }

    // Resolve Subcategory ID if slug/name provided
    let resolvedSubcategoryId = subcategory_id;
    const subcatIdentifier = subcategory_slug || subcategory;
    if (!resolvedSubcategoryId && subcatIdentifier) {
      const isNum = /^\d+$/.test(subcatIdentifier);
      const subcat = await Category.findOne({
        where: isNum
          ? { id: Number(subcatIdentifier), status: 'active' }
          : { slug: subcatIdentifier, status: 'active' },
      });
      if (subcat) {
        resolvedSubcategoryId = subcat.id;
      } else {
        return {
          products: [],
          pagination: {
            total: 0,
            page: Number(page),
            limit: Number(limit),
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
          },
        };
      }
    }

    // Apply category & subcategory filters
    if (resolvedCategoryId && !resolvedSubcategoryId) {
      // Find subcategories belonging to this category
      const childCategories = await Category.findAll({
        where: { parent_id: resolvedCategoryId, status: 'active' },
        attributes: ['id'],
      });
      const childIds = childCategories.map((c) => c.id);
      if (childIds.length > 0) {
        andConditions.push({
          [Op.or]: [
            { category_id: resolvedCategoryId },
            { subcategory_id: { [Op.in]: childIds } },
          ],
        });
      } else {
        andConditions.push({ category_id: resolvedCategoryId });
      }
    } else if (resolvedCategoryId && resolvedSubcategoryId) {
      andConditions.push({ category_id: resolvedCategoryId });
      andConditions.push({ subcategory_id: resolvedSubcategoryId });
    } else if (resolvedSubcategoryId) {
      andConditions.push({ subcategory_id: resolvedSubcategoryId });
    }

    if (vendor_id) {
      andConditions.push({ vendor_id: Number(vendor_id) });
    }

    if (in_stock) {
      andConditions.push({ stock: { [Op.gt]: 0 } });
    }

    // Min and max price filters
    if (min_price !== undefined || max_price !== undefined) {
      const priceCond = {};
      if (min_price !== undefined) priceCond[Op.gte] = Number(min_price);
      if (max_price !== undefined) priceCond[Op.lte] = Number(max_price);
      andConditions.push({ price: priceCond });
    }

    // Search by product name / keywords
    const keyword = (search || name || q || '').trim();
    if (keyword) {
      if (name && !search && !q) {
        // Exact name filter
        andConditions.push({
          name: { [Op.like]: `%${keyword}%` },
        });
      } else {
        // Name & Description search
        andConditions.push({
          [Op.or]: [
            { name: { [Op.like]: `%${keyword}%` } },
            { description: { [Op.like]: `%${keyword}%` } },
          ],
        });
      }
    }

    // Construct sorting order
    let orderClause = [['created_at', 'DESC']];
    const sortLower = (sort || '').toLowerCase();

    if (
      sortLower === 'low_to_high' ||
      sortLower === 'price_asc' ||
      sortLower === 'price_low_to_high'
    ) {
      orderClause = [['price', 'ASC']];
    } else if (
      sortLower === 'high_to_low' ||
      sortLower === 'price_desc' ||
      sortLower === 'price_high_to_low'
    ) {
      orderClause = [['price', 'DESC']];
    } else if (sortLower === 'newest') {
      orderClause = [['created_at', 'DESC']];
    } else if (sortLower === 'oldest') {
      orderClause = [['created_at', 'ASC']];
    } else if (sortLower === 'name_asc') {
      orderClause = [['name', 'ASC']];
    } else if (sortLower === 'name_desc') {
      orderClause = [['name', 'DESC']];
    } else if (sortBy) {
      const validSortFields = ['created_at', 'price', 'name', 'stock'];
      const field = validSortFields.includes(sortBy) ? sortBy : 'created_at';
      const dir = (sortOrder || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
      orderClause = [[field, dir]];
    }

    const { count, rows } = await Product.findAndCountAll({
      where: { [Op.and]: andConditions },
      limit: Number(limit),
      offset,
      order: orderClause,
      distinct: true,
      include: [
        {
          model: Vendor,
          as: 'vendor',
          where: { status: 'approved' },
          required: true,
          attributes: [
            'id',
            'store_name',
            'store_slug',
            'store_email',
            'store_phone',
            'logo_url',
            'banner_url',
            'status',
          ],
        },
        {
          model: Category,
          as: 'category',
          where: { status: 'active' },
          required: true,
          attributes: ['id', 'name', 'slug', 'status'],
        },
        {
          model: Category,
          as: 'subcategory',
          required: false,
          attributes: ['id', 'name', 'slug', 'status'],
        },
      ],
    });

    const totalPages = Math.ceil(count / Number(limit)) || 1;

    return {
      products: rows,
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
   * 9. Public Catalog: Get Product Details by ID or Slug
   */
  async getPublicProductDetails(idOrSlug) {
    const isNumeric = /^\d+$/.test(idOrSlug);
    const idWhere = isNumeric
      ? { [Op.or]: [{ id: Number(idOrSlug) }, { slug: idOrSlug }] }
      : { slug: idOrSlug };

    const product = await Product.findOne({
      where: {
        ...idWhere,
        status: 'active',
        approval_status: 'approved',
      },
      include: [
        {
          model: Vendor,
          as: 'vendor',
          where: { status: 'approved' },
          required: true,
          attributes: [
            'id',
            'store_name',
            'store_slug',
            'store_email',
            'store_phone',
            'logo_url',
            'banner_url',
            'description',
            'status',
          ],
        },
        {
          model: Category,
          as: 'category',
          where: { status: 'active' },
          required: true,
          attributes: ['id', 'name', 'slug', 'status'],
        },
        {
          model: Category,
          as: 'subcategory',
          required: false,
          attributes: ['id', 'name', 'slug', 'status'],
        },
      ],
    });

    if (!product) {
      throw new AppError(
        'Product not found or is currently unavailable',
        404,
        'PRODUCT_NOT_FOUND'
      );
    }

    return product;
  }

  /**
   * 10. Public Catalog: Get Products by Category
   */
  async getProductsByCategory(categoryIdOrSlug, queryParams = {}) {
    const isNum = /^\d+$/.test(categoryIdOrSlug);
    const catWhere = isNum
      ? { id: Number(categoryIdOrSlug) }
      : { slug: categoryIdOrSlug };
    catWhere.status = 'active';

    const category = await Category.findOne({
      where: catWhere,
      include: [
        {
          model: Category,
          as: 'subcategories',
          where: { status: 'active' },
          required: false,
        },
      ],
    });

    if (!category) {
      throw new AppError(
        'Category not found or is currently inactive',
        404,
        'CATEGORY_NOT_FOUND'
      );
    }

    const result = await this.getPublicProducts({
      ...queryParams,
      category_id: category.id,
    });

    return {
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        banner_image: category.banner_image,
        thumbnail_image: category.thumbnail_image,
        subcategories: category.subcategories || [],
      },
      products: result.products,
      pagination: result.pagination,
    };
  }
}

module.exports = new ProductService();
