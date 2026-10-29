const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const adminCartService = require('../services/admin.cart.service');

/**
 * 1. Admin: View all active customer carts
 * GET /api/v1/admin/carts
 */
const getAdminCarts = asyncHandler(async (req, res) => {
  const result = await adminCartService.getAdminCarts(req.query);
  return sendSuccess(res, 'Customer carts retrieved successfully for admin', result);
});

/**
 * 2. Admin: View wishlist demand intelligence
 * GET /api/v1/admin/wishlists
 */
const getAdminWishlistStats = asyncHandler(async (req, res) => {
  const result = await adminCartService.getAdminWishlistStats();
  return sendSuccess(res, 'Wishlist demand analytics retrieved successfully', result);
});

module.exports = {
  getAdminCarts,
  getAdminWishlistStats,
};
