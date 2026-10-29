const express = require('express');
const router = express.Router();

const wishlistController = require('../controllers/wishlist.controller');
const { authenticate } = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Wishlist
 *   description: Customer product wishlist management APIs
 */

// All Wishlist routes require user authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/wishlist:
 *   get:
 *     summary: View Customer Wishlist
 *     description: Retrieve all products saved in the authenticated customer's wishlist.
 *     tags: [Wishlist]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Wishlist retrieved successfully
 */
router.get('/', wishlistController.getWishlist);

/**
 * @swagger
 * /api/v1/wishlist:
 *   post:
 *     summary: Add Product to Wishlist
 *     description: Save an active approved product to customer's wishlist.
 *     tags: [Wishlist]
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
 *     responses:
 *       200:
 *         description: Product added to wishlist successfully
 */
router.post('/', wishlistController.addToWishlist);

/**
 * @swagger
 * /api/v1/wishlist/{id}/move-to-cart:
 *   post:
 *     summary: Move Wishlist Item to Cart
 *     description: Transfer a product from wishlist directly into customer's shopping cart.
 *     tags: [Wishlist]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Wishlist item ID or Product ID
 *     responses:
 *       200:
 *         description: Product moved to cart successfully
 */
router.post('/:id/move-to-cart', wishlistController.moveToCart);

/**
 * @swagger
 * /api/v1/wishlist/{id}:
 *   delete:
 *     summary: Remove Product from Wishlist
 *     description: Remove a specific product from customer's wishlist by ID or product ID.
 *     tags: [Wishlist]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Wishlist item ID or Product ID
 *     responses:
 *       200:
 *         description: Product removed from wishlist successfully
 */
router.delete('/:id', wishlistController.removeFromWishlist);

/**
 * @swagger
 * /api/v1/wishlist:
 *   delete:
 *     summary: Clear Customer Wishlist
 *     description: Remove all items from customer's wishlist.
 *     tags: [Wishlist]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Wishlist cleared successfully
 */
router.delete('/', wishlistController.clearWishlist);

module.exports = router;
