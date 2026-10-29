const vendorService = require('../services/vendor.service');
const { sendSuccess } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');
const { adminVendorListQuerySchema } = require('../validators/vendor.validator');

/**
 * 1. Register a Vendor / Seller
 * POST /api/v1/vendors/register
 */
const register = asyncHandler(async (req, res) => {
  const result = await vendorService.registerVendor(req.body, req.user);
  return sendSuccess(
    res,
    'Seller registered successfully. Store profile created and submitted for approval.',
    result,
    201
  );
});

/**
 * 2. Get current vendor store profile
 * GET /api/v1/vendors/me
 */
const getMyStore = asyncHandler(async (req, res) => {
  const store = await vendorService.getMyStore(req.user.id);
  return sendSuccess(res, 'Store details retrieved successfully', store);
});

/**
 * 3. Update current vendor store profile
 * PUT /api/v1/vendors/me
 */
const updateMyStore = asyncHandler(async (req, res) => {
  const updatedStore = await vendorService.updateMyStore(req.user.id, req.body);
  return sendSuccess(res, 'Store details updated successfully', updatedStore);
});

/**
 * 4. Check approval status of current vendor store
 * GET /api/v1/vendors/me/status
 */
const getMyStatus = asyncHandler(async (req, res) => {
  const statusInfo = await vendorService.getMyStatus(req.user.id);
  return sendSuccess(res, 'Store approval status retrieved successfully', statusInfo);
});

/**
 * 5. Admin: List all vendors with pagination & filters
 * GET /api/v1/admin/vendors
 */
const adminListVendors = asyncHandler(async (req, res) => {
  const queryParams = adminVendorListQuerySchema.parse(req.query);
  const data = await vendorService.adminListVendors(queryParams);
  return sendSuccess(res, 'Vendors retrieved successfully', data);
});

/**
 * 6. Admin: Update vendor approval or rejection status
 * PATCH /api/v1/admin/vendors/:id/status
 */
const adminUpdateVendorStatus = asyncHandler(async (req, res) => {
  const updatedVendor = await vendorService.adminUpdateVendorStatus(
    req.params.id,
    req.body
  );
  return sendSuccess(
    res,
    `Vendor status updated to '${req.body.status}' successfully`,
    updatedVendor
  );
});

module.exports = {
  register,
  getMyStore,
  updateMyStore,
  getMyStatus,
  adminListVendors,
  adminUpdateVendorStatus,
};
