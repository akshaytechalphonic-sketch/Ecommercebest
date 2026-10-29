const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Refund extends Model {}

  Refund.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      refund_number: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      order_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      order_item_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      payment_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      vendor_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      vendor_balance_deducted: {
        type: Sequelize => DataTypes.DECIMAL(12, 2),
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      commission_reversed: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('requested', 'approved', 'rejected', 'refunded'),
        allowNull: false,
        defaultValue: 'requested',
      },
      rejection_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      gateway_refund_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      processed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Refund',
      tableName: 'refunds',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return Refund;
};
