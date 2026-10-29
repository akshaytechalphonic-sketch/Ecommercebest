const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const cartService = require('../services/cart.service');
const {
  addToCartSchema,
  updateCartItemSchema,
  cartParamSchema,
} = require('../validators/cart.validator');

/**
 * 1. Get authenticated customer's cart
 * GET /api/v1/cart
 */
const getCart = asyncHandler(async (req, res) => {
  const result = await cartService.getCart(req.user.id);
  return sendSuccess(res, 'Cart retrieved successfully', result);
});

/**
 * 2. Add product to cart (or update quantity if already present)
 * POST /api/v1/cart/items or POST /api/v1/cart
 */
const addToCart = asyncHandler(async (req, res) => {
  const data = addToCartSchema.parse(req.body);
  const result = await cartService.addToCart(req.user.id, data);
  return sendSuccess(res, 'Product added to cart successfully', result, 200);
});

/**
 * 3. Update quantity of a cart item
 * PUT /api/v1/cart/items/:id or PATCH /api/v1/cart/items/:id
 */
const updateCartItem = asyncHandler(async (req, res) => {
  const { id } = cartParamSchema.parse(req.params);
  const { quantity } = updateCartItemSchema.parse(req.body);
  const result = await cartService.updateCartItem(req.user.id, id, quantity);
  return sendSuccess(res, 'Cart item updated successfully', result);
});

/**
 * 4. Remove an item from the cart
 * DELETE /api/v1/cart/items/:id or DELETE /api/v1/cart/products/:id
 */
const removeFromCart = asyncHandler(async (req, res) => {
  const { id } = cartParamSchema.parse(req.params);
  const result = await cartService.removeFromCart(req.user.id, id);
  return sendSuccess(res, 'Product removed from cart successfully', result);
});

/**
 * 5. Clear all items from customer's cart
 * DELETE /api/v1/cart
 */
const clearCart = asyncHandler(async (req, res) => {
  const result = await cartService.clearCart(req.user.id);
  return sendSuccess(res, 'Cart cleared successfully', result);
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};
