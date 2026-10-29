const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const { User, RefreshToken, PasswordResetToken, Vendor } = require('../models');
const { AppError } = require('../middleware/error.middleware');
const { hashPassword, comparePassword } = require('../utils/password.util');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
  generateRandomToken,
} = require('../utils/token.util');

class AuthService {
  /**
   * Unified Registration for Customers and Vendors/Sellers
   * Single entry point for all marketplace users
   */
  async register({
    name,
    email,
    password,
    phone,
    role = 'customer',
    store_name,
    store_email,
    store_phone,
    description,
    address,
    city,
    state,
    postal_code,
    country = 'India',
    tax_id,
  }) {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone ? phone.trim() : null;

    // Check duplicate email
    const existingEmail = await User.findOne({ where: { email: normalizedEmail } });
    if (existingEmail) {
      throw new AppError(
        'An account with this email address already exists',
        409,
        'DUPLICATE_EMAIL',
        [{ field: 'email', message: 'Email address already in use' }]
      );
    }

    // Check duplicate phone if provided
    if (normalizedPhone) {
      const existingPhone = await User.findOne({ where: { phone: normalizedPhone } });
      if (existingPhone) {
        throw new AppError(
          'An account with this phone number already exists',
          409,
          'DUPLICATE_PHONE',
          [{ field: 'phone', message: 'Phone number already in use' }]
        );
      }
    }

    // Hash password
    const password_hash = await hashPassword(password);

    // Only allow customer or vendor self-registration.
    // Admin registration is strictly protected and forced to customer to prevent privilege escalation.
    const targetRole = role === 'vendor' ? 'vendor' : 'customer';

    const t = await sequelize.transaction();

    try {
      // 1. Create User
      const user = await User.create(
        {
          name: name.trim(),
          email: normalizedEmail,
          phone: normalizedPhone,
          password_hash,
          role: targetRole,
          status: 'active',
          is_verified: false,
        },
        { transaction: t }
      );

      // 2. If registering as vendor, create store profile in same transaction
      let vendorRecord = null;
      if (targetRole === 'vendor') {
        const finalStoreName = store_name ? store_name.trim() : `${name.trim()}'s Store`;
        let baseSlug = Vendor.slugify(finalStoreName);
        if (!baseSlug) baseSlug = 'store-' + Math.floor(1000 + Math.random() * 9000);

        let candidateSlug = baseSlug;
        let count = 1;
        while (true) {
          const existing = await Vendor.findOne({
            where: { store_slug: candidateSlug },
            transaction: t,
          });
          if (!existing) break;
          count += 1;
          candidateSlug = `${baseSlug}-${count}`;
        }

        vendorRecord = await Vendor.create(
          {
            user_id: user.id,
            store_name: finalStoreName,
            store_slug: candidateSlug,
            store_email: store_email ? store_email.trim().toLowerCase() : normalizedEmail,
            store_phone: store_phone ? store_phone.trim() : normalizedPhone,
            description: description || null,
            address: address || null,
            city: city || null,
            state: state || null,
            postal_code: postal_code || null,
            country: country || 'India',
            tax_id: tax_id || null,
            commission_rate: 10.00,
            status: 'pending',
          },
          { transaction: t }
        );
      }

      // 3. Generate tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);
      const tokenHash = hashToken(refreshToken);

      // Store refresh token (7 days expiry)
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await RefreshToken.create(
        {
          user_id: user.id,
          token_hash: tokenHash,
          expires_at: expiresAt,
        },
        { transaction: t }
      );

      await t.commit();

      const responsePayload = {
        user: user.toSafeObject(),
        tokens: {
          access_token: accessToken,
          refresh_token: refreshToken,
        },
      };

      if (vendorRecord) {
        responsePayload.vendor = vendorRecord;
      }

      return responsePayload;
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  /**
   * Unified Login for Customers, Vendors, and Admins
   */
  async login({ identifier, email, phone, password }, { userAgent, ipAddress } = {}) {
    const lookupKey = (identifier || email || phone || '').trim();

    // Find user by email or phone, including their vendor store profile if exists
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: lookupKey.toLowerCase() },
          { phone: lookupKey },
        ],
      },
      include: [
        {
          model: Vendor,
          as: 'vendor',
          required: false,
        },
      ],
    });

    // Generic error to prevent account enumeration
    if (!user) {
      throw new AppError('Invalid email/phone or password', 401, 'INVALID_CREDENTIALS');
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      throw new AppError('Invalid email/phone or password', 401, 'INVALID_CREDENTIALS');
    }

    // Reject blocked or inactive users
    if (user.status !== 'active') {
      throw new AppError(
        'Your account has been deactivated or blocked. Please contact customer support.',
        403,
        'ACCOUNT_INACTIVE'
      );
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    const tokenHash = hashToken(refreshToken);

    // Store refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await RefreshToken.create({
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
      user_agent: userAgent || null,
      ip_address: ipAddress || null,
    });

    const response = {
      user: user.toSafeObject(),
      tokens: {
        access_token: accessToken,
        refresh_token: refreshToken,
      },
    };

    if (user.vendor) {
      response.vendor = user.vendor;
    }

    return response;
  }

  /**
   * Get authenticated user profile (with vendor details if applicable)
   */
  async getProfile(userId) {
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Vendor,
          as: 'vendor',
          required: false,
        },
      ],
    });
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    if (user.status !== 'active') {
      throw new AppError(
        'Your account has been deactivated or blocked',
        403,
        'ACCOUNT_INACTIVE'
      );
    }

    const safeUser = user.toSafeObject();
    if (user.vendor) {
      safeUser.vendor = user.vendor;
    }

    return safeUser;
  }

  /**
   * Refresh access token with refresh token rotation and reuse detection
   */
  async rotateRefreshToken(rawRefreshToken, { userAgent, ipAddress } = {}) {
    let decoded;
    try {
      decoded = verifyRefreshToken(rawRefreshToken);
    } catch (err) {
      throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }

    const tokenHash = hashToken(rawRefreshToken);
    const session = await RefreshToken.findOne({ where: { token_hash: tokenHash } });

    if (!session) {
      throw new AppError('Invalid refresh token session', 401, 'INVALID_REFRESH_TOKEN');
    }

    // Reuse detection: If token was already revoked, revoke all tokens for this user!
    if (session.revoked_at !== null) {
      await RefreshToken.update(
        { revoked_at: new Date() },
        { where: { user_id: session.user_id, revoked_at: null } }
      );
      throw new AppError(
        'Refresh token has already been revoked. All active sessions have been invalidated for security.',
        401,
        'TOKEN_REUSE_DETECTED'
      );
    }

    // Check expiration
    if (new Date() >= session.expires_at) {
      throw new AppError('Refresh token has expired. Please login again.', 401, 'TOKEN_EXPIRED');
    }

    // Check user status
    const user = await User.findByPk(session.user_id);
    if (!user || user.status !== 'active') {
      throw new AppError('Account is inactive or blocked', 403, 'ACCOUNT_INACTIVE');
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    const newTokenHash = hashToken(newRefreshToken);

    // Rotate: Revoke current session & create new session
    await session.update({
      revoked_at: new Date(),
      replaced_by_token_hash: newTokenHash,
    });

    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await RefreshToken.create({
      user_id: user.id,
      token_hash: newTokenHash,
      expires_at: newExpiresAt,
      user_agent: userAgent || null,
      ip_address: ipAddress || null,
    });

    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    };
  }

  /**
   * Logout and revoke refresh token session
   */
  async logout(rawRefreshToken, authenticatedUserId) {
    if (rawRefreshToken) {
      const tokenHash = hashToken(rawRefreshToken);
      await RefreshToken.update(
        { revoked_at: new Date() },
        { where: { token_hash: tokenHash, revoked_at: null } }
      );
    } else if (authenticatedUserId) {
      await RefreshToken.update(
        { revoked_at: new Date() },
        { where: { user_id: authenticatedUserId, revoked_at: null } }
      );
    }

    return true;
  }

  /**
   * Request password reset token
   * Generic response to prevent email enumeration
   */
  async forgotPassword(email) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ where: { email: normalizedEmail } });

    let resetToken = null;

    if (user && user.status === 'active') {
      // Invalidate existing unused tokens for this user
      await PasswordResetToken.update(
        { is_used: true },
        { where: { user_id: user.id, is_used: false } }
      );

      // Generate random single-use token (expires in 15 minutes)
      const rawToken = generateRandomToken(32);
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await PasswordResetToken.create({
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
        is_used: false,
      });

      resetToken = rawToken;

      console.log(`[PASSWORD_RESET] Token generated for ${normalizedEmail}: ${rawToken}`);
    }

    // Generic response returned for both existing and non-existing accounts
    const result = {
      message: 'If an account with that email exists, password reset instructions have been generated.',
    };

    // In non-production environments when SMTP is not configured, include token for testing
    if (process.env.NODE_ENV !== 'production' && resetToken) {
      result.debug_reset_token = resetToken;
    }

    return result;
  }

  /**
   * Reset password using single-use token
   */
  async resetPassword({ token, new_password }) {
    const tokenHash = hashToken(token);
    const resetRecord = await PasswordResetToken.findOne({
      where: { token_hash: tokenHash },
    });

    if (!resetRecord || resetRecord.is_used) {
      throw new AppError(
        'Invalid or already used password reset token',
        400,
        'INVALID_RESET_TOKEN'
      );
    }

    if (new Date() >= resetRecord.expires_at) {
      throw new AppError(
        'Password reset token has expired',
        400,
        'EXPIRED_RESET_TOKEN'
      );
    }

    const user = await User.findByPk(resetRecord.user_id);
    if (!user || user.status !== 'active') {
      throw new AppError('User account is inactive or blocked', 403, 'ACCOUNT_INACTIVE');
    }

    // Hash new password
    const password_hash = await hashPassword(new_password);
    await user.update({ password_hash });

    // Mark token as used
    await resetRecord.update({
      is_used: true,
      used_at: new Date(),
    });

    // Revoke all refresh tokens for security
    await RefreshToken.update(
      { revoked_at: new Date() },
      { where: { user_id: user.id, revoked_at: null } }
    );

    return true;
  }
}

module.exports = new AuthService();
