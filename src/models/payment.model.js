const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Payment extends Model {}

  Payment.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      order_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      currency: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: 'INR',
      },
      payment_method: {
        type: DataTypes.ENUM('card', 'upi', 'netbanking', 'cod', 'wallet'),
        allowNull: false,
        defaultValue: 'upi',
      },
      gateway: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'razorpay',
      },
      transaction_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: true,
      },
      gateway_order_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded', 'partially_refunded'),
        allowNull: false,
        defaultValue: 'pending',
      },
      failure_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      gateway_response: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      paid_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Payment',
      tableName: 'payments',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return Payment;
};
