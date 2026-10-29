const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const inventoryService = require('../services/inventory.service');
const {
  adjustStockSchema,
  updateThresholdSchema,
  inventoryQuerySchema,
  inventoryLogQuerySchema,
  productIdParamSchema,
} = require('../validators/inventory.validator');

/**
 * 1. Get Inventory Overview & Products List
 * GET /api/v1/inventory
 */
const getInventory = asyncHandler(async (req, res) => {
  const queryParams = inventoryQuerySchema.parse(req.query);
  const result = await inventoryService.getInventory(req.user, queryParams);
  return sendSuccess(res, 'Inventory retrieved successfully', result);
});

/**
 * 2. Get Low-Stock Products
 * GET /api/v1/inventory/low-stock
 */
const getLowStockProducts = asyncHandler(async (req, res) => {
  const queryParams = inventoryQuerySchema.parse(req.query);
  const result = await inventoryService.getLowStockProducts(req.user, queryParams);
  return sendSuccess(res, 'Low-stock products retrieved successfully', result);
});

/**
 * 3. Get Stock Details for a Single Product
 * GET /api/v1/inventory/:productId
 */
const getProductStockDetails = asyncHandler(async (req, res) => {
  const { productId } = productIdParamSchema.parse(req.params);
  const result = await inventoryService.getProductStockDetails(req.user, productId);
  return sendSuccess(res, 'Product stock details retrieved successfully', result);
});

/**
 * 4. Adjust Stock (Increase, Decrease, or Set)
 * POST /api/v1/inventory/:productId/adjust
 * PATCH /api/v1/inventory/:productId/stock
 */
const adjustStock = asyncHandler(async (req, res) => {
  const { productId } = productIdParamSchema.parse(req.params);
  const payload = adjustStockSchema.parse(req.body);
  const result = await inventoryService.adjustStock(req.user, productId, payload);
  return sendSuccess(res, 'Product stock adjusted successfully', result, 200);
});

/**
 * 5. Configure Low-Stock Threshold
 * PATCH /api/v1/inventory/:productId/threshold
 */
const updateLowStockThreshold = asyncHandler(async (req, res) => {
  const { productId } = productIdParamSchema.parse(req.params);
  const { low_stock_threshold } = updateThresholdSchema.parse(req.body);
  const result = await inventoryService.updateLowStockThreshold(
    req.user,
    productId,
    low_stock_threshold
  );
  return sendSuccess(res, 'Low-stock threshold updated successfully', result, 200);
});

/**
 * 6. Get Stock Audit History for a Specific Product
 * GET /api/v1/inventory/:productId/logs
 */
const getProductStockHistory = asyncHandler(async (req, res) => {
  const { productId } = productIdParamSchema.parse(req.params);
  const queryParams = inventoryLogQuerySchema.parse(req.query);
  const result = await inventoryService.getProductStockHistory(
    req.user,
    productId,
    queryParams
  );
  return sendSuccess(res, 'Stock history retrieved successfully', result);
});

/**
 * 7. Get Recent Inventory Logs (Cross-product activity feed)
 * GET /api/v1/inventory/logs
 */
const getAllInventoryLogs = asyncHandler(async (req, res) => {
  const queryParams = inventoryLogQuerySchema.parse(req.query);
  const result = await inventoryService.getAllInventoryLogs(req.user, queryParams);
  return sendSuccess(res, 'Inventory audit logs retrieved successfully', result);
});

module.exports = {
  getInventory,
  getLowStockProducts,
  getProductStockDetails,
  adjustStock,
  updateLowStockThreshold,
  getProductStockHistory,
  getAllInventoryLogs,
};
