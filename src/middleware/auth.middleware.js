const { verifyAccessToken } = require('../utils/token.util');
const { sendError } = require('../utils/response');
const { User } = require('../models');

/**
 * JWT Authentication Middleware
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(
        res,
        'Authorization header with Bearer token is required',
        'UNAUTHORIZED',
        [],
        401
      );
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return sendError(res, 'Access token is missing', 'UNAUTHORIZED', [], 401);
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return sendError(res, 'Access token has expired', 'TOKEN_EXPIRED', [], 401);
      }
      return sendError(res, 'Invalid access token', 'INVALID_TOKEN', [], 401);
    }

    const userId = decoded.sub || decoded.id;
    if (!userId) {
      return sendError(res, 'Invalid token payload', 'INVALID_TOKEN', [], 401);
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return sendError(res, 'User no longer exists', 'USER_NOT_FOUND', [], 401);
    }

    if (user.status !== 'active') {
      return sendError(
        res,
        'Your account has been deactivated or blocked. Please contact support.',
        'ACCOUNT_INACTIVE',
        [],
        403
      );
    }

    // Attach sanitized user to request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Role-based Authorization Middleware
 * @param  {...string} allowedRoles
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required', 'UNAUTHORIZED', [], 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        `Access denied. Requires one of the following roles: ${allowedRoles.join(', ')}`,
        'FORBIDDEN',
        [],
        403
      );
    }

    next();
  };
};

/**
 * Optional Authentication Middleware
 * Populates req.user if valid token present, otherwise continues without error
 */
const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      req.user = null;
      return next();
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      req.user = null;
      return next();
    }

    const userId = decoded.sub || decoded.id;
    if (!userId) {
      req.user = null;
      return next();
    }

    const user = await User.findByPk(userId);
    if (user && user.status === 'active') {
      req.user = user;
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

module.exports = {
  authenticate,
  authorizeRoles,
  authorize: authorizeRoles,
  optionalAuthenticate,
};
