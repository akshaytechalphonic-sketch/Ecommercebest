const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Vendor extends Model {
    /**
     * Generate URL-friendly slug from store name
     */
    static slugify(text) {
      return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(/[^\w-]+/g, '') // Remove all non-word chars
        .replace(/--+/g, '-') // Replace multiple - with single -
        .replace(/^-+/, '') // Trim - from start of text
        .replace(/-+$/, ''); // Trim - from end of text
    }
  }

  Vendor.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        unique: {
          name: 'vendors_user_id_unique',
          msg: 'User is already registered as a vendor',
        },
      },
      store_name: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [2, 150],
        },
      },
      store_slug: {
        type: DataTypes.STRING(191),
        allowNull: false,
        unique: {
          name: 'vendors_store_slug_unique',
          msg: 'Store slug is already in use',
        },
        set(value) {
          if (value) {
            this.setDataValue('store_slug', Vendor.slugify(value));
          }
        },
      },
      store_email: {
        type: DataTypes.STRING(191),
        allowNull: true,
        validate: {
          isEmail: {
            msg: 'Invalid store email address',
          },
        },
        set(value) {
          if (value) {
            this.setDataValue('store_email', value.trim().toLowerCase());
          } else {
            this.setDataValue('store_email', null);
          }
        },
      },
      store_phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      city: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      state: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      postal_code: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      country: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: 'India',
      },
      logo_url: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      banner_url: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      tax_id: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      bank_account_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      bank_account_number: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      bank_ifsc_code: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      bank_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      commission_rate: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 10.00,
        validate: {
          min: 0,
          max: 100,
        },
      },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected', 'suspended'),
        allowNull: false,
        defaultValue: 'pending',
      },
      rejection_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      approved_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      wallet_balance: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      total_withdrawn: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
    },
    {
      sequelize,
      modelName: 'Vendor',
      tableName: 'vendors',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          unique: true,
          fields: ['user_id'],
        },
        {
          unique: true,
          fields: ['store_slug'],
        },
        {
          fields: ['status'],
        },
        {
          fields: ['created_at'],
        },
      ],
    }
  );

  return Vendor;
};
