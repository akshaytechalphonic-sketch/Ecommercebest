const express = require('express');
const router = express.Router();

const settingController = require('../controllers/setting.controller');

/**
 * @swagger
 * tags:
 *   name: Settings
 *   description: Dynamic marketplace branding, store logo, and public configuration
 */

/**
 * @swagger
 * /api/v1/settings/branding:
 *   get:
 *     summary: Get Dynamic Store Branding & Logo
 *     description: Retrieve dynamic site identity including store logo, dark mode logo, favicon, site name, and tagline.
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: Dynamic branding details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccessResponse'
 */
router.get('/branding', settingController.getBranding);

/**
 * @swagger
 * /api/v1/settings/public:
 *   get:
 *     summary: Get All Public Store Settings
 *     description: Retrieve key-value map of public platform settings.
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: Public settings map
 */
router.get('/public', settingController.getPublicSettings);

module.exports = router;
