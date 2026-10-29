const express = require('express');
const router = express.Router();

const vendorController = require('../controllers/vendor.controller');
const validate = require('../middleware/validate.middleware');
const { authenticate, optionalAuthenticate } = require('../middleware/auth.middleware');
const {
  registerVendorSchema,
  updateVendorSchema,
} = require('../validators/vendor.validator');

/**
 * @swagger
 * tags:
 *   name: Vendors
 *   description: Seller onboarding, store management, and approval status
 */

/**
 * @swagger
 * /api/v1/vendors/register:
 *   post:
 *     summary: Register as a Vendor / Seller
 *     description: Register a new store. Can be called by an authenticated user to upgrade to seller, or directly with owner credentials.
 *     tags: [Vendors]
 *     security:
 *       - bearerAuth: []
 *       - []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - store_name
 *             properties:
 *               store_name:
 *                 type: string
 *                 example: Tech Gadgets Hub
 *               store_slug:
 *                 type: string
 *                 example: tech-gadgets-hub
 *               store_email:
 *                 type: string
 *                 format: email
 *                 example: contact@techgadgets.com
 *               store_phone:
 *                 type: string
 *                 example: "+919876543210"
 *               description:
 *                 type: string
 *                 example: High quality electronics and accessories
 *               address:
 *                 type: string
 *                 example: Shop 12, Commercial Complex
 *               city:
 *                 type: string
 *                 example: Mumbai
 *               state:
 *                 type: string
 *                 example: Maharashtra
 *               postal_code:
 *                 type: string
 *                 example: "400001"
 *               country:
 *                 type: string
 *                 example: India
 *               tax_id:
 *                 type: string
 *                 example: 27AAAAA0000A1Z5
 *               name:
 *                 type: string
 *                 description: Owner name (required if unauthenticated)
 *                 example: Jane Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Owner email (required if unauthenticated)
 *                 example: seller@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Owner password (required if unauthenticated)
 *                 example: Password@123
 *               phone:
 *                 type: string
 *                 example: "+919876543210"
 *     responses:
 *       201:
 *         description: Seller registered successfully. Store submitted for approval.
 *       400:
 *         description: Validation error or missing credentials
 *       409:
 *         description: User already registered or duplicate email/phone/slug
 */
router.post(
  '/register',
  optionalAuthenticate,
  validate(registerVendorSchema),
  vendorController.register
);

/**
 * @swagger
 * /api/v1/vendors/me:
 *   get:
 *     summary: Get Current Vendor Store Details
 *     description: Retrieve store profile for the currently authenticated seller.
 *     tags: [Vendors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Store details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No store profile found for this account
 */
router.get('/me', authenticate, vendorController.getMyStore);

/**
 * @swagger
 * /api/v1/vendors/me:
 *   put:
 *     summary: Update Current Vendor Store Details
 *     description: Update store contact info, description, address, banner, or banking details.
 *     tags: [Vendors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               store_name:
 *                 type: string
 *               store_slug:
 *                 type: string
 *               store_email:
 *                 type: string
 *               store_phone:
 *                 type: string
 *               description:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               postal_code:
 *                 type: string
 *               country:
 *                 type: string
 *               logo_url:
 *                 type: string
 *               banner_url:
 *                 type: string
 *               tax_id:
 *                 type: string
 *               bank_account_name:
 *                 type: string
 *               bank_account_number:
 *                 type: string
 *               bank_ifsc_code:
 *                 type: string
 *               bank_name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Store details updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Store not found
 *       409:
 *         description: Store slug already in use
 */
router.put(
  '/me',
  authenticate,
  validate(updateVendorSchema),
  vendorController.updateMyStore
);

/**
 * @swagger
 * /api/v1/vendors/me/status:
 *   get:
 *     summary: Check Vendor Approval Status
 *     description: Check current seller onboarding and approval status (pending, approved, rejected, suspended).
 *     tags: [Vendors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Store approval status retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Store not found
 */
router.get('/me/status', authenticate, vendorController.getMyStatus);

module.exports = router;
