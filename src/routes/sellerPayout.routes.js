const express = require('express');
const router = express.Router();
const financialController = require('../controllers/financial.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Withdrawals
 *   description: Seller payout requests and settlement administration
 */

router.use(authenticate);

/**
 * @swagger
 * /api/v1/payouts/request:
 *   post:
 *     summary: Request Seller Payout / Withdrawal
 *     description: Submit withdrawal request from available vendor wallet balance.
 *     tags: [Withdrawals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount:
 *                 type: number
 *               payout_method:
 *                 type: string
 *                 enum: [bank_transfer, upi, manual]
 *     responses:
 *       201:
 *         description: Withdrawal requested successfully
 */
router.post('/request', authorize('vendor', 'admin'), financialController.requestWithdrawal);

/**
 * @swagger
 * /api/v1/payouts:
 *   get:
 *     summary: List Withdrawal Requests
 *     description: Retrieve list of seller payout requests with status and settlement totals.
 *     tags: [Withdrawals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Withdrawals list retrieved
 */
router.get('/', financialController.getWithdrawals);

/**
 * @swagger
 * /api/v1/payouts/{id}/process:
 *   put:
 *     summary: Process Withdrawal Request (Admin)
 *     description: Approve or reject vendor payout request with transaction reference or reason.
 *     tags: [Withdrawals]
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
 *               transaction_reference:
 *                 type: string
 *               rejection_reason:
 *                 type: string
 *               admin_notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Withdrawal processed successfully
 */
router.put('/:id/process', authorize('admin'), financialController.processWithdrawal);

module.exports = router;
