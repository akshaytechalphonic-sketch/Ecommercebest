const express = require('express');
const router = express.Router();

const productController = require('../controllers/product.controller');
const validate = require('../middleware/validate.middleware');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');
const { adminUpdateProductStatusSchema } = require('../validators/product.validator');

/**
 * @swagger
 * tags:
 *   name: Admin Products
 *   description: Marketplace administration of seller products and approvals
 */

/**
 * @swagger
 * /api/v1/admin/products:
 *   get:
 *     summary: List All Marketplace Products (Admin only)
 *     description: Retrieve all marketplace products with advanced filtering by approval status, status, category, seller, and keyword search.
 *     tags: [Admin Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *         description: Items per page
 *       - in: query
 *         name: approval_status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         description: Filter by approval status
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, draft]
 *         description: Filter by product lifecycle status
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: integer
 *         description: Filter by category ID
 *       - in: query
 *         name: vendor_id
 *         schema:
 *           type: integer
 *         description: Filter by vendor/seller ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by product name, SKU, or description
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [created_at, price, name, stock]
 *           default: created_at
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get(
  '/',
  authenticate,
  authorizeRoles('admin'),
  productController.adminListProducts
);

/**
 * @swagger
 * /api/v1/admin/products/{id}/status:
 *   patch:
 *     summary: Approve or Reject a Product (Admin only)
 *     description: Update the marketplace approval status of a product. If rejected, rejection_reason is mandatory.
 *     tags: [Admin Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - approval_status
 *             properties:
 *               approval_status:
 *                 type: string
 *                 enum: [approved, rejected]
 *                 example: approved
 *               rejection_reason:
 *                 type: string
 *                 example: Pricing or description violation
 *                 description: Required when approval_status is rejected
 *     responses:
 *       200:
 *         description: Product approval status updated successfully
 *       400:
 *         description: Validation error (e.g. rejection reason missing when rejected)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Product not found
 */
router.patch(
  '/:id/status',
  authenticate,
  authorizeRoles('admin'),
  validate(adminUpdateProductStatusSchema),
  productController.adminUpdateProductApproval
);

module.exports = router;
