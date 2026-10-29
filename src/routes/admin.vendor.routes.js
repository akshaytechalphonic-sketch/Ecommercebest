const express = require('express');
const router = express.Router();

const vendorController = require('../controllers/vendor.controller');
const validate = require('../middleware/validate.middleware');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');
const { adminUpdateVendorStatusSchema } = require('../validators/vendor.validator');

/**
 * @swagger
 * tags:
 *   name: Admin Vendors
 *   description: Marketplace administration of sellers and stores
 */

/**
 * @swagger
 * /api/v1/admin/vendors:
 *   get:
 *     summary: List All Sellers (Admin only)
 *     description: Retrieve all marketplace vendor applications and stores with pagination and status filters.
 *     tags: [Admin Vendors]
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
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, suspended]
 *         description: Filter by approval status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by store name, email, or owner name/email
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: created_at
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *     responses:
 *       200:
 *         description: Vendors retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get(
  '/',
  authenticate,
  authorizeRoles('admin'),
  vendorController.adminListVendors
);

/**
 * @swagger
 * /api/v1/admin/vendors/{id}/status:
 *   patch:
 *     summary: Update Vendor Approval Status (Admin only)
 *     description: Approve, reject, or suspend a seller application or store profile.
 *     tags: [Admin Vendors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Vendor ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected, suspended]
 *                 example: approved
 *               rejection_reason:
 *                 type: string
 *                 description: Required if status is rejected
 *                 example: Incomplete business documentation
 *               commission_rate:
 *                 type: number
 *                 description: Marketplace commission percentage
 *                 example: 8.5
 *     responses:
 *       200:
 *         description: Vendor status updated successfully
 *       400:
 *         description: Validation error (e.g. missing rejection reason)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Vendor not found
 */
router.patch(
  '/:id/status',
  authenticate,
  authorizeRoles('admin'),
  validate(adminUpdateVendorStatusSchema),
  vendorController.adminUpdateVendorStatus
);

module.exports = router;
