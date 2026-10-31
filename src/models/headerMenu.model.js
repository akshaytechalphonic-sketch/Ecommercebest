const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class HeaderMenu extends Model {
    static slugify(text) {
      if (!text) return '';
      return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
    }
  }

  HeaderMenu.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Menu name cannot be empty' },
          len: [1, 150],
        },
      },
      slug: {
        type: DataTypes.STRING(191),
        allowNull: false,
        unique: {
          name: 'header_menus_slug_unique',
          msg: 'Header menu slug already in use',
        },
        set(value) {
          if (value) {
            this.setDataValue('slug', HeaderMenu.slugify(value));
          }
        },
      },
      url: {
        type: DataTypes.STRING(1024),
        allowNull: true,
        defaultValue: null,
      },
      icon: {
        type: DataTypes.STRING(1024),
        allowNull: true,
        defaultValue: null,
      },
      image: {
        type: DataTypes.STRING(1024),
        allowNull: true,
        defaultValue: null,
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
      banner_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        defaultValue: null,
        references: {
          model: 'banners',
          key: 'id',
        },
      },
      category_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        defaultValue: null,
        references: {
          model: 'categories',
          key: 'id',
        },
      },
    },
    {
      sequelize,
      modelName: 'HeaderMenu',
      tableName: 'header_menus',
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
          fields: ['status'],
        },
        {
          fields: ['display_order'],
        },
        {
          fields: ['banner_id'],
        },
        {
          fields: ['category_id'],
        },
      ],
    }
  );

  return HeaderMenu;
};

