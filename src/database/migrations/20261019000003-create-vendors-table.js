'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('vendors', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      store_name: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      store_slug: {
        type: Sequelize.STRING(191),
        allowNull: false,
        unique: true,
      },
      store_email: {
        type: Sequelize.STRING(191),
        allowNull: true,
      },
      store_phone: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      city: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      state: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      postal_code: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      country: {
        type: Sequelize.STRING(100),
        allowNull: false,
        defaultValue: 'India',
      },
      logo_url: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      banner_url: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      tax_id: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      bank_account_name: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      bank_account_number: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      bank_ifsc_code: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      bank_name: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      commission_rate: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 10.00,
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected', 'suspended'),
        allowNull: false,
        defaultValue: 'pending',
      },
      rejection_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      approved_at: {
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

    // Add indexes for efficient querying and lookup
    await queryInterface.addIndex('vendors', ['user_id'], {
      unique: true,
      name: 'vendors_user_id_unique',
    });

    await queryInterface.addIndex('vendors', ['store_slug'], {
      unique: true,
      name: 'vendors_store_slug_unique',
    });

    await queryInterface.addIndex('vendors', ['status'], {
      name: 'vendors_status_idx',
    });

    await queryInterface.addIndex('vendors', ['created_at'], {
      name: 'vendors_created_at_idx',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('vendors');
  },
};
