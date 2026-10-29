const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Category extends Model {
    /**
     * Generate URL-friendly slug from category name
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

  Category.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      parent_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        defaultValue: null,
        references: {
          model: 'categories',
          key: 'id',
        },
      },
      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [2, 150],
        },
      },
      slug: {
        type: DataTypes.STRING(191),
        allowNull: false,
        unique: {
          name: 'categories_slug_unique',
          msg: 'Category slug already in use',
        },
        set(value) {
          if (value) {
            this.setDataValue('slug', Category.slugify(value));
          }
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      banner_image: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      thumbnail_image: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active',
      },
      display_order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: 'Category',
      tableName: 'categories',
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
          fields: ['parent_id'],
        },
        {
          fields: ['status'],
        },
        {
          fields: ['display_order'],
        },
        {
          fields: ['created_at'],
        },
      ],
    }
  );

  return Category;
};
