const authService = require('../services/auth.service');
const { sendSuccess } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Register a new customer
 * POST /api/v1/auth/register
 */
const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  return sendSuccess(res, 'User registered successfully', result, 201);
});

/**
 * Login user
 * POST /api/v1/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const userAgent = req.headers['user-agent'];
  const ipAddress = req.ip || req.socket.remoteAddress;

  const result = await authService.login(req.body, { userAgent, ipAddress });
  return sendSuccess(res, 'Login successful', result, 200);
});

/**
 * Get authenticated user profile
 * GET /api/v1/auth/me
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user.id);
  return sendSuccess(res, 'Profile retrieved successfully', user, 200);
});

/**
 * Refresh access token
 * POST /api/v1/auth/refresh
 */
const refresh = asyncHandler(async (req, res) => {
  const userAgent = req.headers['user-agent'];
  const ipAddress = req.ip || req.socket.remoteAddress;

  const result = await authService.rotateRefreshToken(req.body.refresh_token, {
    userAgent,
    ipAddress,
  });
  return sendSuccess(res, 'Token refreshed successfully', result, 200);
});

/**
 * Logout user / revoke session
 * POST /api/v1/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.body?.refresh_token;
  const userId = req.user?.id;

  await authService.logout(refreshToken, userId);
  return sendSuccess(res, 'Logged out successfully', null, 200);
});

/**
 * Request password reset
 * POST /api/v1/auth/forgot-password
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body.email);
  return sendSuccess(res, result.message, result.debug_reset_token ? { reset_token: result.debug_reset_token } : {}, 200);
});

/**
 * Reset password using token
 * POST /api/v1/auth/reset-password
 */
const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body);
  return sendSuccess(
    res,
    'Password has been reset successfully. Please log in with your new password.',
    null,
    200
  );
});

module.exports = {
  register,
  login,
  getMe,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
};
