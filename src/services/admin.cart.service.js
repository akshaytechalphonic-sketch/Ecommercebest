const { Op } = require('sequelize');
const { Cart, CartItem, Product, User, Vendor, Category, Wishlist } = require('../models');

class AdminCartService {
  /**
   * Helper: Effective unit price
   */
  getEffectiveUnitPrice(product) {
    const regularPrice = Number(product.price);
    const discountPrice = product.discount_price ? Number(product.discount_price) : null;
    const hasDiscount = discountPrice !== null && discountPrice < regularPrice && discountPrice > 0;
    return hasDiscount ? discountPrice : regularPrice;
  }

  /**
   * 1. Get all customer carts with items and aggregate pipeline metrics
   */
  async getAdminCarts(queryParams = {}) {
    const { page = 1, limit = 20, search } = queryParams;

    const userWhere = {};
    if (search) {
      userWhere[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    // Find all carts with items
    const allCarts = await Cart.findAll({
      include: [
        {
          model: User,
          as: 'user',
          where: Object.keys(userWhere).length > 0 ? userWhere : undefined,
          attributes: ['id', 'name', 'email', 'phone', 'role'],
        },
        {
          model: CartItem,
          as: 'items',
          required: true, // Only show carts that have at least 1 item
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
        },
      ],
      order: [['updated_at', 'DESC']],
    });

    let totalPipelineValue = 0;
    let totalItemsInCarts = 0;

    const formattedCarts = allCarts.map((c) => {
      let cartSubtotal = 0;
      let cartTotalPrice = 0;
      let cartUnits = 0;

      const itemsList = (c.items || [])
        .filter((item) => item.product)
        .map((item) => {
          const prod = item.product;
          const unitPrice = this.getEffectiveUnitPrice(prod);
          const lineTotal = unitPrice * item.quantity;
          const lineSubtotal = Number(prod.price) * item.quantity;

          cartSubtotal += lineSubtotal;
          cartTotalPrice += lineTotal;
          cartUnits += item.quantity;

          return {
            id: item.id,
            product_id: item.product_id,
            name: prod.name,
            sku: prod.sku,
            image: Array.isArray(prod.images) && prod.images.length > 0 ? prod.images[0] : null,
            unit_price: unitPrice,
            regular_price: Number(prod.price),
            quantity: item.quantity,
            item_total: Number(lineTotal.toFixed(2)),
            stock: prod.stock,
            vendor_name: prod.vendor?.store_name || `Vendor #${prod.vendor_id}`,
          };
        });

      totalPipelineValue += cartTotalPrice;
      totalItemsInCarts += cartUnits;

      return {
        id: c.id,
        user_id: c.user_id,
        customer: c.user
          ? {
              id: c.user.id,
              name: c.user.name,
              email: c.user.email,
              phone: c.user.phone,
            }
          : { id: c.user_id, name: 'Anonymous Customer', email: 'N/A' },
        items_count: itemsList.length,
        total_items: cartUnits,
        subtotal: Number(cartSubtotal.toFixed(2)),
        total_price: Number(cartTotalPrice.toFixed(2)),
        updated_at: c.updated_at,
        created_at: c.created_at,
        items: itemsList,
      };
    });

    // Pagination
    const totalCarts = formattedCarts.length;
    const offset = (Number(page) - 1) * Number(limit);
    const paginatedCarts = formattedCarts.slice(offset, offset + Number(limit));

    return {
      carts: paginatedCarts,
      pagination: {
        total: totalCarts,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(totalCarts / Number(limit)) || 1,
      },
      summary: {
        active_carts_count: totalCarts,
        total_pipeline_value: Number(totalPipelineValue.toFixed(2)),
        total_items_in_carts: totalItemsInCarts,
      },
    };
  }

  /**
   * 2. Get Wishlist intelligence & high-demand products
   */
  async getAdminWishlistStats() {
    // 1. Get all wishlist records with product and user
    const wishlistRecords = await Wishlist.findAll({
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
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    // 2. Count cart appearances per product
    const cartItems = await CartItem.findAll({
      attributes: ['product_id', 'quantity'],
    });

    const cartCounts = {};
    for (const ci of cartItems) {
      cartCounts[ci.product_id] = (cartCounts[ci.product_id] || 0) + Number(ci.quantity);
    }

    // 3. Aggregate wishlist count per product
    const productStatsMap = {};
    const uniqueUserIds = new Set();

    for (const w of wishlistRecords) {
      if (!w.product) continue;
      uniqueUserIds.add(w.user_id);

      const pid = w.product_id;
      if (!productStatsMap[pid]) {
        const prod = w.product;
        const unitPrice = this.getEffectiveUnitPrice(prod);
        productStatsMap[pid] = {
          product_id: prod.id,
          name: prod.name,
          slug: prod.slug,
          sku: prod.sku,
          image: Array.isArray(prod.images) && prod.images.length > 0 ? prod.images[0] : null,
          price: unitPrice,
          regular_price: Number(prod.price),
          stock: prod.stock,
          status: prod.status,
          approval_status: prod.approval_status,
          vendor: prod.vendor
            ? {
                id: prod.vendor.id,
                store_name: prod.vendor.store_name,
              }
            : null,
          category: prod.category
            ? {
                id: prod.category.id,
                name: prod.category.name,
              }
            : null,
          wishlist_count: 0,
          cart_count: cartCounts[pid] || 0,
          saved_by_users: [],
        };
      }

      productStatsMap[pid].wishlist_count += 1;
      if (w.user) {
        productStatsMap[pid].saved_by_users.push({
          id: w.user.id,
          name: w.user.name,
          email: w.user.email,
          saved_at: w.created_at,
        });
      }
    }

    const demandList = Object.values(productStatsMap).map((p) => {
      const totalDemand = p.wishlist_count + p.cart_count;
      let demandLevel = 'Normal';
      if (totalDemand >= 5) demandLevel = 'High Demand';
      else if (totalDemand >= 2) demandLevel = 'Trending';

      return {
        ...p,
        total_demand: totalDemand,
        demand_level: demandLevel,
      };
    });

    // Sort by highest demand first
    demandList.sort((a, b) => b.total_demand - a.total_demand);

    return {
      products: demandList,
      summary: {
        total_wishlist_records: wishlistRecords.length,
        unique_wishlisted_products: demandList.length,
        unique_customers: uniqueUserIds.size,
      },
    };
  }
}

module.exports = new AdminCartService();
