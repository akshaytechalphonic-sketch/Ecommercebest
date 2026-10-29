'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('categories', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      parent_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        defaultValue: null,
        references: {
          model: 'categories',
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
        unique: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      banner_image: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      thumbnail_image: {
        type: Sequelize.STRING(255),
        allowNull: true,
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

    // Add indexes
    await queryInterface.addIndex('categories', ['slug'], {
      unique: true,
      name: 'categories_slug_unique',
    });

    await queryInterface.addIndex('categories', ['parent_id'], {
      name: 'categories_parent_id_idx',
    });

    await queryInterface.addIndex('categories', ['status'], {
      name: 'categories_status_idx',
    });

    await queryInterface.addIndex('categories', ['display_order'], {
      name: 'categories_display_order_idx',
    });

    await queryInterface.addIndex('categories', ['created_at'], {
      name: 'categories_created_at_idx',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('categories');
  },
};
