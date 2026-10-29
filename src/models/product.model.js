const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Product extends Model {
    /**
     * Generate URL-friendly slug from product name
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

    /**
     * Custom JSON serializer for clean API responses
     */
    toJSON() {
      const values = { ...this.get() };

      // Ensure images is always returned as an array
      if (typeof values.images === 'string') {
        try {
          values.images = JSON.parse(values.images);
        } catch (e) {
          values.images = [];
        }
      } else if (!values.images) {
        values.images = [];
      }

      // Add convenience flag
      values.is_approved = values.approval_status === 'approved';

      // Check if product is low stock
      const stockNum = Number(values.stock || 0);
      const threshNum = Number(values.low_stock_threshold !== undefined ? values.low_stock_threshold : 5);
      values.is_low_stock = stockNum <= threshNum;

      // Calculate discount percentage if discount_price exists
      if (values.discount_price && Number(values.price) > 0) {
        const p = Number(values.price);
        const dp = Number(values.discount_price);
        if (dp < p) {
          values.discount_percent = Number((((p - dp) / p) * 100).toFixed(1));
        } else {
          values.discount_percent = 0;
        }
      } else {
        values.discount_percent = 0;
      }

      return values;
    }
  }

  Product.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      vendor_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'vendors',
          key: 'id',
        },
      },
      category_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'categories',
          key: 'id',
        },
      },
      subcategory_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        defaultValue: null,
        references: {
          model: 'categories',
          key: 'id',
        },
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [2, 255],
        },
      },
      slug: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: {
          name: 'products_slug_unique',
          msg: 'Product slug already in use',
        },
        set(value) {
          if (value) {
            this.setDataValue('slug', Product.slugify(value));
          }
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      images: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
        get() {
          const raw = this.getDataValue('images');
          if (typeof raw === 'string') {
            try {
              return JSON.parse(raw);
            } catch (e) {
              return [];
            }
          }
          return Array.isArray(raw) ? raw : [];
        },
        set(val) {
          if (Array.isArray(val)) {
            this.setDataValue('images', val);
          } else if (typeof val === 'string') {
            try {
              this.setDataValue('images', JSON.parse(val));
            } catch (e) {
              this.setDataValue('images', [val]);
            }
          } else {
            this.setDataValue('images', []);
          }
        },
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      discount_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: null,
        validate: {
          min: 0,
        },
      },
      sku: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: {
          name: 'products_sku_unique',
          msg: 'SKU already in use',
        },
      },
      stock: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      low_stock_threshold: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 5,
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive', 'draft'),
        allowNull: false,
        defaultValue: 'active',
      },
      approval_status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
      },
      rejection_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Product',
      tableName: 'products',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          unique: true,
          fields: ['slug'],
        },
        {
          unique: true,
          fields: ['sku'],
        },
        {
          fields: ['vendor_id'],
        },
        {
          fields: ['category_id'],
        },
        {
          fields: ['subcategory_id'],
        },
        {
          fields: ['status'],
        },
        {
          fields: ['approval_status'],
        },
        {
          fields: ['low_stock_threshold'],
        },
        {
          fields: ['created_at'],
        },
      ],
    }
  );

  return Product;
};
