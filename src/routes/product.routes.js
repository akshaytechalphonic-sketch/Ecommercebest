const express = require('express');
const router = express.Router();

const productController = require('../controllers/product.controller');
const validate = require('../middleware/validate.middleware');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');
const {
  createProductSchema,
  updateProductSchema,
} = require('../validators/product.validator');

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Marketplace product catalog, seller product management, and inventories
 */

/**
 * @swagger
 * /api/v1/products/seller/me:
 *   get:
 *     summary: List Authenticated Seller's Products
 *     description: Retrieve all products created by the authenticated seller with status and approval filters.
 *     tags: [Products]
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
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, draft]
 *       - in: query
 *         name: approval_status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Seller products retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Approved Seller access required
 */
router.get(
  '/seller/me',
  authenticate,
  authorizeRoles('vendor', 'admin'),
  productController.getSellerProducts
);

/**
 * @swagger
 * /api/v1/products/seller/me/{id}:
 *   get:
 *     summary: Get Seller's Specific Product by ID
 *     description: Retrieve complete details for a specific product owned by the authenticated seller.
 *     tags: [Products]
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
 *         description: Product retrieved successfully
 *       403:
 *         description: Unauthorized product access
 *       404:
 *         description: Product not found
 */
router.get(
  '/seller/me/:id',
  authenticate,
  authorizeRoles('vendor', 'admin'),
  productController.getSellerProductById
);

/**
 * @swagger
 * /api/v1/products:
 *   post:
 *     summary: Add New Product (Approved Sellers only)
 *     description: Create a new marketplace product. Requires seller to have an approved store profile. Products default to pending review.
 *     tags: [Products]
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
 *               - category_id
 *               - price
 *               - sku
 *             properties:
 *               name:
 *                 type: string
 *                 example: Wireless Noise-Cancelling Headphones
 *               slug:
 *                 type: string
 *                 example: wireless-noise-cancelling-headphones
 *               description:
 *                 type: string
 *                 example: Premium over-ear headphones with 40h battery life and active noise cancelling.
 *               category_id:
 *                 type: integer
 *                 example: 1
 *               subcategory_id:
 *                 type: integer
 *                 nullable: true
 *                 example: 2
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e"]
 *               price:
 *                 type: number
 *                 format: float
 *                 example: 4999.00
 *               discount_price:
 *                 type: number
 *                 format: float
 *                 nullable: true
 *                 example: 3999.00
 *               sku:
 *                 type: string
 *                 example: HEADPHONE-WNC-01
 *               stock:
 *                 type: integer
 *                 example: 50
 *               status:
 *                 type: string
 *                 enum: [active, inactive, draft]
 *                 default: active
 *     responses:
 *       201:
 *         description: Product created successfully and submitted for admin review
 *       400:
 *         description: Validation error or invalid category hierarchy
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Seller approval required
 *       409:
 *         description: Duplicate SKU or duplicate Slug
 */
router.post(
  '/',
  authenticate,
  authorizeRoles('vendor', 'admin'),
  validate(createProductSchema),
  productController.createProduct
);

/**
 * @swagger
 * /api/v1/products:
 *   get:
 *     summary: Browse Public Marketplace Catalog
 *     description: Retrieve all active and approved products visible to marketplace customers with filters and sorting.
 *     tags: [Products]
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
 *           default: 12
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or description
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Search specifically by product name
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: category_slug
 *         schema:
 *           type: string
 *       - in: query
 *         name: subcategory_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: subcategory_slug
 *         schema:
 *           type: string
 *       - in: query
 *         name: vendor_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: min_price
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: max_price
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: in_stock
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [price_asc, price_desc, low_to_high, high_to_low, newest, oldest, name_asc, name_desc]
 *         description: Pre-configured sorting options (e.g. low_to_high, high_to_low)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [created_at, price, name, stock]
 *           default: created_at
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 */
router.get('/', productController.getPublicProducts);

/**
 * @swagger
 * /api/v1/products/search:
 *   get:
 *     summary: Search Marketplace Products
 *     description: Search active and approved products by name or keywords with category, price filters and sorting.
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Keyword search across product name and description
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter specifically by product name
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Shorthand query parameter for search
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: subcategory_id
 *         schema:
 *           type: integer
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
 *           enum: [low_to_high, high_to_low, price_asc, price_desc, newest, oldest]
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
 *     responses:
 *       200:
 *         description: Matching products retrieved successfully
 */
router.get('/search', productController.getPublicProducts);

/**
 * @swagger
 * /api/v1/products/{idOrSlug}:
 *   get:
 *     summary: Get Public Product Details
 *     description: Retrieve details for a public active and approved product by ID or slug. Only approved products from approved sellers are accessible.
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: idOrSlug
 *         required: true
 *         schema:
 *           type: string
 *         description: Numeric Product ID or URL slug
 *     responses:
 *       200:
 *         description: Product details retrieved successfully
 *       404:
 *         description: Product not found or unavailable
 */
router.get('/:idOrSlug', productController.getPublicProductDetails);

/**
 * @swagger
 * /api/v1/products/{id}:
 *   put:
 *     summary: Update Product (Seller only)
 *     description: Update details of an existing product owned by the authenticated seller.
 *     tags: [Products]
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
 *               description:
 *                 type: string
 *               category_id:
 *                 type: integer
 *               subcategory_id:
 *                 type: integer
 *               price:
 *                 type: number
 *               discount_price:
 *                 type: number
 *               sku:
 *                 type: string
 *               stock:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [active, inactive, draft]
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden - Not authorized to manage this product
 *       404:
 *         description: Product not found
 */
router.put(
  '/:id',
  authenticate,
  authorizeRoles('vendor', 'admin'),
  validate(updateProductSchema),
  productController.updateSellerProduct
);

/**
 * @swagger
 * /api/v1/products/{id}:
 *   delete:
 *     summary: Delete or Deactivate Product (Seller only)
 *     description: Permanently delete or safely deactivate (status=inactive) a product owned by the seller.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: deactivate
 *         schema:
 *           type: boolean
 *           default: false
 *         description: If true, product is set to inactive rather than deleted permanently
 *     responses:
 *       200:
 *         description: Product deleted or deactivated successfully
 *       403:
 *         description: Forbidden - Not authorized to delete this product
 *       404:
 *         description: Product not found
 */
router.delete(
  '/:id',
  authenticate,
  authorizeRoles('vendor', 'admin'),
  productController.deleteSellerProduct
);

module.exports = router;
