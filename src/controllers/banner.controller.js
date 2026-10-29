const bannerService = require('../services/banner.service');
const { sendSuccess } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

/**
 * 1. Public: Get Active Banners List
 * GET /api/v1/banners
 */
const getPublicBanners = asyncHandler(async (req, res) => {
  const banners = await bannerService.getPublicBanners(req.query);
  return sendSuccess(res, 'Active banners retrieved successfully', banners);
});

/**
 * 2. Public / App: Get Banner by ID
 * GET /api/v1/banners/:id
 */
const getBannerById = asyncHandler(async (req, res) => {
  const banner = await bannerService.getBannerById(req.params.id);
  return sendSuccess(res, 'Banner retrieved successfully', banner);
});

/**
 * 3. Public: Track Banner Click
 * POST /api/v1/banners/:id/click
 */
const recordClick = asyncHandler(async (req, res) => {
  const result = await bannerService.recordClick(req.params.id);
  return sendSuccess(res, 'Banner click recorded successfully', result);
});

/**
 * 4. Admin: Get All Banners with Pagination and Stats
 * GET /api/v1/admin/banners
 */
const getAdminBanners = asyncHandler(async (req, res) => {
  const data = await bannerService.getAdminBanners(req.query);
  return sendSuccess(res, 'All banners retrieved successfully for admin', data);
});

/**
 * 5. Admin: Create Banner
 * POST /api/v1/admin/banners
 */
const createBanner = asyncHandler(async (req, res) => {
  const banner = await bannerService.createBanner(req.body);
  return sendSuccess(res, 'Banner created successfully', banner, 201);
});

/**
 * 6. Admin: Update Banner
 * PUT /api/v1/admin/banners/:id
 */
const updateBanner = asyncHandler(async (req, res) => {
  const banner = await bannerService.updateBanner(req.params.id, req.body);
  return sendSuccess(res, 'Banner updated successfully', banner);
});

/**
 * 7. Admin: Toggle Banner Status
 * PATCH /api/v1/admin/banners/:id/status
 */
const updateBannerStatus = asyncHandler(async (req, res) => {
  const banner = await bannerService.updateBannerStatus(req.params.id, req.body.is_active);
  return sendSuccess(res, 'Banner status updated successfully', banner);
});

/**
 * 8. Admin: Delete Banner
 * DELETE /api/v1/admin/banners/:id
 */
const deleteBanner = asyncHandler(async (req, res) => {
  const result = await bannerService.deleteBanner(req.params.id);
  return sendSuccess(res, result.message, null);
});

module.exports = {
  getPublicBanners,
  getBannerById,
  recordClick,
  getAdminBanners,
  createBanner,
  updateBanner,
  updateBannerStatus,
  deleteBanner,
};
