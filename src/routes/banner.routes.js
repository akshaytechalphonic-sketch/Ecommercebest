const express = require('express');
const router = express.Router();

const bannerController = require('../controllers/banner.controller');
const validate = require('../middleware/validate.middleware');
const { bannerQuerySchema } = require('../validators/banner.validator');

/**
 * @swagger
 * tags:
 *   name: Banners
 *   description: Public customer endpoints for marketplace promotional banners
 */

/**
 * @swagger
 * /api/v1/banners:
 *   get:
 *     summary: List Active Banners
 *     description: Retrieve all currently active and scheduled promotional banners for homepage, slider, strips, or popups.
 *     tags: [Banners]
 *     parameters:
 *       - in: query
 *         name: banner_type
 *         schema:
 *           type: string
 *           enum: [home_hero, home_middle, home_bottom, promo_strip, popup, sidebar]
 *         description: Optional filter by banner placement type
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: integer
 *         description: Filter banners specific to a category (or null for home-only)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Maximum number of banners to return
 *     responses:
 *       200:
 *         description: List of active promotional banners
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccessResponse'
 */
router.get('/', validate(bannerQuerySchema, 'query'), bannerController.getPublicBanners);

/**
 * @swagger
 * /api/v1/banners/{id}:
 *   get:
 *     summary: Get Banner Details
 *     description: Retrieve banner details by its unique ID.
 *     tags: [Banners]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Banner ID
 *     responses:
 *       200:
 *         description: Banner details retrieved
 *       404:
 *         description: Banner not found
 */
router.get('/:id', bannerController.getBannerById);

/**
 * @swagger
 * /api/v1/banners/{id}/click:
 *   post:
 *     summary: Track Banner Click
 *     description: Atomically increments the banner click count for marketing analytics.
 *     tags: [Banners]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Banner ID
 *     responses:
 *       200:
 *         description: Click recorded successfully
 */
router.post('/:id/click', bannerController.recordClick);

module.exports = router;
