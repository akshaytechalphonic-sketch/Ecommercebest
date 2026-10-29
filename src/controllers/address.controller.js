const addressService = require('../services/address.service');
const { sendSuccess } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Get all delivery addresses of authenticated user
 * GET /api/v1/users/addresses or GET /api/v1/addresses
 */
const getAddresses = asyncHandler(async (req, res) => {
  const addresses = await addressService.getUserAddresses(req.user.id);
  return sendSuccess(res, 'Addresses retrieved successfully', addresses);
});

/**
 * Get single address by ID
 * GET /api/v1/users/addresses/:id or GET /api/v1/addresses/:id
 */
const getAddressById = asyncHandler(async (req, res) => {
  const address = await addressService.getAddressById(req.user.id, req.params.id);
  return sendSuccess(res, 'Address retrieved successfully', address);
});

/**
 * Create a new delivery address
 * POST /api/v1/users/addresses or POST /api/v1/addresses
 */
const createAddress = asyncHandler(async (req, res) => {
  const address = await addressService.createAddress(req.user.id, req.body);
  return sendSuccess(res, 'Delivery address added successfully', address, 201);
});

/**
 * Update an existing delivery address
 * PUT /api/v1/users/addresses/:id or PUT /api/v1/addresses/:id
 */
const updateAddress = asyncHandler(async (req, res) => {
  const address = await addressService.updateAddress(req.user.id, req.params.id, req.body);
  return sendSuccess(res, 'Delivery address updated successfully', address);
});

/**
 * Set address as default
 * PATCH /api/v1/users/addresses/:id/default or PATCH /api/v1/addresses/:id/default
 */
const setDefaultAddress = asyncHandler(async (req, res) => {
  const address = await addressService.setDefaultAddress(req.user.id, req.params.id);
  return sendSuccess(res, 'Default delivery address set successfully', address);
});

/**
 * Delete a delivery address
 * DELETE /api/v1/users/addresses/:id or DELETE /api/v1/addresses/:id
 */
const deleteAddress = asyncHandler(async (req, res) => {
  await addressService.deleteAddress(req.user.id, req.params.id);
  return sendSuccess(res, 'Delivery address deleted successfully', null);
});

module.exports = {
  getAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  setDefaultAddress,
  deleteAddress,
};
