const express = require('express');
const router = express.Router();

const headerMenuController = require('../controllers/headerMenu.controller');
const validate = require('../middleware/validate.middleware');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');
const {
  createHeaderMenuSchema,
  updateHeaderMenuSchema,
  headerMenuStatusSchema,
  reorderHeaderMenusSchema,
  createHeaderMenuItemSchema,
} = require('../validators/headerMenu.validator');

/**
 * @swagger
 * tags:
 *   name: Admin Header Menus
 *   description: Administrator management of dynamic header menus, nested submenus, display order, and banner associations
 */

// All routes require Administrator authentication
router.use(authenticate, authorizeRoles('admin'));

/**
 * @swagger
 * /api/v1/admin/header-menus:
 *   post:
 *     summary: Create Header Menu (Admin only)
 *     description: Add a new dynamic header menu (e.g. Women, Men, Kids, Home, New In, Sale).
 *     tags: [Admin Header Menus]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Home & Living
 *               slug:
 *                 type: string
 *                 example: home-and-living
 *               url:
 *                 type: string
 *                 example: /category/home-and-living
 *               icon:
 *                 type: string
 *                 example: https://example.com/icons/home.svg
 *               image:
 *                 type: string
 *                 example: https://example.com/images/home-hero.jpg
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 default: active
 *               display_order:
 *                 type: integer
 *                 default: 0
 *               banner_id:
 *                 type: integer
 *                 nullable: true
 *                 example: 1
 *               category_id:
 *                 type: integer
 *                 nullable: true
 *                 example: 3
 *     responses:
 *       201:
 *         description: Header menu created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Menu slug already exists
 */
router.post('/', validate(createHeaderMenuSchema), headerMenuController.createHeaderMenu);

/**
 * @swagger
 * /api/v1/admin/header-menus:
 *   get:
 *     summary: List All Header Menus (Admin only)
 *     description: Retrieve all header menus (active and inactive) with complete nested submenus and linked banners.
 *     tags: [Admin Header Menus]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All header menus retrieved successfully
 */
router.get('/', headerMenuController.getAdminHeaderMenus);

/**
 * @swagger
 * /api/v1/admin/header-menus/reorder:
 *   patch:
 *     summary: Reorder Multiple Header Menus (Admin only)
 *     description: Update display order of multiple header menus in a single atomic request.
 *     tags: [Admin Header Menus]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - id
 *                     - display_order
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     display_order:
 *                       type: integer
 *                       example: 2
 *     responses:
 *       200:
 *         description: Header menus reordered successfully
 */
router.patch('/reorder', validate(reorderHeaderMenusSchema), headerMenuController.reorderHeaderMenus);

/**
 * @swagger
 * /api/v1/admin/header-menus/{id}:
 *   get:
 *     summary: Get Header Menu Details (Admin only)
 *     description: Retrieve details of a specific header menu by ID with nested submenus and banner.
 *     tags: [Admin Header Menus]
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
 *         description: Header menu retrieved successfully
 *       404:
 *         description: Header menu not found
 */
router.get('/:id', headerMenuController.getHeaderMenuById);

/**
 * @swagger
 * /api/v1/admin/header-menus/{id}:
 *   put:
 *     summary: Update Header Menu (Admin only)
 *     description: Update menu name, slug, URL, image, status, banner, or display order.
 *     tags: [Admin Header Menus]
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
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               url:
 *                 type: string
 *               icon:
 *                 type: string
 *               image:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *               display_order:
 *                 type: integer
 *               banner_id:
 *                 type: integer
 *                 nullable: true
 *               category_id:
 *                 type: integer
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Header menu updated successfully
 *       404:
 *         description: Header menu not found
 */
router.put('/:id', validate(updateHeaderMenuSchema), headerMenuController.updateHeaderMenu);

/**
 * @swagger
 * /api/v1/admin/header-menus/{id}:
 *   delete:
 *     summary: Delete Header Menu (Admin only)
 *     description: Safely delete a header menu and cascade delete its nested submenus.
 *     tags: [Admin Header Menus]
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
 *         description: Header menu deleted successfully
 *       404:
 *         description: Header menu not found
 */
router.delete('/:id', headerMenuController.deleteHeaderMenu);

/**
 * @swagger
 * /api/v1/admin/header-menus/{id}/status:
 *   patch:
 *     summary: Activate or Deactivate Header Menu (Admin only)
 *     description: Toggle status between active and inactive.
 *     tags: [Admin Header Menus]
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
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 example: active
 *               is_active:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Header menu status updated successfully
 *       404:
 *         description: Header menu not found
 */
router.patch('/:id/status', validate(headerMenuStatusSchema), headerMenuController.updateHeaderMenuStatus);

/**
 * @swagger
 * /api/v1/admin/header-menus/{id}/items:
 *   post:
 *     summary: Add Submenu Item (Admin only)
 *     description: Add a submenu item or nested child item under header menu {id}. Supports multi-level nesting via parent_id.
 *     tags: [Admin Header Menus]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Header Menu ID
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Bed & Bath
 *               slug:
 *                 type: string
 *                 example: bed-and-bath
 *               parent_id:
 *                 type: integer
 *                 nullable: true
 *                 description: ID of parent submenu item for nested levels (null for level-1 submenus)
 *                 example: null
 *               category_id:
 *                 type: integer
 *                 nullable: true
 *                 description: Optional link to existing Category
 *                 example: 5
 *               redirect_url:
 *                 type: string
 *                 example: /category/bed-and-bath
 *               image:
 *                 type: string
 *                 nullable: true
 *                 example: https://example.com/images/bed-bath.jpg
 *               display_order:
 *                 type: integer
 *                 default: 0
 *               is_active:
 *                 type: boolean
 *                 default: true
 *               banner_id:
 *                 type: integer
 *                 nullable: true
 *                 description: Optional link to existing promotional Banner
 *                 example: 2
 *     responses:
 *       201:
 *         description: Header menu item created successfully
 *       404:
 *         description: Header menu or parent item not found
 */
router.post('/:id/items', validate(createHeaderMenuItemSchema), headerMenuController.createHeaderMenuItem);

/**
 * @swagger
 * /api/v1/admin/header-menus/{id}/items:
 *   get:
 *     summary: Get All Items of a Header Menu (Admin only)
 *     description: Retrieve all submenu items of header menu {id} in nested hierarchical tree format.
 *     tags: [Admin Header Menus]
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
 *         description: Header menu items retrieved successfully
 *       404:
 *         description: Header menu not found
 */
router.get('/:id/items', headerMenuController.getHeaderMenuItems);

module.exports = router;

