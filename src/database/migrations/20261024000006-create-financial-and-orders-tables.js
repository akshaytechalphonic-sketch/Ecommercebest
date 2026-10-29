'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add wallet_balance and total_withdrawn to vendors table
    const vendorTable = await queryInterface.describeTable('vendors');
    if (!vendorTable.wallet_balance) {
      await queryInterface.addColumn('vendors', 'wallet_balance', {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00,
      });
    }
    if (!vendorTable.total_withdrawn) {
      await queryInterface.addColumn('vendors', 'total_withdrawn', {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00,
      });
    }

    // 2. Create orders table
    await queryInterface.createTable('orders', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      order_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      user_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      shipping_address_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: {
          model: 'addresses',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      total_amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      tax_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      shipping_fee: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      discount_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      payment_status: {
        type: Sequelize.ENUM('pending', 'paid', 'failed', 'refunded', 'partially_refunded'),
        allowNull: false,
        defaultValue: 'pending',
      },
      order_status: {
        type: Sequelize.ENUM('placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'),
        allowNull: false,
        defaultValue: 'placed',
      },
      notes: {
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

    await queryInterface.addIndex('orders', ['user_id'], { name: 'orders_user_id_idx' });
    await queryInterface.addIndex('orders', ['order_number'], { name: 'orders_order_number_idx' });
    await queryInterface.addIndex('orders', ['payment_status'], { name: 'orders_payment_status_idx' });
    await queryInterface.addIndex('orders', ['order_status'], { name: 'orders_order_status_idx' });

    // 3. Create order_items table
    await queryInterface.createTable('order_items', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      order_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'orders',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      vendor_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'vendors',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      product_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      quantity: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 1,
      },
      unit_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      subtotal: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      item_status: {
        type: Sequelize.ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded'),
        allowNull: false,
        defaultValue: 'pending',
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

    await queryInterface.addIndex('order_items', ['order_id'], { name: 'order_items_order_id_idx' });
    await queryInterface.addIndex('order_items', ['vendor_id'], { name: 'order_items_vendor_id_idx' });
    await queryInterface.addIndex('order_items', ['product_id'], { name: 'order_items_product_id_idx' });

    // 4. Create payments table
    await queryInterface.createTable('payments', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      order_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'orders',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: 'INR',
      },
      payment_method: {
        type: Sequelize.ENUM('card', 'upi', 'netbanking', 'cod', 'wallet'),
        allowNull: false,
        defaultValue: 'upi',
      },
      gateway: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'razorpay',
      },
      transaction_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
        unique: true,
      },
      gateway_order_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('pending', 'completed', 'failed', 'refunded', 'partially_refunded'),
        allowNull: false,
        defaultValue: 'pending',
      },
      failure_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      gateway_response: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      paid_at: {
        type: Sequelize.DATE,
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

    await queryInterface.addIndex('payments', ['order_id'], { name: 'payments_order_id_idx' });
    await queryInterface.addIndex('payments', ['user_id'], { name: 'payments_user_id_idx' });
    await queryInterface.addIndex('payments', ['status'], { name: 'payments_status_idx' });
    await queryInterface.addIndex('payments', ['transaction_id'], { name: 'payments_transaction_id_idx' });

    // 5. Create commissions table (ledger for admin commission & vendor net earning)
    await queryInterface.createTable('commissions', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      order_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'orders',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      order_item_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'order_items',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      vendor_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'vendors',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      gross_amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      commission_rate: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
      },
      commission_amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      vendor_earning: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('pending', 'credited', 'refunded'),
        allowNull: false,
        defaultValue: 'pending',
      },
      credited_at: {
        type: Sequelize.DATE,
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

    await queryInterface.addIndex('commissions', ['order_id'], { name: 'commissions_order_id_idx' });
    await queryInterface.addIndex('commissions', ['vendor_id'], { name: 'commissions_vendor_id_idx' });
    await queryInterface.addIndex('commissions', ['status'], { name: 'commissions_status_idx' });

    // 6. Create seller_payouts table (withdrawals / settlement requests)
    await queryInterface.createTable('seller_payouts', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      payout_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      vendor_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'vendors',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      payout_method: {
        type: Sequelize.ENUM('bank_transfer', 'upi', 'manual'),
        allowNull: false,
        defaultValue: 'bank_transfer',
      },
      account_details: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected', 'processing'),
        allowNull: false,
        defaultValue: 'pending',
      },
      transaction_reference: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      rejection_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      admin_notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      requested_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      processed_at: {
        type: Sequelize.DATE,
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

    await queryInterface.addIndex('seller_payouts', ['vendor_id'], { name: 'seller_payouts_vendor_id_idx' });
    await queryInterface.addIndex('seller_payouts', ['status'], { name: 'seller_payouts_status_idx' });
    await queryInterface.addIndex('seller_payouts', ['payout_number'], { name: 'seller_payouts_payout_number_idx' });

    // 7. Create refunds table
    await queryInterface.createTable('refunds', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      refund_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      order_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'orders',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      order_item_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: {
          model: 'order_items',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      payment_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: {
          model: 'payments',
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
        onDelete: 'RESTRICT',
      },
      vendor_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'vendors',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      vendor_balance_deducted: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      commission_reversed: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('requested', 'approved', 'rejected', 'refunded'),
        allowNull: false,
        defaultValue: 'requested',
      },
      rejection_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      gateway_refund_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      processed_at: {
        type: Sequelize.DATE,
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

    await queryInterface.addIndex('refunds', ['order_id'], { name: 'refunds_order_id_idx' });
    await queryInterface.addIndex('refunds', ['vendor_id'], { name: 'refunds_vendor_id_idx' });
    await queryInterface.addIndex('refunds', ['user_id'], { name: 'refunds_user_id_idx' });
    await queryInterface.addIndex('refunds', ['status'], { name: 'refunds_status_idx' });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('refunds');
    await queryInterface.dropTable('seller_payouts');
    await queryInterface.dropTable('commissions');
    await queryInterface.dropTable('payments');
    await queryInterface.dropTable('order_items');
    await queryInterface.dropTable('orders');

    const vendorTable = await queryInterface.describeTable('vendors');
    if (vendorTable.wallet_balance) {
      await queryInterface.removeColumn('vendors', 'wallet_balance');
    }
    if (vendorTable.total_withdrawn) {
      await queryInterface.removeColumn('vendors', 'total_withdrawn');
    }
  },
};
