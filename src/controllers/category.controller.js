const categoryService = require('../services/category.service');
const productService = require('../services/product.service');
const { sendSuccess } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');
const { productListQuerySchema } = require('../validators/product.validator');

/**
 * 1. Admin: Create Category
 * POST /api/v1/admin/categories
 */
const createCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.body);
  return sendSuccess(res, 'Category created successfully', category, 201);
});

/**
 * 2. Public / App: Get Active Categories List
 * GET /api/v1/categories
 */
const getCategories = asyncHandler(async (req, res) => {
  const categories = await categoryService.getCategories({
    ...req.query,
    all: false,
  });
  return sendSuccess(res, 'Categories retrieved successfully', categories);
});

/**
 * Admin: Get All Categories (Active & Inactive)
 * GET /api/v1/admin/categories
 */
const adminGetCategories = asyncHandler(async (req, res) => {
  const categories = await categoryService.getCategories({
    ...req.query,
    all: true,
  });
  return sendSuccess(res, 'All categories retrieved successfully', categories);
});

/**
 * 3. Public / App: Get Category Details by ID or Slug
 * GET /api/v1/categories/:id
 */
const getCategoryById = asyncHandler(async (req, res) => {
  const isAdmin = req.user && req.user.role === 'admin';
  const category = await categoryService.getCategoryById(req.params.id, {
    all: isAdmin,
  });
  return sendSuccess(res, 'Category details retrieved successfully', category);
});

/**
 * 4. Admin: Update Category
 * PUT /api/v1/admin/categories/:id
 */
const updateCategory = asyncHandler(async (req, res) => {
  const updatedCategory = await categoryService.updateCategory(
    req.params.id,
    req.body
  );
  return sendSuccess(res, 'Category updated successfully', updatedCategory);
});

/**
 * 5. Admin: Delete or Safely Deactivate Category
 * DELETE /api/v1/admin/categories/:id
 */
const deleteCategory = asyncHandler(async (req, res) => {
  const safe_deactivate =
    req.query.deactivate === 'true' || req.query.safe === 'true';
  const result = await categoryService.deleteCategory(req.params.id, {
    safe_deactivate,
  });
  return sendSuccess(res, result.message, result);
});

/**
 * 6. Admin: Create Subcategory linked to parent :id
 * POST /api/v1/admin/categories/:id/subcategories
 */
const createSubcategory = asyncHandler(async (req, res) => {
  const subcategory = await categoryService.createSubcategory(
    req.params.id,
    req.body
  );
  return sendSuccess(
    res,
    'Subcategory created successfully',
    subcategory,
    201
  );
});

/**
 * 7. Public / App: Get Subcategories of a Category
 * GET /api/v1/categories/:id/subcategories
 */
const getSubcategories = asyncHandler(async (req, res) => {
  const isAdmin = req.user && req.user.role === 'admin';
  const subcategories = await categoryService.getSubcategories(req.params.id, {
    all: isAdmin,
  });
  return sendSuccess(res, 'Subcategories retrieved successfully', subcategories);
});

/**
 * 8. Public / App: Get Products Belonging to a Category
 * GET /api/v1/categories/:id/products
 */
const getCategoryProducts = asyncHandler(async (req, res) => {
  const queryParams = productListQuerySchema.parse(req.query);
  const result = await productService.getProductsByCategory(req.params.id, queryParams);
  return sendSuccess(
    res,
    `Products for category '${result.category.name}' retrieved successfully`,
    result
  );
});

module.exports = {
  createCategory,
  getCategories,
  adminGetCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  createSubcategory,
  getSubcategories,
  getCategoryProducts,
};
