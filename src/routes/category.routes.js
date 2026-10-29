const express = require('express');
const router = express.Router();

const categoryController = require('../controllers/category.controller');
const { optionalAuthenticate } = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Public product categories and subcategories catalog
 */

/**
 * @swagger
 * /api/v1/categories:
 *   get:
 *     summary: List Active Categories
 *     description: Retrieve list of all active top-level marketplace categories with their active subcategories.
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search categories by name
 *       - in: query
 *         name: parent_id
 *         schema:
 *           type: string
 *         description: Filter by parent category ID (or 'null' for top-level only)
 *     responses:
 *       200:
 *         description: Active categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccessResponse'
 */
router.get('/', categoryController.getCategories);

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   get:
 *     summary: Get Category Details
 *     description: Retrieve details of a specific category or subcategory by ID or slug.
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID or slug
 *     responses:
 *       200:
 *         description: Category details retrieved successfully
 *       404:
 *         description: Category not found
 */
router.get('/:id', optionalAuthenticate, categoryController.getCategoryById);

/**
 * @swagger
 * /api/v1/categories/{id}/subcategories:
 *   get:
 *     summary: List Category Subcategories
 *     description: Retrieve all active subcategories belonging to a parent category.
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Parent Category ID
 *     responses:
 *       200:
 *         description: Subcategories retrieved successfully
 *       404:
 *         description: Parent category not found
 */
router.get('/:id/subcategories', optionalAuthenticate, categoryController.getSubcategories);

/**
 * @swagger
 * /api/v1/categories/{id}/products:
 *   get:
 *     summary: List Products in Category
 *     description: Retrieve all active and approved products belonging to a category or its subcategories with price, sorting, and search filters.
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID or slug
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *       - in: query
 *         name: min_price
 *         schema:
 *           type: number
 *       - in: query
 *         name: max_price
 *         schema:
 *           type: number
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [price_asc, price_desc, low_to_high, high_to_low, newest, oldest]
 *     responses:
 *       200:
 *         description: Products for category retrieved successfully
 *       404:
 *         description: Category not found or inactive
 */
router.get('/:id/products', categoryController.getCategoryProducts);

module.exports = router;

