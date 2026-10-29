const express = require('express');
const router = express.Router();

const adminCartController = require('../controllers/admin.cart.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Admin Carts & Demand
 *   description: Marketplace Administration of Customer Shopping Carts and Wishlist Demand
 */

// All Admin routes require admin authorization
router.use(authenticate, authorizeRoles('admin'));

/**
 * @swagger
 * /api/v1/admin/carts:
 *   get:
 *     summary: View All Active Customer Carts
 *     description: Retrieve list of active customer shopping carts with items, customer details, and total pipeline revenue.
 *     tags: [Admin Carts & Demand]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by customer name or email
 *     responses:
 *       200:
 *         description: Active customer carts retrieved successfully
 */
router.get('/', adminCartController.getAdminCarts);

/**
 * @swagger
 * /api/v1/admin/wishlists:
 *   get:
 *     summary: View Wishlist Demand Intelligence
 *     description: Retrieve products sorted by customer wishlist and cart demand count.
 *     tags: [Admin Carts & Demand]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Wishlist demand intelligence retrieved successfully
 */
router.get('/wishlists', adminCartController.getAdminWishlistStats);

module.exports = router;
