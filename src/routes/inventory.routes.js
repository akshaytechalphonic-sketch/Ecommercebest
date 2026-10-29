const express = require('express');
const router = express.Router();

const inventoryController = require('../controllers/inventory.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Inventory & Stock Management
 *   description: Stock tracking, atomic adjustments, threshold alerts, and audit logging for sellers and admins
 */

// All inventory endpoints require authentication and either vendor or admin role
router.use(authenticate, authorizeRoles('vendor', 'admin'));

/**
 * @swagger
 * /api/v1/inventory:
 *   get:
 *     summary: View Inventory Overview & Products List
 *     description: Retrieve list of products with current stock, threshold, low-stock flag, and summary stats. Sellers see only their products; admins can view all or filter by seller.
 *     tags: [Inventory & Stock Management]
 *     security:
 *       - BearerAuth: []
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
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *           enum: [all, low_stock, in_stock, out_of_stock]
 *           default: all
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, active, inactive, draft]
 *       - in: query
 *         name: vendor_id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Inventory list retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/', inventoryController.getInventory);

/**
 * @swagger
 * /api/v1/inventory/low-stock:
 *   get:
 *     summary: Get Low-Stock Products List
 *     description: Retrieve all products where stock is less than or equal to their low-stock threshold.
 *     tags: [Inventory & Stock Management]
 *     security:
 *       - BearerAuth: []
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
 *     responses:
 *       200:
 *         description: Low-stock products list retrieved successfully
 */
router.get('/low-stock', inventoryController.getLowStockProducts);

/**
 * @swagger
 * /api/v1/inventory/logs:
 *   get:
 *     summary: Get Inventory Activity Feed / Audit Logs
 *     description: Retrieve recent stock change logs across products for the seller or entire marketplace for admin.
 *     tags: [Inventory & Stock Management]
 *     security:
 *       - BearerAuth: []
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
 *         name: product_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: action_type
 *         schema:
 *           type: string
 *           enum: [increase, decrease, set, threshold_update]
 *     responses:
 *       200:
 *         description: Inventory audit logs retrieved successfully
 */
router.get('/logs', inventoryController.getAllInventoryLogs);

/**
 * @swagger
 * /api/v1/inventory/{productId}:
 *   get:
 *     summary: Get Product Stock Details
 *     description: Retrieve stock details, threshold, status, and recent stock adjustment logs for a specific product.
 *     tags: [Inventory & Stock Management]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Product stock details retrieved successfully
 *       404:
 *         description: Product not found
 */
router.get('/:productId', inventoryController.getProductStockDetails);

/**
 * @swagger
 * /api/v1/inventory/{productId}/adjust:
 *   post:
 *     summary: Adjust Product Stock (Atomic Concurrency-Safe)
 *     description: Increase, decrease, or set stock for a product. Atomically locked with Sequelize transactions to prevent overselling. History log is automatically recorded.
 *     tags: [Inventory & Stock Management]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
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
 *               - action
 *               - quantity
 *               - reason
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [increase, decrease, set]
 *                 example: increase
 *               quantity:
 *                 type: integer
 *                 minimum: 0
 *                 example: 25
 *               reason:
 *                 type: string
 *                 example: Supplier batch restocked
 *     responses:
 *       200:
 *         description: Stock adjusted successfully
 *       400:
 *         description: Invalid input or insufficient stock (cannot be negative)
 *       403:
 *         description: Unauthorized product access
 *       404:
 *         description: Product not found
 */
router.post('/:productId/adjust', inventoryController.adjustStock);
router.patch('/:productId/stock', inventoryController.adjustStock);

/**
 * @swagger
 * /api/v1/inventory/{productId}/threshold:
 *   patch:
 *     summary: Configure Low-Stock Threshold
 *     description: Set the low-stock alert threshold for a specific product.
 *     tags: [Inventory & Stock Management]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
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
 *               - low_stock_threshold
 *             properties:
 *               low_stock_threshold:
 *                 type: integer
 *                 minimum: 0
 *                 example: 10
 *     responses:
 *       200:
 *         description: Low-stock threshold updated successfully
 *       400:
 *         description: Invalid threshold
 *       403:
 *         description: Unauthorized product access
 */
router.patch('/:productId/threshold', inventoryController.updateLowStockThreshold);

/**
 * @swagger
 * /api/v1/inventory/{productId}/logs:
 *   get:
 *     summary: Get Stock Change Audit History for a Specific Product
 *     description: View chronological audit trail of all previous stock changes, previous stock, quantity changed, new stock, reason, and actor.
 *     tags: [Inventory & Stock Management]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
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
 *     responses:
 *       200:
 *         description: Stock history retrieved successfully
 */
router.get('/:productId/logs', inventoryController.getProductStockHistory);

module.exports = router;
