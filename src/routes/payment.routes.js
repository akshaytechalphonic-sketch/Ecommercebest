const express = require('express');
const router = express.Router();
const financialController = require('../controllers/financial.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Gateway payment transactions and settlement management
 */

router.use(authenticate);

/**
 * @swagger
 * /api/v1/payments:
 *   post:
 *     summary: Record & Verify Order Payment
 *     description: Verify payment transaction for an order, calculate commissions, and credit vendor balance.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [order_id]
 *             properties:
 *               order_id:
 *                 type: integer
 *               amount:
 *                 type: number
 *               payment_method:
 *                 type: string
 *                 enum: [card, upi, netbanking, cod, wallet]
 *               gateway:
 *                 type: string
 *               transaction_id:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment recorded successfully
 */
router.post('/', financialController.recordPayment);

/**
 * @swagger
 * /api/v1/payments:
 *   get:
 *     summary: List All Payment Transactions (Admin)
 *     description: Retrieve all gateway payment transactions with aggregate stats and filters.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: payment_method
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payments list retrieved
 */
router.get('/', authorize('admin'), financialController.getPayments);

module.exports = router;
