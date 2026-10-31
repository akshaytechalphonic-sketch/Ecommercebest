const headerMenuService = require('../services/headerMenu.service');
const { sendSuccess } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

/**
 * 1. Admin: Create Header Menu
 * POST /api/v1/admin/header-menus
 */
const createHeaderMenu = asyncHandler(async (req, res) => {
  const menu = await headerMenuService.createHeaderMenu(req.body);
  return sendSuccess(res, 'Header menu created successfully', menu, 201);
});

/**
 * 2. Admin: Get all Header Menus with submenus and child items
 * GET /api/v1/admin/header-menus
 */
const getAdminHeaderMenus = asyncHandler(async (req, res) => {
  const menus = await headerMenuService.getAllAdminHeaderMenus();
  return sendSuccess(res, 'All header menus retrieved successfully', menus);
});

/**
 * 3. Admin: Get Header Menu details by ID
 * GET /api/v1/admin/header-menus/:id
 */
const getHeaderMenuById = asyncHandler(async (req, res) => {
  const menu = await headerMenuService.getHeaderMenuById(req.params.id);
  return sendSuccess(res, 'Header menu details retrieved successfully', menu);
});

/**
 * 4. Admin: Update Header Menu
 * PUT /api/v1/admin/header-menus/:id
 */
const updateHeaderMenu = asyncHandler(async (req, res) => {
  const updatedMenu = await headerMenuService.updateHeaderMenu(req.params.id, req.body);
  return sendSuccess(res, 'Header menu updated successfully', updatedMenu);
});

/**
 * 5. Admin: Delete Header Menu
 * DELETE /api/v1/admin/header-menus/:id
 */
const deleteHeaderMenu = asyncHandler(async (req, res) => {
  const result = await headerMenuService.deleteHeaderMenu(req.params.id);
  return sendSuccess(res, result.message, null);
});

/**
 * 6. Admin: Activate or Deactivate Header Menu
 * PATCH /api/v1/admin/header-menus/:id/status
 */
const updateHeaderMenuStatus = asyncHandler(async (req, res) => {
  const updatedMenu = await headerMenuService.updateHeaderMenuStatus(req.params.id, req.body);
  return sendSuccess(res, 'Header menu status updated successfully', updatedMenu);
});

/**
 * 7. Admin: Reorder multiple Header Menus
 * PATCH /api/v1/admin/header-menus/reorder
 */
const reorderHeaderMenus = asyncHandler(async (req, res) => {
  const menus = await headerMenuService.reorderHeaderMenus(req.body);
  return sendSuccess(res, 'Header menus reordered successfully', menus);
});

/**
 * 8. Admin: Add Submenu / Child Menu item to Header Menu :id
 * POST /api/v1/admin/header-menus/:id/items
 */
const createHeaderMenuItem = asyncHandler(async (req, res) => {
  const item = await headerMenuService.createHeaderMenuItem(req.params.id, req.body);
  return sendSuccess(res, 'Header menu item created successfully', item, 201);
});

/**
 * 9. Admin: Get all items of Header Menu :id
 * GET /api/v1/admin/header-menus/:id/items
 */
const getHeaderMenuItems = asyncHandler(async (req, res) => {
  const items = await headerMenuService.getHeaderMenuItems(req.params.id);
  return sendSuccess(res, 'Header menu items retrieved successfully', items);
});

/**
 * 10. Admin: Update Submenu Item
 * PUT /api/v1/admin/header-menu-items/:itemId
 */
const updateHeaderMenuItem = asyncHandler(async (req, res) => {
  const updatedItem = await headerMenuService.updateHeaderMenuItem(req.params.itemId, req.body);
  return sendSuccess(res, 'Header menu item updated successfully', updatedItem);
});

/**
 * 11. Admin: Delete Submenu Item
 * DELETE /api/v1/admin/header-menu-items/:itemId
 */
const deleteHeaderMenuItem = asyncHandler(async (req, res) => {
  const result = await headerMenuService.deleteHeaderMenuItem(req.params.itemId);
  return sendSuccess(res, result.message, null);
});

/**
 * 12. Public Storefront: Get All Active Menus, Submenus, & Associated Banners
 * GET /api/v1/storefront/header-menu
 */
const getStorefrontHeaderMenu = asyncHandler(async (req, res) => {
  const menus = await headerMenuService.getStorefrontHeaderMenu();
  return sendSuccess(res, 'Storefront header menu retrieved successfully', menus);
});

module.exports = {
  createHeaderMenu,
  getAdminHeaderMenus,
  getHeaderMenuById,
  updateHeaderMenu,
  deleteHeaderMenu,
  updateHeaderMenuStatus,
  reorderHeaderMenus,
  createHeaderMenuItem,
  getHeaderMenuItems,
  updateHeaderMenuItem,
  deleteHeaderMenuItem,
  getStorefrontHeaderMenu,
};
