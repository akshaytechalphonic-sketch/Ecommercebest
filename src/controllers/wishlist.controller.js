const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const wishlistService = require('../services/wishlist.service');
const { z } = require('zod');

const addWishlistSchema = z.object({
  product_id: z.coerce.number().int().positive('Valid product ID is required'),
});

const paramSchema = z.object({
  id: z.coerce.number().int().positive('Valid ID is required'),
});

/**
 * 1. View Customer Wishlist
 * GET /api/v1/wishlist
 */
const getWishlist = asyncHandler(async (req, res) => {
  const result = await wishlistService.getWishlist(req.user.id);
  return sendSuccess(res, 'Wishlist retrieved successfully', result);
});

/**
 * 2. Add product to Wishlist
 * POST /api/v1/wishlist
 */
const addToWishlist = asyncHandler(async (req, res) => {
  const { product_id } = addWishlistSchema.parse(req.body);
  const result = await wishlistService.addToWishlist(req.user.id, product_id);
  return sendSuccess(res, 'Product added to wishlist successfully', result, 200);
});

/**
 * 3. Remove product from Wishlist
 * DELETE /api/v1/wishlist/:id
 */
const removeFromWishlist = asyncHandler(async (req, res) => {
  const { id } = paramSchema.parse(req.params);
  const result = await wishlistService.removeFromWishlist(req.user.id, id);
  return sendSuccess(res, 'Product removed from wishlist successfully', result);
});

/**
 * 4. Move Wishlist item to Cart
 * POST /api/v1/wishlist/:id/move-to-cart
 */
const moveToCart = asyncHandler(async (req, res) => {
  const { id } = paramSchema.parse(req.params);
  const result = await wishlistService.moveToCart(req.user.id, id);
  return sendSuccess(res, 'Product moved to cart successfully', result);
});

/**
 * 5. Clear all items from Wishlist
 * DELETE /api/v1/wishlist
 */
const clearWishlist = asyncHandler(async (req, res) => {
  const result = await wishlistService.clearWishlist(req.user.id);
  return sendSuccess(res, 'Wishlist cleared successfully', result);
});

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  moveToCart,
  clearWishlist,
};
