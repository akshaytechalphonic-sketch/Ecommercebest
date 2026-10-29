const { Cart, CartItem, Product, Vendor, Category } = require('../models');
const { AppError } = require('../middleware/error.middleware');

class CartService {
  /**
   * Helper: Calculate effective unit price from product record
   */
  getEffectiveUnitPrice(product) {
    const regularPrice = Number(product.price);
    const discountPrice = product.discount_price ? Number(product.discount_price) : null;
    const hasDiscount = discountPrice !== null && discountPrice < regularPrice && discountPrice > 0;
    return hasDiscount ? discountPrice : regularPrice;
  }

  /**
   * Helper: Ensure authenticated customer has an active Cart record
   */
  async getOrCreateCart(userId) {
    const [cart] = await Cart.findOrCreate({
      where: { user_id: userId },
      defaults: { user_id: userId },
    });
    return cart;
  }

  /**
   * 1. Get Customer Cart with full product details, live pricing and totals
   */
  async getCart(userId) {
    const cart = await this.getOrCreateCart(userId);

    const fullCart = await Cart.findOne({
      where: { id: cart.id },
      include: [
        {
          model: CartItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              include: [
                {
                  model: Vendor,
                  as: 'vendor',
                  attributes: ['id', 'store_name', 'store_slug', 'status'],
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
            },
          ],
        },
      ],
      order: [[{ model: CartItem, as: 'items' }, 'created_at', 'ASC']],
    });

    const rawItems = fullCart ? fullCart.items || [] : [];

    let totalItems = 0;
    let subtotal = 0;
    let discountTotal = 0;
    let totalPrice = 0;

    const formattedItems = [];

    for (const item of rawItems) {
      if (!item.product) continue;

      const product = item.product;
      const regularPrice = Number(product.price);
      const unitPrice = this.getEffectiveUnitPrice(product);
      const quantity = Number(item.quantity);

      const lineSubtotal = regularPrice * quantity;
      const lineTotal = unitPrice * quantity;
      const lineDiscount = lineSubtotal - lineTotal;

      totalItems += quantity;
      subtotal += lineSubtotal;
      discountTotal += lineDiscount;
      totalPrice += lineTotal;

      const isProductActive = product.status === 'active';
      const isProductApproved = product.approval_status === 'approved';
      const isVendorApproved = product.vendor && product.vendor.status === 'approved';
      const isAvailable = isProductActive && isProductApproved && isVendorApproved;
      const hasSufficientStock = product.stock >= quantity;

      // Keep snapshot price synchronized
      if (item.price !== unitPrice) {
        item.price = unitPrice;
        await item.save().catch(() => {});
      }

      formattedItems.push({
        id: item.id,
        cart_id: item.cart_id,
        product_id: item.product_id,
        quantity,
        price: unitPrice,
        regular_price: regularPrice,
        discount_price: product.discount_price ? Number(product.discount_price) : null,
        item_total: Number(lineTotal.toFixed(2)),
        is_available: isAvailable,
        has_sufficient_stock: hasSufficientStock,
        available_stock: product.stock,
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          sku: product.sku,
          images: Array.isArray(product.images) ? product.images : [],
          price: regularPrice,
          discount_price: product.discount_price ? Number(product.discount_price) : null,
          stock: product.stock,
          status: product.status,
          approval_status: product.approval_status,
          category: product.category
            ? {
                id: product.category.id,
                name: product.category.name,
                slug: product.category.slug,
              }
            : null,
          subcategory: product.subcategory
            ? {
                id: product.subcategory.id,
                name: product.subcategory.name,
                slug: product.subcategory.slug,
              }
            : null,
          vendor: product.vendor
            ? {
                id: product.vendor.id,
                store_name: product.vendor.store_name,
                store_slug: product.vendor.store_slug,
                status: product.vendor.status,
              }
            : null,
        },
        created_at: item.created_at,
        updated_at: item.updated_at,
      });
    }

    return {
      cart_id: cart.id,
      user_id: cart.user_id,
      items: formattedItems,
      items_count: formattedItems.length,
      total_items: totalItems,
      subtotal: Number(subtotal.toFixed(2)),
      discount_total: Number(discountTotal.toFixed(2)),
      total_price: Number(totalPrice.toFixed(2)),
    };
  }

  /**
   * 2. Add product to cart (or update quantity if already present)
   */
  async addToCart(userId, { product_id, quantity = 1 }) {
    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      throw new AppError('Quantity must be at least 1', 400, 'INVALID_QUANTITY');
    }

    // 1. Fetch product with vendor
    const product = await Product.findByPk(product_id, {
      include: [
        {
          model: Vendor,
          as: 'vendor',
        },
      ],
    });

    if (!product) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }

    // 2. Validate product active status
    if (product.status !== 'active') {
      throw new AppError(
        'This product is currently inactive and cannot be added to cart',
        400,
        'PRODUCT_INACTIVE'
      );
    }

    // 3. Validate product approval status
    if (product.approval_status !== 'approved') {
      throw new AppError(
        'This product is pending administrative approval and cannot be purchased',
        400,
        'PRODUCT_NOT_APPROVED'
      );
    }

    // 4. Validate vendor store approval status
    if (!product.vendor || product.vendor.status !== 'approved') {
      throw new AppError(
        'Products from unapproved seller stores cannot be added to cart',
        400,
        'VENDOR_NOT_APPROVED'
      );
    }

    // 5. Validate stock availability
    if (product.stock <= 0) {
      throw new AppError(
        'This product is currently out of stock',
        400,
        'PRODUCT_OUT_OF_STOCK'
      );
    }

    // 6. Get or create customer cart
    const cart = await this.getOrCreateCart(userId);

    // 7. Check if item already exists in cart
    const existingItem = await CartItem.findOne({
      where: {
        cart_id: cart.id,
        product_id: product.id,
      },
    });

    const targetQuantity = existingItem ? existingItem.quantity + qty : qty;

    // 8. Verify stock against target quantity
    if (targetQuantity > product.stock) {
      throw new AppError(
        `Requested quantity (${targetQuantity}) exceeds available stock (${product.stock} units).`,
        400,
        'INSUFFICIENT_STOCK',
        [
          {
            field: 'quantity',
            message: `Only ${product.stock} units available in stock`,
          },
        ]
      );
    }

    const unitPrice = this.getEffectiveUnitPrice(product);

    if (existingItem) {
      existingItem.quantity = targetQuantity;
      existingItem.price = unitPrice;
      await existingItem.save();
    } else {
      await CartItem.create({
        cart_id: cart.id,
        product_id: product.id,
        quantity: targetQuantity,
        price: unitPrice,
      });
    }

    return this.getCart(userId);
  }

  /**
   * 3. Update quantity of an existing cart item
   */
  async updateCartItem(userId, itemIdOrProductId, quantity) {
    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      throw new AppError('Quantity must be at least 1', 400, 'INVALID_QUANTITY');
    }

    const cart = await this.getOrCreateCart(userId);

    // Look up by cart_item id, or fallback by product_id within user's cart
    let cartItem = await CartItem.findOne({
      where: {
        id: itemIdOrProductId,
        cart_id: cart.id,
      },
      include: [
        {
          model: Product,
          as: 'product',
          include: [{ model: Vendor, as: 'vendor' }],
        },
      ],
    });

    if (!cartItem) {
      cartItem = await CartItem.findOne({
        where: {
          product_id: itemIdOrProductId,
          cart_id: cart.id,
        },
        include: [
          {
            model: Product,
            as: 'product',
            include: [{ model: Vendor, as: 'vendor' }],
          },
        ],
      });
    }

    if (!cartItem) {
      throw new AppError('Item not found in your cart', 404, 'CART_ITEM_NOT_FOUND');
    }

    const product = cartItem.product;
    if (!product) {
      throw new AppError('Associated product no longer exists', 404, 'PRODUCT_NOT_FOUND');
    }

    // Verify active & approved
    if (product.status !== 'active') {
      throw new AppError(
        'This product is currently inactive and cannot be updated',
        400,
        'PRODUCT_INACTIVE'
      );
    }

    if (product.approval_status !== 'approved') {
      throw new AppError(
        'This product is not approved for purchase',
        400,
        'PRODUCT_NOT_APPROVED'
      );
    }

    if (!product.vendor || product.vendor.status !== 'approved') {
      throw new AppError(
        'Products from unapproved seller stores cannot be purchased',
        400,
        'VENDOR_NOT_APPROVED'
      );
    }

    // Verify stock availability
    if (qty > product.stock) {
      throw new AppError(
        `Requested quantity (${qty}) exceeds available stock (${product.stock} units).`,
        400,
        'INSUFFICIENT_STOCK',
        [
          {
            field: 'quantity',
            message: `Only ${product.stock} units available in stock`,
          },
        ]
      );
    }

    const unitPrice = this.getEffectiveUnitPrice(product);
    cartItem.quantity = qty;
    cartItem.price = unitPrice;
    await cartItem.save();

    return this.getCart(userId);
  }

  /**
   * 4. Remove an item from the cart
   */
  async removeFromCart(userId, itemIdOrProductId) {
    const cart = await this.getOrCreateCart(userId);

    let cartItem = await CartItem.findOne({
      where: {
        id: itemIdOrProductId,
        cart_id: cart.id,
      },
    });

    if (!cartItem) {
      cartItem = await CartItem.findOne({
        where: {
          product_id: itemIdOrProductId,
          cart_id: cart.id,
        },
      });
    }

    if (!cartItem) {
      throw new AppError('Item not found in your cart', 404, 'CART_ITEM_NOT_FOUND');
    }

    await cartItem.destroy();
    return this.getCart(userId);
  }

  /**
   * 5. Clear entire cart for customer
   */
  async clearCart(userId) {
    const cart = await this.getOrCreateCart(userId);
    await CartItem.destroy({
      where: { cart_id: cart.id },
    });
    return this.getCart(userId);
  }
}

module.exports = new CartService();
