const express = require('express');
const router = express.Router();

const cartController = require('../controllers/cart.controller');
const { authenticate } = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Customer shopping cart management APIs
 */

// All Cart routes require user authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/cart:
 *   get:
 *     summary: View Customer Cart
 *     description: Retrieve the authenticated customer's cart, items, live prices, discounts, and order totals.
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Cart retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccessResponse'
 *       401:
 *         description: Unauthorized - Bearer token required
 */
router.get('/', cartController.getCart);

/**
 * @swagger
 * /api/v1/cart/items:
 *   post:
 *     summary: Add Product to Cart
 *     description: Add an active, approved product from an approved seller to the customer's cart. If product is already present, updates quantity without duplicate item.
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product_id
 *             properties:
 *               product_id:
 *                 type: integer
 *                 example: 10
 *               quantity:
 *                 type: integer
 *                 default: 1
 *                 example: 2
 *     responses:
 *       200:
 *         description: Product added to cart successfully
 *       400:
 *         description: Inactive product, unapproved vendor, or insufficient stock
 *       404:
 *         description: Product not found
 */
router.post('/items', cartController.addToCart);

// Backwards-compatible alias for POST /api/v1/cart
router.post('/', cartController.addToCart);

/**
 * @swagger
 * /api/v1/cart/items/{id}:
 *   put:
 *     summary: Update Cart Item Quantity
 *     description: Update quantity of a product in the customer's cart with live stock check.
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Cart Item ID or Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 example: 3
 *     responses:
 *       200:
 *         description: Cart item updated successfully
 *       400:
 *         description: Invalid quantity or insufficient stock
 *       404:
 *         description: Item not found in cart
 */
router.put('/items/:id', cartController.updateCartItem);
router.patch('/items/:id', cartController.updateCartItem);

/**
 * @swagger
 * /api/v1/cart/items/{id}:
 *   delete:
 *     summary: Remove Item from Cart
 *     description: Remove a specific item from the authenticated customer's cart.
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Cart Item ID
 *     responses:
 *       200:
 *         description: Product removed from cart successfully
 *       404:
 *         description: Item not found in cart
 */
router.delete('/items/:id', cartController.removeFromCart);
router.delete('/products/:id', cartController.removeFromCart);

/**
 * @swagger
 * /api/v1/cart:
 *   delete:
 *     summary: Clear Customer Cart
 *     description: Remove all products from the customer's cart.
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared successfully
 */
router.delete('/', cartController.clearCart);

module.exports = router;
