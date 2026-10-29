'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add low_stock_threshold to products table
    await queryInterface.addColumn('products', 'low_stock_threshold', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 5,
      after: 'stock',
    });

    // Add index for fast low-stock queries
    await queryInterface.addIndex('products', ['low_stock_threshold'], {
      name: 'products_low_stock_threshold_idx',
    });

    // 2. Create inventory_logs table to audit every stock change
    await queryInterface.createTable('inventory_logs', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      product_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      vendor_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: {
          model: 'vendors',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      user_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      action_type: {
        type: Sequelize.ENUM('increase', 'decrease', 'set', 'threshold_update'),
        allowNull: false,
        defaultValue: 'increase',
      },
      previous_stock: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      changed_quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      new_stock: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      reason: {
        type: Sequelize.STRING(255),
        allowNull: false,
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

    // Add indexes for inventory audit queries
    await queryInterface.addIndex('inventory_logs', ['product_id'], {
      name: 'inventory_logs_product_id_idx',
    });
    await queryInterface.addIndex('inventory_logs', ['vendor_id'], {
      name: 'inventory_logs_vendor_id_idx',
    });
    await queryInterface.addIndex('inventory_logs', ['user_id'], {
      name: 'inventory_logs_user_id_idx',
    });
    await queryInterface.addIndex('inventory_logs', ['created_at'], {
      name: 'inventory_logs_created_at_idx',
    });
  },

  async down(queryInterface, Sequelize) {
    // 1. Drop inventory_logs table
    await queryInterface.dropTable('inventory_logs');

    // 2. Remove index and column from products
    try {
      await queryInterface.removeIndex('products', 'products_low_stock_threshold_idx');
    } catch (e) {
      // ignore if already removed
    }

    await queryInterface.removeColumn('products', 'low_stock_threshold');
  },
};
