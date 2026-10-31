'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create header_menus table
    await queryInterface.createTable('header_menus', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      slug: {
        type: Sequelize.STRING(191),
        allowNull: false,
        unique: true,
      },
      url: {
        type: Sequelize.STRING(1024),
        allowNull: true,
        defaultValue: null,
      },
      icon: {
        type: Sequelize.STRING(1024),
        allowNull: true,
        defaultValue: null,
      },
      image: {
        type: Sequelize.STRING(1024),
        allowNull: true,
        defaultValue: null,
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active',
      },
      display_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      banner_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        defaultValue: null,
        references: {
          model: 'banners',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      category_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        defaultValue: null,
        references: {
          model: 'categories',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('header_menus', ['status'], { name: 'header_menus_status_idx' });
    await queryInterface.addIndex('header_menus', ['display_order'], { name: 'header_menus_display_order_idx' });
    await queryInterface.addIndex('header_menus', ['banner_id'], { name: 'header_menus_banner_id_idx' });
    await queryInterface.addIndex('header_menus', ['category_id'], { name: 'header_menus_category_id_idx' });

    // 2. Create header_menu_items table
    await queryInterface.createTable('header_menu_items', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      parent_menu_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'header_menus',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      parent_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        defaultValue: null,
        references: {
          model: 'header_menu_items',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      name: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      slug: {
        type: Sequelize.STRING(191),
        allowNull: false,
      },
      category_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        defaultValue: null,
        references: {
          model: 'categories',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      redirect_url: {
        type: Sequelize.STRING(1024),
        allowNull: true,
        defaultValue: null,
      },
      image: {
        type: Sequelize.STRING(1024),
        allowNull: true,
        defaultValue: null,
      },
      display_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      banner_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        defaultValue: null,
        references: {
          model: 'banners',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('header_menu_items', ['parent_menu_id'], { name: 'header_menu_items_parent_menu_id_idx' });
    await queryInterface.addIndex('header_menu_items', ['parent_id'], { name: 'header_menu_items_parent_id_idx' });
    await queryInterface.addIndex('header_menu_items', ['slug'], { name: 'header_menu_items_slug_idx' });
    await queryInterface.addIndex('header_menu_items', ['category_id'], { name: 'header_menu_items_category_id_idx' });
    await queryInterface.addIndex('header_menu_items', ['banner_id'], { name: 'header_menu_items_banner_id_idx' });
    await queryInterface.addIndex('header_menu_items', ['is_active'], { name: 'header_menu_items_is_active_idx' });
    await queryInterface.addIndex('header_menu_items', ['display_order'], { name: 'header_menu_items_display_order_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('header_menu_items');
    await queryInterface.dropTable('header_menus');
  },
};

