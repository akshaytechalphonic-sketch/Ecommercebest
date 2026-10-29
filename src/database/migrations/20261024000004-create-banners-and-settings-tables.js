'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create banners table
    await queryInterface.createTable('banners', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      subtitle: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      image_url: {
        type: Sequelize.STRING(1024),
        allowNull: false,
      },
      mobile_image_url: {
        type: Sequelize.STRING(1024),
        allowNull: true,
      },
      link_url: {
        type: Sequelize.STRING(1024),
        allowNull: true,
      },
      banner_type: {
        type: Sequelize.ENUM('home_hero', 'home_middle', 'home_bottom', 'promo_strip', 'popup', 'sidebar'),
        allowNull: false,
        defaultValue: 'home_hero',
      },
      position: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      start_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      end_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      click_count: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('banners', ['banner_type', 'is_active'], {
      name: 'banners_type_active_idx',
    });

    await queryInterface.addIndex('banners', ['position'], {
      name: 'banners_position_idx',
    });

    // 2. Create settings table for dynamic logo, branding and store configurations
    await queryInterface.createTable('settings', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      key: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      value: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      group: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'general',
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      is_public: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('settings', ['group'], {
      name: 'settings_group_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('banners');
    await queryInterface.dropTable('settings');
  },
};
