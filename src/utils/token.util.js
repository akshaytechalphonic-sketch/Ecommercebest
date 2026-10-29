const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const env = require('../config/env');

/**
 * Generate JWT Access Token
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    env.JWT.ACCESS_SECRET,
    {
      expiresIn: env.JWT.ACCESS_EXPIRES,
    }
  );
};

/**
 * Generate JWT Refresh Token
 */
const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      sub: user.id,
      jti: crypto.randomBytes(16).toString('hex'),
    },
    env.JWT.REFRESH_SECRET,
    {
      expiresIn: env.JWT.REFRESH_EXPIRES,
    }
  );
};

/**
 * Verify JWT Access Token
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, env.JWT.ACCESS_SECRET);
};

/**
 * Verify JWT Refresh Token
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.JWT.REFRESH_SECRET);
};

/**
 * Hash raw token using SHA-256 for secure DB storage
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Generate random hex token (e.g. for password reset)
 */
const generateRandomToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
  generateRandomToken,
};
