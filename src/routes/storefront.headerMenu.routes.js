const express = require('express');
const router = express.Router();

const headerMenuController = require('../controllers/headerMenu.controller');

/**
 * @swagger
 * tags:
 *   name: Storefront Navigation
 *   description: Public navigation APIs for storefront header menus, nested category trees, and promotional banners
 */

/**
 * @swagger
 * /api/v1/storefront/header-menu:
 *   get:
 *     summary: Get Storefront Header Menus
 *     description: Retrieve all active header menus with multi-level nested submenus and associated active banners in display order. Public API, no authentication required.
 *     tags: [Storefront Navigation]
 *     responses:
 *       200:
 *         description: Active header menus and nested items retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Storefront header menu retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: Home
 *                       slug:
 *                         type: string
 *                         example: home
 *                       url:
 *                         type: string
 *                         example: /home
 *                       icon:
 *                         type: string
 *                         nullable: true
 *                       image:
 *                         type: string
 *                         nullable: true
 *                       status:
 *                         type: string
 *                         example: active
 *                       display_order:
 *                         type: integer
 *                         example: 1
 *                       banner:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           id:
 *                             type: integer
 *                           title:
 *                             type: string
 *                           image_url:
 *                             type: string
 *                           link_url:
 *                             type: string
 *                       items:
 *                         type: array
 *                         description: Nested submenu items tree
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                             name:
 *                               type: string
 *                               example: Bed & Bath
 *                             slug:
 *                               type: string
 *                               example: bed-and-bath
 *                             children:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   id:
 *                                     type: integer
 *                                   name:
 *                                     type: string
 *                                     example: Bedsheets
 */
router.get('/', headerMenuController.getStorefrontHeaderMenu);

module.exports = router;

