const settingService = require('../services/setting.service');
const { sendSuccess } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

/**
 * 1. Public: Get Dynamic Branding & Site Identity (Logo, Name, Tagline, Favicon)
 * GET /api/v1/settings/branding
 */
const getBranding = asyncHandler(async (req, res) => {
  const branding = await settingService.getBranding();
  return sendSuccess(res, 'Store branding retrieved successfully', branding);
});

/**
 * 2. Public: Get All Public Settings
 * GET /api/v1/settings/public
 */
const getPublicSettings = asyncHandler(async (req, res) => {
  const settings = await settingService.getPublicSettings();
  return sendSuccess(res, 'Public settings retrieved successfully', settings);
});

/**
 * 3. Admin: Get All Platform Settings
 * GET /api/v1/admin/settings
 */
const getAllSettings = asyncHandler(async (req, res) => {
  const settings = await settingService.getAllSettings();
  return sendSuccess(res, 'Platform settings retrieved successfully', settings);
});

/**
 * 4. Admin: Update Store Dynamic Branding (Logo, Name, Tagline, Favicon)
 * PUT /api/v1/admin/settings/branding
 */
const updateBranding = asyncHandler(async (req, res) => {
  const updated = await settingService.updateBranding(req.body);
  return sendSuccess(res, 'Dynamic store branding updated successfully', updated);
});

/**
 * 5. Admin: Bulk Update Platform Settings
 * PUT /api/v1/admin/settings
 */
const bulkUpdateSettings = asyncHandler(async (req, res) => {
  const updated = await settingService.bulkUpdateSettings(req.body.settings);
  return sendSuccess(res, 'Platform settings saved successfully', updated);
});

module.exports = {
  getBranding,
  getPublicSettings,
  getAllSettings,
  updateBranding,
  bulkUpdateSettings,
};
