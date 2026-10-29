const rateLimit = require('express-rate-limit');
const { sendError } = require('../utils/response');

/**
 * Rate limiter for sensitive authentication endpoints
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 sensitive auth requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(
      res,
      'Too many attempts from this IP, please try again after 15 minutes',
      'RATE_LIMIT_EXCEEDED',
      [],
      429
    );
  },
});

module.exports = {
  authRateLimiter,
};
