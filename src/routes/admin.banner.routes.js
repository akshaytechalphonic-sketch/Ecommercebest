const express = require('express');
const router = express.Router();

const bannerController = require('../controllers/banner.controller');
const validate = require('../middleware/validate.middleware');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');
const {
  createBannerSchema,
  updateBannerSchema,
  bannerStatusSchema,
  bannerQuerySchema,
} = require('../validators/banner.validator');

/**
 * @swagger
 * tags:
 *   name: Admin Banners
 *   description: Administrator management of promotional banners and campaign placements
 */

// All routes require Administrator authentication
router.use(authenticate, authorizeRoles('admin'));

/**
 * @swagger
 * /api/v1/admin/banners:
 *   get:
 *     summary: List All Banners (Admin only)
 *     description: Retrieve paginated banners with performance metrics (impressions, clicks, statuses).
 *     tags: [Admin Banners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: banner_type
 *         schema:
 *           type: string
 *           enum: [home_hero, home_middle, home_bottom, promo_strip, popup, sidebar]
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: integer
 *         description: Filter banners specific to a category
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paginated banners with summary statistics
 */
router.get('/', validate(bannerQuerySchema, 'query'), bannerController.getAdminBanners);

/**
 * @swagger
 * /api/v1/admin/banners:
 *   post:
 *     summary: Create Promotional Banner (Admin only)
 *     description: Add a new promotional banner with target links, image URLs, placement type, and schedules.
 *     tags: [Admin Banners]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - image_url
 *             properties:
 *               title:
 *                 type: string
 *                 example: Mega Festive Electronics Sale
 *               subtitle:
 *                 type: string
 *                 example: Up to 60% Off Top Brands
 *               description:
 *                 type: string
 *                 example: Limited time offer on laptops, smartphones and accessories.
 *               image_url:
 *                 type: string
 *                 example: https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1400
 *               mobile_image_url:
 *                 type: string
 *                 example: https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600
 *               link_url:
 *                 type: string
 *                 example: /category/electronics
 *               banner_type:
 *                 type: string
 *                 enum: [home_hero, home_middle, home_bottom, promo_strip, popup, sidebar]
 *                 default: home_hero
 *               category_id:
 *                 type: integer
 *                 nullable: true
 *                 example: 1
 *                 description: Optional category ID for category-specific banners (leave null for homepage)
 *               position:
 *                 type: integer
 *                 default: 1
 *               is_active:
 *                 type: boolean
 *                 default: true
 *               start_date:
 *                 type: string
 *                 format: date-time
 *               end_date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Banner created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 */
router.post('/', validate(createBannerSchema, 'body'), bannerController.createBanner);

/**
 * @swagger
 * /api/v1/admin/banners/{id}:
 *   put:
 *     summary: Update Banner (Admin only)
 *     description: Update banner details, schedules, target links, and images.
 *     tags: [Admin Banners]
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
 *     responses:
 *       200:
 *         description: Banner updated successfully
 *       404:
 *         description: Banner not found
 */
router.put('/:id', validate(updateBannerSchema, 'body'), bannerController.updateBanner);

/**
 * @swagger
 * /api/v1/admin/banners/{id}/status:
 *   patch:
 *     summary: Toggle Banner Active Status (Admin only)
 *     description: Instantly activate or pause a promotional banner.
 *     tags: [Admin Banners]
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
 *             required:
 *               - is_active
 *             properties:
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Banner status updated
 */
router.patch('/:id/status', validate(bannerStatusSchema, 'body'), bannerController.updateBannerStatus);

/**
 * @swagger
 * /api/v1/admin/banners/{id}:
 *   delete:
 *     summary: Delete Banner (Admin only)
 *     description: Permanently remove a promotional banner.
 *     tags: [Admin Banners]
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
 *         description: Banner deleted successfully
 */
router.delete('/:id', bannerController.deleteBanner);

module.exports = router;
