const userService = require('../services/user.service');
const { sendSuccess } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Get authenticated user profile
 * GET /api/v1/users/profile
 */
const getProfile = asyncHandler(async (req, res) => {
  const profile = await userService.getProfile(req.user.id);
  return sendSuccess(res, 'User profile retrieved successfully', profile);
});

/**
 * Update authenticated user profile
 * PUT /api/v1/users/profile
 */
const updateProfile = asyncHandler(async (req, res) => {
  const updatedUser = await userService.updateProfile(req.user.id, req.body);
  return sendSuccess(res, 'Profile updated successfully', updatedUser);
});

/**
 * Change authenticated user password
 * PUT /api/v1/users/change-password
 */
const changePassword = asyncHandler(async (req, res) => {
  await userService.changePassword(req.user.id, req.body);
  return sendSuccess(res, 'Password changed successfully. Please use your new password next time.', null);
});

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
};
