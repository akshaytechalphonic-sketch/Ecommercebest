const { Wishlist, Product, Vendor, Category } = require('../models');
const { AppError } = require('../middleware/error.middleware');
const cartService = require('./cart.service');

class WishlistService {
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
   * 1. Get Customer Wishlist with product details
   */
  async getWishlist(userId) {
    const items = await Wishlist.findAll({
      where: { user_id: userId },
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
          ],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    const formatted = items
      .filter((item) => item.product)
      .map((item) => {
        const product = item.product;
        const regularPrice = Number(product.price);
        const unitPrice = this.getEffectiveUnitPrice(product);
        const isProductActive = product.status === 'active';
        const isProductApproved = product.approval_status === 'approved';
        const isVendorApproved = product.vendor && product.vendor.status === 'approved';
        const isAvailable = isProductActive && isProductApproved && isVendorApproved;
        const inStock = product.stock > 0;

        return {
          id: item.id,
          user_id: item.user_id,
          product_id: item.product_id,
          created_at: item.created_at,
          price: unitPrice,
          regular_price: regularPrice,
          discount_price: product.discount_price ? Number(product.discount_price) : null,
          is_available: isAvailable,
          in_stock: inStock,
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
            vendor: product.vendor
              ? {
                  id: product.vendor.id,
                  store_name: product.vendor.store_name,
                  store_slug: product.vendor.store_slug,
                  status: product.vendor.status,
                }
              : null,
          },
        };
      });

    return {
      items: formatted,
      total_items: formatted.length,
    };
  }

  /**
   * 2. Add product to Wishlist
   */
  async addToWishlist(userId, productId) {
    const product = await Product.findByPk(productId, {
      include: [{ model: Vendor, as: 'vendor' }],
    });

    if (!product) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }

    if (product.status !== 'active') {
      throw new AppError(
        'Inactive products cannot be saved to wishlist',
        400,
        'PRODUCT_INACTIVE'
      );
    }

    if (product.approval_status !== 'approved') {
      throw new AppError(
        'Only approved products can be added to wishlist',
        400,
        'PRODUCT_NOT_APPROVED'
      );
    }

    // findOrCreate ensures duplicate clicks don't fail or create double rows
    await Wishlist.findOrCreate({
      where: {
        user_id: userId,
        product_id: product.id,
      },
      defaults: {
        user_id: userId,
        product_id: product.id,
      },
    });

    return this.getWishlist(userId);
  }

  /**
   * 3. Remove product from Wishlist
   */
  async removeFromWishlist(userId, idOrProductId) {
    // Try by wishlist id
    let item = await Wishlist.findOne({
      where: {
        id: idOrProductId,
        user_id: userId,
      },
    });

    // Or by product_id
    if (!item) {
      item = await Wishlist.findOne({
        where: {
          product_id: idOrProductId,
          user_id: userId,
        },
      });
    }

    if (!item) {
      throw new AppError('Product not found in your wishlist', 404, 'WISHLIST_ITEM_NOT_FOUND');
    }

    await item.destroy();
    return this.getWishlist(userId);
  }

  /**
   * 4. Move Wishlist item to Cart
   */
  async moveToCart(userId, idOrProductId) {
    let item = await Wishlist.findOne({
      where: {
        id: idOrProductId,
        user_id: userId,
      },
    });

    if (!item) {
      item = await Wishlist.findOne({
        where: {
          product_id: idOrProductId,
          user_id: userId,
        },
      });
    }

    if (!item) {
      throw new AppError('Product not found in your wishlist', 404, 'WISHLIST_ITEM_NOT_FOUND');
    }

    // Add to cart
    await cartService.addToCart(userId, {
      product_id: item.product_id,
      quantity: 1,
    });

    // Remove from wishlist
    await item.destroy();

    return {
      wishlist: await this.getWishlist(userId),
      cart: await cartService.getCart(userId),
    };
  }

  /**
   * 5. Clear entire Wishlist
   */
  async clearWishlist(userId) {
    await Wishlist.destroy({
      where: { user_id: userId },
    });
    return this.getWishlist(userId);
  }
}

module.exports = new WishlistService();
