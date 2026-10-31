const { sendError } = require('../utils/response');

class AppError extends Error {
  constructor(message, statusCode = 400, code = 'ERROR', errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 404 Not Found Middleware
 */
const notFoundHandler = (req, res) => {
  return sendError(
    res,
    `Route ${req.method} ${req.originalUrl} not found`,
    'NOT_FOUND',
    [],
    404
  );
};

/**
 * Centralized Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  // If response headers already sent, delegate to Express default handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle known AppError or errors with explicit statusCode
  if (err instanceof AppError || err.statusCode) {
    return sendError(
      res,
      err.message,
      err.code || (err.statusCode === 404 ? 'NOT_FOUND' : err.statusCode === 409 ? 'CONFLICT' : 'ERROR'),
      err.errors || [],
      err.statusCode || 400
    );
  }

  // Handle Zod Validation Errors
  if (err.name === 'ZodError' || (err.issues && Array.isArray(err.issues))) {
    const errors = err.issues ? err.issues.map((e) => ({
      field: Array.isArray(e.path) ? e.path.join('.') || 'field' : String(e.path || 'field'),
      message: e.message,
    })) : [];
    return sendError(res, 'Validation error', 'VALIDATION_ERROR', errors, 400);
  }

  // Handle Sequelize Unique Constraint Error
  if (err.name === 'SequelizeUniqueConstraintError') {
    const errors = err.errors ? err.errors.map((e) => ({
      field: e.path,
      message: `${e.path} must be unique`,
    })) : [];
    return sendError(res, 'Duplicate record detected', 'DUPLICATE_ENTRY', errors, 409);
  }

  // Handle Sequelize Database Error
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors ? err.errors.map((e) => ({
      field: e.path,
      message: e.message,
    })) : [];
    return sendError(res, 'Validation error', 'VALIDATION_ERROR', errors, 400);
  }

  // Handle JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid token provided', 'INVALID_TOKEN', [], 401);
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Token has expired', 'TOKEN_EXPIRED', [], 401);
  }

  // Handle CORS Policy Errors
  if (err.message && err.message.startsWith('CORS policy blocked')) {
    console.warn(`[CORS Blocked] ${req.method} ${req.originalUrl} from origin: ${req.headers.origin || 'unknown'}`);
    return sendError(res, err.message, 'CORS_ERROR', [], 403);
  }

  // Handle Sequelize Database Connection Errors
  if (
    err.name === 'SequelizeConnectionError' ||
    err.name === 'SequelizeConnectionRefusedError' ||
    err.name === 'SequelizeHostNotFoundError' ||
    err.name === 'SequelizeAccessDeniedError'
  ) {
    console.error(`[Database Error] ${req.method} ${req.originalUrl} - ${err.message}`);
    return sendError(
      res,
      'Database connection failed. Verify MySQL connection parameters on Render.',
      'DATABASE_UNAVAILABLE',
      [],
      503
    );
  }

  // Default to 500 Internal Server Error
  console.error(`[Unhandled Error] ${req.method} ${req.originalUrl} - ${err.name}: ${err.message}`);
  return sendError(
    res,
    'Internal server error',
    'INTERNAL_SERVER_ERROR',
    process.env.NODE_ENV === 'development' ? [{ message: err.message }] : [],
    500
  );
};

module.exports = {
  AppError,
  notFoundHandler,
  errorHandler,
};
