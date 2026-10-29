const express = require('express');
const router = express.Router();

const categoryController = require('../controllers/category.controller');
const validate = require('../middleware/validate.middleware');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');
const {
  createCategorySchema,
  updateCategorySchema,
  createSubcategorySchema,
} = require('../validators/category.validator');

/**
 * @swagger
 * tags:
 *   name: Admin Categories
 *   description: Marketplace administration of categories and subcategories
 */

/**
 * @swagger
 * /api/v1/admin/categories:
 *   post:
 *     summary: Create Category (Admin only)
 *     description: Create a new top-level category or subcategory with slug, images, and status.
 *     tags: [Admin Categories]
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
 *                 example: Electronics
 *               slug:
 *                 type: string
 *                 example: electronics
 *               description:
 *                 type: string
 *                 example: Electronic gadgets, phones, laptops and more
 *               banner_image:
 *                 type: string
 *                 example: https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1200
 *               thumbnail_image:
 *                 type: string
 *                 example: https://images.unsplash.com/photo-1498049794561-7780e7231661?w=300
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 default: active
 *               parent_id:
 *                 type: integer
 *                 nullable: true
 *                 example: null
 *               display_order:
 *                 type: integer
 *                 default: 0
 *                 example: 1
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       409:
 *         description: Slug already in use
 */
router.post(
  '/',
  authenticate,
  authorizeRoles('admin'),
  validate(createCategorySchema),
  categoryController.createCategory
);

/**
 * @swagger
 * /api/v1/admin/categories:
 *   get:
 *     summary: List All Categories (Admin only)
 *     description: Retrieve all categories (including inactive) with their subcategories for admin management.
 *     tags: [Admin Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter by status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search category name
 *       - in: query
 *         name: parent_id
 *         schema:
 *           type: string
 *         description: Filter by parent ID or 'null' for top-level only
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get(
  '/',
  authenticate,
  authorizeRoles('admin'),
  categoryController.adminGetCategories
);

/**
 * @swagger
 * /api/v1/admin/categories/{id}:
 *   put:
 *     summary: Update Category (Admin only)
 *     description: Update category details, images, status, or parent hierarchy.
 *     tags: [Admin Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Category ID
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
 *               description:
 *                 type: string
 *               banner_image:
 *                 type: string
 *               thumbnail_image:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *               parent_id:
 *                 type: integer
 *                 nullable: true
 *               display_order:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       400:
 *         description: Validation error or cycle assignment
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Category not found
 */
router.put(
  '/:id',
  authenticate,
  authorizeRoles('admin'),
  validate(updateCategorySchema),
  categoryController.updateCategory
);

/**
 * @swagger
 * /api/v1/admin/categories/{id}:
 *   delete:
 *     summary: Delete or Safely Deactivate Category (Admin only)
 *     description: Delete a category or safely deactivate it and all its subcategories by passing ?deactivate=true.
 *     tags: [Admin Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Category ID
 *       - in: query
 *         name: deactivate
 *         schema:
 *           type: boolean
 *           default: false
 *         description: If true, safely sets status to inactive instead of permanently deleting
 *     responses:
 *       200:
 *         description: Category deleted or deactivated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Category not found
 */
router.delete(
  '/:id',
  authenticate,
  authorizeRoles('admin'),
  categoryController.deleteCategory
);

/**
 * @swagger
 * /api/v1/admin/categories/{id}/subcategories:
 *   post:
 *     summary: Create Subcategory (Admin only)
 *     description: Create a subcategory directly linked to parent category with ID :id.
 *     tags: [Admin Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Parent Category ID
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
 *                 example: Smartphones
 *               slug:
 *                 type: string
 *                 example: smartphones
 *               description:
 *                 type: string
 *                 example: iOS, Android, and 5G flagship smartphones
 *               banner_image:
 *                 type: string
 *               thumbnail_image:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 default: active
 *               display_order:
 *                 type: integer
 *                 default: 0
 *     responses:
 *       201:
 *         description: Subcategory created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Parent category not found
 *       409:
 *         description: Slug already in use
 */
router.post(
  '/:id/subcategories',
  authenticate,
  authorizeRoles('admin'),
  validate(createSubcategorySchema),
  categoryController.createSubcategory
);

module.exports = router;
