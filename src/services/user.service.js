const { Op } = require('sequelize');
const { User, RefreshToken, Address } = require('../models');
const { AppError } = require('../middleware/error.middleware');
const { comparePassword, hashPassword } = require('../utils/password.util');

class UserService {
  /**
   * Get user profile details
   */
  async getProfile(userId) {
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Address,
          as: 'addresses',
          attributes: { exclude: ['user_id'] },
        },
      ],
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    if (user.status !== 'active') {
      throw new AppError('Account is inactive or blocked', 403, 'ACCOUNT_INACTIVE');
    }

    return user.toSafeObject();
  }

  /**
   * Update profile details (name, phone, avatar_url)
   */
  async updateProfile(userId, { name, phone, avatar_url }) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    if (user.status !== 'active') {
      throw new AppError('Account is inactive or blocked', 403, 'ACCOUNT_INACTIVE');
    }

    const updates = {};

    if (name !== undefined) {
      updates.name = name.trim();
    }

    if (phone !== undefined) {
      const normalizedPhone = phone ? phone.trim() : null;
      if (normalizedPhone && normalizedPhone !== user.phone) {
        // Check uniqueness across other users
        const existingPhone = await User.findOne({
          where: {
            phone: normalizedPhone,
            id: { [Op.ne]: userId },
          },
        });
        if (existingPhone) {
          throw new AppError(
            'This phone number is already registered to another account',
            409,
            'DUPLICATE_PHONE',
            [{ field: 'phone', message: 'Phone number already in use' }]
          );
        }
      }
      updates.phone = normalizedPhone;
    }

    if (avatar_url !== undefined) {
      updates.avatar_url = avatar_url ? avatar_url.trim() : null;
    }

    await user.update(updates);
    return user.toSafeObject();
  }

  /**
   * Change user password securely
   */
  async changePassword(userId, { current_password, new_password }) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    if (user.status !== 'active') {
      throw new AppError('Account is inactive or blocked', 403, 'ACCOUNT_INACTIVE');
    }

    const isMatch = await comparePassword(current_password, user.password_hash);
    if (!isMatch) {
      throw new AppError('Current password does not match', 400, 'INVALID_CURRENT_PASSWORD');
    }

    if (current_password === new_password) {
      throw new AppError('New password cannot be identical to current password', 400, 'SAME_PASSWORD');
    }

    const password_hash = await hashPassword(new_password);
    await user.update({ password_hash });

    // Revoke all refresh tokens for this user upon password change (security standard)
    await RefreshToken.update(
      { revoked_at: new Date() },
      { where: { user_id: userId, revoked_at: null } }
    );

    return true;
  }
}

module.exports = new UserService();
