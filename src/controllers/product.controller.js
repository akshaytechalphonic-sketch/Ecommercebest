const productService = require('../services/product.service');
const { sendSuccess } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');
const { productListQuerySchema } = require('../validators/product.validator');

/**
 * 1. Seller: Add Product
 * POST /api/v1/products OR POST /api/v1/vendor/products
 */
const createProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.user, req.body);
  return sendSuccess(
    res,
    'Product created successfully and submitted for admin review',
    product,
    201
  );
});

/**
 * 2. Seller: List My Products
 * GET /api/v1/vendor/products OR GET /api/v1/products/seller/me
 */
const getSellerProducts = asyncHandler(async (req, res) => {
  const queryParams = productListQuerySchema.parse(req.query);
  const result = await productService.getSellerProducts(req.user, queryParams);
  return sendSuccess(res, 'Seller products retrieved successfully', result);
});

/**
 * 3. Seller: Get My Product By ID
 * GET /api/v1/vendor/products/:id
 */
const getSellerProductById = asyncHandler(async (req, res) => {
  const product = await productService.getSellerProductById(req.user, req.params.id);
  return sendSuccess(res, 'Product details retrieved successfully', product);
});

/**
 * 4. Seller: Update Product
 * PUT /api/v1/products/:id OR PUT /api/v1/vendor/products/:id
 */
const updateSellerProduct = asyncHandler(async (req, res) => {
  const updatedProduct = await productService.updateSellerProduct(
    req.user,
    req.params.id,
    req.body
  );
  return sendSuccess(res, 'Product updated successfully', updatedProduct);
});

/**
 * 5. Seller: Delete / Deactivate Product
 * DELETE /api/v1/products/:id OR DELETE /api/v1/vendor/products/:id
 */
const deleteSellerProduct = asyncHandler(async (req, res) => {
  const deactivate = req.query.deactivate === 'true' || req.query.deactivate === true;
  const result = await productService.deleteSellerProduct(req.user, req.params.id, {
    deactivate,
  });
  return sendSuccess(res, result.message, result);
});

/**
 * 6. Admin: List All Products
 * GET /api/v1/admin/products
 */
const adminListProducts = asyncHandler(async (req, res) => {
  const queryParams = productListQuerySchema.parse(req.query);
  const result = await productService.adminListProducts(queryParams);
  return sendSuccess(res, 'Products retrieved successfully for admin', result);
});

/**
 * 7. Admin: Approve or Reject Product
 * PATCH /api/v1/admin/products/:id/status
 */
const adminUpdateProductApproval = asyncHandler(async (req, res) => {
  const updatedProduct = await productService.adminUpdateProductApproval(
    req.params.id,
    req.body
  );
  return sendSuccess(
    res,
    `Product approval status updated to '${req.body.approval_status}'`,
    updatedProduct
  );
});

/**
 * 8. Public: Browse Active & Approved Products
 * GET /api/v1/products
 */
const getPublicProducts = asyncHandler(async (req, res) => {
  const queryParams = productListQuerySchema.parse(req.query);
  const result = await productService.getPublicProducts(queryParams);
  return sendSuccess(res, 'Products retrieved successfully', result);
});

/**
 * 9. Public: Get Product Details by ID or Slug
 * GET /api/v1/products/:idOrSlug
 */
const getPublicProductDetails = asyncHandler(async (req, res) => {
  const product = await productService.getPublicProductDetails(req.params.idOrSlug);
  return sendSuccess(res, 'Product details retrieved successfully', product);
});

module.exports = {
  createProduct,
  getSellerProducts,
  getSellerProductById,
  updateSellerProduct,
  deleteSellerProduct,
  adminListProducts,
  adminUpdateProductApproval,
  getPublicProducts,
  getPublicProductDetails,
};
