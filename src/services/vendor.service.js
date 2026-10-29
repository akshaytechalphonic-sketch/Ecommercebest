const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const { User, Vendor, RefreshToken } = require('../models');
const { AppError } = require('../middleware/error.middleware');
const { hashPassword } = require('../utils/password.util');
const {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
} = require('../utils/token.util');

class VendorService {
  /**
   * Helper to ensure unique slug
   */
  async generateUniqueSlug(baseText, currentVendorId = null, transaction = null) {
    let slug = Vendor.slugify(baseText);
    if (!slug) {
      slug = 'store-' + Math.floor(1000 + Math.random() * 9000);
    }

    let candidate = slug;
    let count = 1;

    while (true) {
      const where = { store_slug: candidate };
      if (currentVendorId) {
        where.id = { [Op.ne]: currentVendorId };
      }

      const existing = await Vendor.findOne({
        where,
        transaction,
      });

      if (!existing) {
        return candidate;
      }

      count += 1;
      candidate = `${slug}-${count}`;
    }
  }

  /**
   * 1. Register a Vendor / Seller
   * Supports:
   *   a) Authenticated user upgrading to Seller
   *   b) Brand new user registering directly as Seller
   */
  async registerVendor(data, authenticatedUser = null) {
    const t = await sequelize.transaction();

    try {
      let user = authenticatedUser;
      let tokens = null;

      // Flow A: If user is not authenticated, create user account first
      if (!user) {
        const { name, email, password, phone } = data;

        if (!name || !email || !password) {
          throw new AppError(
            'Name, email, and password are required for seller registration',
            400,
            'MISSING_CREDENTIALS',
            [
              { field: 'name', message: 'Name is required' },
              { field: 'email', message: 'Email is required' },
              { field: 'password', message: 'Password is required' },
            ]
          );
        }

        const normalizedEmail = email.trim().toLowerCase();
        const normalizedPhone = phone ? phone.trim() : null;

        // Check duplicate email
        const existingEmail = await User.findOne({
          where: { email: normalizedEmail },
          transaction: t,
        });
        if (existingEmail) {
          throw new AppError(
            'Email address is already registered',
            409,
            'DUPLICATE_EMAIL',
            [{ field: 'email', message: 'Email address already in use' }]
          );
        }

        // Check duplicate phone if provided
        if (normalizedPhone) {
          const existingPhone = await User.findOne({
            where: { phone: normalizedPhone },
            transaction: t,
          });
          if (existingPhone) {
            throw new AppError(
              'Phone number is already registered',
              409,
              'DUPLICATE_PHONE',
              [{ field: 'phone', message: 'Phone number already in use' }]
            );
          }
        }

        const password_hash = await hashPassword(password);

        user = await User.create(
          {
            name: name.trim(),
            email: normalizedEmail,
            phone: normalizedPhone,
            password_hash,
            role: 'vendor',
            status: 'active',
            is_verified: false,
          },
          { transaction: t }
        );

        // Generate tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        const tokenHash = hashToken(refreshToken);

        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await RefreshToken.create(
          {
            user_id: user.id,
            token_hash: tokenHash,
            expires_at: expiresAt,
          },
          { transaction: t }
        );

        tokens = {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: 900,
          token_type: 'Bearer',
        };
      } else {
        // Flow B: User is already logged in
        // Check if user already has a vendor record
        const existingVendor = await Vendor.findOne({
          where: { user_id: user.id },
          transaction: t,
        });

        if (existingVendor) {
          if (existingVendor.status === 'pending') {
            throw new AppError(
              'Your seller application is currently pending admin approval',
              409,
              'VENDOR_APPLICATION_PENDING'
            );
          }
          if (existingVendor.status === 'approved') {
            throw new AppError(
              'You already have an approved active store profile',
              409,
              'ALREADY_REGISTERED'
            );
          }
          if (existingVendor.status === 'suspended') {
            throw new AppError(
              'Your vendor account has been suspended. Please contact support.',
              403,
              'VENDOR_SUSPENDED'
            );
          }
          // If rejected, allow re-application below by updating the existing record
        }
      }

      // Generate unique store slug
      const slugBase = data.store_slug || data.store_name;
      const store_slug = await this.generateUniqueSlug(slugBase, null, t);

      // Check if re-application for rejected user
      const existingVendor = await Vendor.findOne({
        where: { user_id: user.id },
        transaction: t,
      });

      let vendor;
      if (existingVendor && existingVendor.status === 'rejected') {
        // Re-apply: update existing vendor record
        await existingVendor.update(
          {
            store_name: data.store_name.trim(),
            store_slug,
            store_email: data.store_email || user.email,
            store_phone: data.store_phone || user.phone,
            description: data.description || null,
            address: data.address || null,
            city: data.city || null,
            state: data.state || null,
            postal_code: data.postal_code || null,
            country: data.country || 'India',
            logo_url: data.logo_url || null,
            banner_url: data.banner_url || null,
            tax_id: data.tax_id || null,
            bank_account_name: data.bank_account_name || null,
            bank_account_number: data.bank_account_number || null,
            bank_ifsc_code: data.bank_ifsc_code || null,
            bank_name: data.bank_name || null,
            status: 'pending',
            rejection_reason: null,
            approved_at: null,
          },
          { transaction: t }
        );
        vendor = existingVendor;
      } else {
        // Create new vendor profile
        vendor = await Vendor.create(
          {
            user_id: user.id,
            store_name: data.store_name.trim(),
            store_slug,
            store_email: data.store_email || user.email,
            store_phone: data.store_phone || user.phone,
            description: data.description || null,
            address: data.address || null,
            city: data.city || null,
            state: data.state || null,
            postal_code: data.postal_code || null,
            country: data.country || 'India',
            logo_url: data.logo_url || null,
            banner_url: data.banner_url || null,
            tax_id: data.tax_id || null,
            bank_account_name: data.bank_account_name || null,
            bank_account_number: data.bank_account_number || null,
            bank_ifsc_code: data.bank_ifsc_code || null,
            bank_name: data.bank_name || null,
            commission_rate: 10.00,
            status: 'pending',
          },
          { transaction: t }
        );
      }

      // Update user role to vendor
      if (user.role === 'customer') {
        await user.update({ role: 'vendor' }, { transaction: t });
      }

      await t.commit();

      const result = {
        vendor,
        user: user.toSafeObject ? user.toSafeObject() : user,
      };

      if (tokens) {
        result.tokens = tokens;
      }

      return result;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * 2. Get current vendor store profile
   */
  async getMyStore(userId) {
    const vendor = await Vendor.findOne({
      where: { user_id: userId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone', 'role', 'status'],
        },
      ],
    });

    if (!vendor) {
      throw new AppError(
        'No seller/vendor store profile found for this user account',
        404,
        'STORE_NOT_FOUND'
      );
    }

    return vendor;
  }

  /**
   * 3. Update current vendor store profile
   */
  async updateMyStore(userId, updateData) {
    const vendor = await Vendor.findOne({ where: { user_id: userId } });

    if (!vendor) {
      throw new AppError(
        'No seller/vendor store profile found for this user account',
        404,
        'STORE_NOT_FOUND'
      );
    }

    // Strip forbidden fields
    delete updateData.id;
    delete updateData.user_id;
    delete updateData.status;
    delete updateData.rejection_reason;
    delete updateData.approved_at;
    delete updateData.commission_rate;

    // Handle slug change
    if (updateData.store_slug) {
      const slugCandidate = Vendor.slugify(updateData.store_slug);
      const existingSlug = await Vendor.findOne({
        where: {
          store_slug: slugCandidate,
          id: { [Op.ne]: vendor.id },
        },
      });

      if (existingSlug) {
        throw new AppError(
          'Store slug is already in use by another store',
          409,
          'DUPLICATE_STORE_SLUG',
          [{ field: 'store_slug', message: 'Slug already taken' }]
        );
      }
      updateData.store_slug = slugCandidate;
    } else if (updateData.store_name && updateData.store_name !== vendor.store_name) {
      // Re-generate unique slug if store_name changes and store_slug is not manually specified
      updateData.store_slug = await this.generateUniqueSlug(
        updateData.store_name,
        vendor.id
      );
    }

    await vendor.update(updateData);

    return vendor;
  }

  /**
   * 4. Check approval status of current vendor store
   */
  async getMyStatus(userId) {
    const vendor = await Vendor.findOne({
      where: { user_id: userId },
      attributes: [
        'id',
        'store_name',
        'store_slug',
        'status',
        'rejection_reason',
        'approved_at',
        'commission_rate',
        'created_at',
        'updated_at',
      ],
    });

    if (!vendor) {
      throw new AppError(
        'No seller/vendor store profile found for this user account',
        404,
        'STORE_NOT_FOUND'
      );
    }

    return {
      vendor_id: vendor.id,
      store_name: vendor.store_name,
      store_slug: vendor.store_slug,
      status: vendor.status,
      is_approved: vendor.status === 'approved',
      rejection_reason: vendor.rejection_reason,
      approved_at: vendor.approved_at,
      commission_rate: vendor.commission_rate,
      created_at: vendor.created_at,
    };
  }

  /**
   * 5. Admin: List all vendors with pagination & search
   */
  async adminListVendors({ page = 1, limit = 10, status, search, sortBy = 'created_at', sortOrder = 'DESC' }) {
    const offset = (page - 1) * limit;
    const where = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where[Op.or] = [
        { store_name: { [Op.like]: `%${search}%` } },
        { store_slug: { [Op.like]: `%${search}%` } },
        { store_email: { [Op.like]: `%${search}%` } },
        { city: { [Op.like]: `%${search}%` } },
        { '$user.name$': { [Op.like]: `%${search}%` } },
        { '$user.email$': { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Vendor.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone', 'role', 'status'],
        },
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit,
      offset,
      distinct: true,
    });

    return {
      vendors: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * 6. Admin: Update vendor approval/rejection status
   */
  async adminUpdateVendorStatus(vendorId, { status, rejection_reason, commission_rate }) {
    const vendor = await Vendor.findByPk(vendorId, {
      include: [
        {
          model: User,
          as: 'user',
        },
      ],
    });

    if (!vendor) {
      throw new AppError('Vendor not found', 404, 'VENDOR_NOT_FOUND');
    }

    const updates = { status };

    if (status === 'approved') {
      updates.approved_at = new Date();
      updates.rejection_reason = null;

      // Ensure user role is updated to vendor
      if (vendor.user && vendor.user.role !== 'vendor') {
        await vendor.user.update({ role: 'vendor' });
      }
    } else if (status === 'rejected') {
      updates.rejection_reason = rejection_reason ? rejection_reason.trim() : null;
    } else if (status === 'suspended') {
      // Vendor suspended by admin
    }

    if (commission_rate !== undefined && commission_rate !== null) {
      updates.commission_rate = commission_rate;
    }

    await vendor.update(updates);

    return vendor;
  }
}

module.exports = new VendorService();
