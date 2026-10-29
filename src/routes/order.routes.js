const express = require('express');
const router = express.Router();
const financialController = require('../controllers/financial.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Orders & Refunds
 *   description: Order checkout, status updates, returns, and refund requests
 */

router.use(authenticate);

/**
 * @swagger
 * /api/v1/orders/checkout:
 *   post:
 *     summary: Checkout & Place Order from Active Cart
 *     description: Converts customer shopping cart into an order with items and calculates order total.
 *     tags: [Orders & Refunds]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               shipping_address_id:
 *                 type: integer
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Order created successfully
 */
router.post('/checkout', financialController.createOrder);

/**
 * @swagger
 * /api/v1/orders:
 *   get:
 *     summary: List Orders
 *     description: Retrieve order history for current user or all orders for admin.
 *     tags: [Orders & Refunds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: payment_status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Orders list retrieved
 */
router.get('/', financialController.getOrders);

/**
 * @swagger
 * /api/v1/orders/refund:
 *   post:
 *     summary: Request Order Return / Refund
 *     description: Submit return or refund request for an entire order or specific order item.
 *     tags: [Orders & Refunds]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [order_id, reason]
 *             properties:
 *               order_id:
 *                 type: integer
 *               order_item_id:
 *                 type: integer
 *               reason:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Refund request submitted
 */
router.post('/refund', financialController.requestRefund);

/**
 * @swagger
 * /api/v1/orders/refunds:
 *   get:
 *     summary: List Refund Requests
 *     description: Retrieve list of return/refund requests with filter by status.
 *     tags: [Orders & Refunds]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Refunds retrieved
 */
router.get('/refunds', financialController.getRefunds);

/**
 * @swagger
 * /api/v1/orders/refunds/{id}/process:
 *   put:
 *     summary: Process Refund Request (Admin)
 *     description: Approve or reject refund. On approval, automatically adjusts vendor balance, restores inventory stock, and updates payment.
 *     tags: [Orders & Refunds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [action]
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *               rejection_reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Refund processed successfully
 */
router.put('/refunds/:id/process', authorize('admin'), financialController.processRefund);

/**
 * @swagger
 * /api/v1/orders/{id}/cancel:
 *   post:
 *     summary: Cancel Order
 *     description: Cancel an order, restore stock, and reverse vendor earnings.
 *     tags: [Orders & Refunds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 */
router.post('/:id/cancel', financialController.cancelOrder);

module.exports = router;
