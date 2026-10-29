const express = require('express');
const router = express.Router();

const settingController = require('../controllers/setting.controller');
const validate = require('../middleware/validate.middleware');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');
const {
  updateBrandingSchema,
  updateSettingsSchema,
} = require('../validators/setting.validator');

/**
 * @swagger
 * tags:
 *   name: Admin Settings
 *   description: Administrator control for dynamic logo, brand identity, and platform configuration
 */

// All routes require Administrator authentication
router.use(authenticate, authorizeRoles('admin'));

/**
 * @swagger
 * /api/v1/admin/settings:
 *   get:
 *     summary: Get All Settings (Admin only)
 *     description: Retrieve all platform configuration and branding settings grouped by category.
 *     tags: [Admin Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of platform settings
 */
router.get('/', settingController.getAllSettings);

/**
 * @swagger
 * /api/v1/admin/settings/branding:
 *   put:
 *     summary: Update Dynamic Logo & Store Branding (Admin only)
 *     description: Dynamically update site logo, dark logo, favicon, marketplace name, and tagline.
 *     tags: [Admin Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               site_name:
 *                 type: string
 *                 example: Bada Vyapaar
 *               site_tagline:
 *                 type: string
 *                 example: India's Leading Multi-Vendor Marketplace
 *               site_logo:
 *                 type: string
 *                 example: https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200
 *               site_dark_logo:
 *                 type: string
 *                 example: https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200
 *               site_favicon:
 *                 type: string
 *                 example: https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=64
 *               contact_email:
 *                 type: string
 *                 example: support@multivendor.com
 *               contact_phone:
 *                 type: string
 *                 example: +91 98765 43210
 *     responses:
 *       200:
 *         description: Dynamic branding updated successfully
 */
router.put('/branding', validate(updateBrandingSchema, 'body'), settingController.updateBranding);

/**
 * @swagger
 * /api/v1/admin/settings:
 *   put:
 *     summary: Bulk Update Platform Settings (Admin only)
 *     description: Update multiple configuration settings at once.
 *     tags: [Admin Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - settings
 *             properties:
 *               settings:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - key
 *                     - value
 *                   properties:
 *                     key:
 *                       type: string
 *                     value:
 *                       type: string
 *                     group:
 *                       type: string
 *     responses:
 *       200:
 *         description: Settings saved successfully
 */
router.put('/', validate(updateSettingsSchema, 'body'), settingController.bulkUpdateSettings);

module.exports = router;
