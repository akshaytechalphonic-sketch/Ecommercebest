const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class HeaderMenuItem extends Model {
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

  HeaderMenuItem.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      parent_menu_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'header_menus',
          key: 'id',
        },
      },
      parent_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        defaultValue: null,
        references: {
          model: 'header_menu_items',
          key: 'id',
        },
      },
      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Item name cannot be empty' },
          len: [1, 150],
        },
      },
      slug: {
        type: DataTypes.STRING(191),
        allowNull: false,
        set(value) {
          if (value) {
            this.setDataValue('slug', HeaderMenuItem.slugify(value));
          }
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
      redirect_url: {
        type: DataTypes.STRING(1024),
        allowNull: true,
        defaultValue: null,
      },
      image: {
        type: DataTypes.STRING(1024),
        allowNull: true,
        defaultValue: null,
      },
      display_order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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
    },
    {
      sequelize,
      modelName: 'HeaderMenuItem',
      tableName: 'header_menu_items',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          fields: ['parent_menu_id'],
        },
        {
          fields: ['parent_id'],
        },
        {
          fields: ['slug'],
        },
        {
          fields: ['category_id'],
        },
        {
          fields: ['banner_id'],
        },
        {
          fields: ['is_active'],
        },
        {
          fields: ['display_order'],
        },
      ],
    }
  );

  return HeaderMenuItem;
};
