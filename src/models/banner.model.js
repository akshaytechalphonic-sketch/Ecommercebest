const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Banner extends Model {
    /**
     * Check whether banner is active and within valid schedule window
     */
    get isCurrentlyActive() {
      if (!this.is_active) return false;
      const now = new Date();
      if (this.start_date && new Date(this.start_date) > now) return false;
      if (this.end_date && new Date(this.end_date) < now) return false;
      return true;
    }
  }

  Banner.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Banner title cannot be empty' },
        },
      },
      subtitle: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      image_url: {
        type: DataTypes.STRING(1024),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Banner image URL cannot be empty' },
        },
      },
      mobile_image_url: {
        type: DataTypes.STRING(1024),
        allowNull: true,
      },
      link_url: {
        type: DataTypes.STRING(1024),
        allowNull: true,
      },
      banner_type: {
        type: DataTypes.ENUM('home_hero', 'home_middle', 'home_bottom', 'promo_strip', 'popup', 'sidebar'),
        allowNull: false,
        defaultValue: 'home_hero',
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
      position: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      start_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      end_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      click_count: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: 'Banner',
      tableName: 'banners',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          name: 'banners_type_active_idx',
          fields: ['banner_type', 'is_active'],
        },
        {
          name: 'banners_position_idx',
          fields: ['position'],
        },
        {
          name: 'banners_category_id_idx',
          fields: ['category_id'],
        },
        {
          name: 'banners_category_active_idx',
          fields: ['category_id', 'is_active'],
        },
      ],
    }
  );

  return Banner;
};
