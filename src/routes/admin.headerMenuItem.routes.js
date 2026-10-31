const express = require('express');
const router = express.Router();

const headerMenuController = require('../controllers/headerMenu.controller');
const validate = require('../middleware/validate.middleware');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');
const { updateHeaderMenuItemSchema } = require('../validators/headerMenu.validator');

/**
 * @swagger
 * tags:
 *   name: Admin Header Menu Items
 *   description: Administrator management of nested submenus, child items, and categories/banners linking
 */

// All routes require Administrator authentication
router.use(authenticate, authorizeRoles('admin'));

/**
 * @swagger
 * /api/v1/admin/header-menu-items/{itemId}:
 *   put:
 *     summary: Update Submenu Item (Admin only)
 *     description: Update submenu item name, slug, parent_id, redirect_url, image, display_order, is_active, category_id, or banner_id.
 *     tags: [Admin Header Menu Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               parent_id:
 *                 type: integer
 *                 nullable: true
 *               category_id:
 *                 type: integer
 *                 nullable: true
 *               redirect_url:
 *                 type: string
 *               image:
 *                 type: string
 *               display_order:
 *                 type: integer
 *               is_active:
 *                 type: boolean
 *               banner_id:
 *                 type: integer
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Header menu item updated successfully
 *       404:
 *         description: Header menu item not found
 */
router.put('/:itemId', validate(updateHeaderMenuItemSchema), headerMenuController.updateHeaderMenuItem);

/**
 * @swagger
 * /api/v1/admin/header-menu-items/{itemId}:
 *   delete:
 *     summary: Delete Submenu Item (Admin only)
 *     description: Delete a submenu item and any nested child items under it.
 *     tags: [Admin Header Menu Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Header menu item deleted successfully
 *       404:
 *         description: Header menu item not found
 */
router.delete('/:itemId', headerMenuController.deleteHeaderMenuItem);

module.exports = router;

