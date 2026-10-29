'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add discount_amount
    await queryInterface.addColumn('commissions', 'discount_amount', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    });

    // 2. Add net_amount
    await queryInterface.addColumn('commissions', 'net_amount', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.00,
    });

    // Backfill net_amount from gross_amount
    await queryInterface.sequelize.query(
      'UPDATE commissions SET net_amount = gross_amount WHERE net_amount = 0'
    );

    // 3. Expand status ENUM to include 'available', 'settled', 'cancelled'
    await queryInterface.changeColumn('commissions', 'status', {
      type: Sequelize.ENUM('pending', 'available', 'credited', 'settled', 'refunded', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    });

    // 4. Add settlement_status
    await queryInterface.addColumn('commissions', 'settlement_status', {
      type: Sequelize.ENUM('unsettled', 'settling', 'settled'),
      allowNull: false,
      defaultValue: 'unsettled',
    });

    // 5. Add settled_at
    await queryInterface.addColumn('commissions', 'settled_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    // 6. Add notes
    await queryInterface.addColumn('commissions', 'notes', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    // 7. Add unique index on order_item_id to prevent duplicate commission entries
    await queryInterface.addIndex('commissions', ['order_item_id'], {
      name: 'commissions_order_item_id_unique',
      unique: true,
    });

    // 8. Add index on settlement_status
    await queryInterface.addIndex('commissions', ['settlement_status'], {
      name: 'commissions_settlement_status_idx',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('commissions', 'commissions_settlement_status_idx');
    await queryInterface.removeIndex('commissions', 'commissions_order_item_id_unique');
    await queryInterface.removeColumn('commissions', 'notes');
    await queryInterface.removeColumn('commissions', 'settled_at');
    await queryInterface.removeColumn('commissions', 'settlement_status');
    await queryInterface.changeColumn('commissions', 'status', {
      type: Sequelize.ENUM('pending', 'credited', 'refunded'),
      allowNull: false,
      defaultValue: 'pending',
    });
    await queryInterface.removeColumn('commissions', 'net_amount');
    await queryInterface.removeColumn('commissions', 'discount_amount');
  },
};
