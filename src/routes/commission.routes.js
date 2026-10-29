const express = require('express');
const router = express.Router();
const financialController = require('../controllers/financial.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const {
  getCommissionsQuerySchema,
  vendorEarningsParamsSchema,
  calculateCommissionSchema,
  cancelOrderSchema,
} = require('../validators/commission.validator');

/**
 * @swagger
 * tags:
 *   name: Commissions
 *   description: Marketplace commission calculation, reporting, and vendor earnings ledger
 */

router.use(authenticate);

/**
 * @swagger
 * /api/v1/commissions/reports/overview:
 *   get:
 *     summary: Overall Platform Commission & Vendor Earnings Report
 *     description: Aggregated financial report showing total GMV, platform commission, net vendor payouts, and breakdown per vendor.
 *     tags: [Commissions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Platform-wide commission reports retrieved
 */
router.get(
  '/reports/overview',
  authorize('admin'),
  financialController.getCommissionReportsOverview
);

/**
 * @swagger
 * /api/v1/commissions:
 *   get:
 *     summary: List Commission & Earnings Ledger
 *     description: Retrieve breakdown of marketplace commissions and vendor earnings per order item.
 *     tags: [Commissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: vendor_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, available, credited, settled, refunded, cancelled]
 *       - in: query
 *         name: settlement_status
 *         schema:
 *           type: string
 *           enum: [unsettled, settling, settled]
 *     responses:
 *       200:
 *         description: Commission ledger retrieved
 */
router.get(
  '/',
  validate(getCommissionsQuerySchema, 'query'),
  financialController.getCommissions
);

/**
 * @swagger
 * /api/v1/commissions/vendor:
 *   get:
 *     summary: Get Current Vendor's Earnings & Balance
 *     description: Retrieve pending, available, and settled earnings for the authenticated vendor.
 *     tags: [Commissions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vendor financial summary retrieved
 */
router.get('/vendor', financialController.getVendorEarnings);

/**
 * @swagger
 * /api/v1/commissions/vendor/{vendor_id}:
 *   get:
 *     summary: Get Vendor Financial Summary by Vendor ID (Admin/Owner)
 *     description: Retrieve vendor wallet balance, pending escrow, lifetime earnings, and payouts.
 *     tags: [Commissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vendor_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Vendor earnings summary retrieved
 */
router.get(
  '/vendor/:vendor_id',
  validate(vendorEarningsParamsSchema, 'params'),
  financialController.getVendorEarnings
);

/**
 * @swagger
 * /api/v1/commissions/calculate:
 *   post:
 *     summary: On-Demand Commission Calculation for an Order
 *     description: Calculate and create commission ledger entries for eligible order items.
 *     tags: [Commissions]
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
 *     responses:
 *       200:
 *         description: Commissions calculated successfully
 */
router.post(
  '/calculate',
  authorize('admin'),
  validate(calculateCommissionSchema, 'body'),
  financialController.calculateOrderCommission
);

/**
 * @swagger
 * /api/v1/commissions/orders/{order_id}/cancel:
 *   post:
 *     summary: Cancel Order with Commission & Inventory Reversal
 *     description: Cancels an order, restores inventory stock, and safely adjusts or reverses vendor earnings.
 *     tags: [Commissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: order_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Order cancelled and earnings adjusted
 */
router.post(
  '/orders/:order_id/cancel',
  validate(cancelOrderSchema, 'body'),
  financialController.cancelOrder
);

module.exports = router;

