'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('products', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      vendor_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'vendors',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      category_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'categories',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      subcategory_id: {
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
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      slug: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      images: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      discount_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: null,
      },
      sku: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      stock: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'draft'),
        allowNull: false,
        defaultValue: 'active',
      },
      approval_status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
      },
      rejection_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
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

    // Add indexes for high performance filtering & uniqueness
    await queryInterface.addIndex('products', ['slug'], {
      unique: true,
      name: 'products_slug_unique',
    });

    await queryInterface.addIndex('products', ['sku'], {
      unique: true,
      name: 'products_sku_unique',
    });

    await queryInterface.addIndex('products', ['vendor_id'], {
      name: 'products_vendor_id_idx',
    });

    await queryInterface.addIndex('products', ['category_id'], {
      name: 'products_category_id_idx',
    });

    await queryInterface.addIndex('products', ['subcategory_id'], {
      name: 'products_subcategory_id_idx',
    });

    await queryInterface.addIndex('products', ['status'], {
      name: 'products_status_idx',
    });

    await queryInterface.addIndex('products', ['approval_status'], {
      name: 'products_approval_status_idx',
    });

    await queryInterface.addIndex('products', ['created_at'], {
      name: 'products_created_at_idx',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('products');
  },
};
