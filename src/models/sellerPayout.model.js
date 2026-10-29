const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class SellerPayout extends Model {}

  SellerPayout.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      payout_number: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      vendor_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      payout_method: {
        type: DataTypes.ENUM('bank_transfer', 'upi', 'manual'),
        allowNull: false,
        defaultValue: 'bank_transfer',
      },
      account_details: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected', 'processing'),
        allowNull: false,
        defaultValue: 'pending',
      },
      transaction_reference: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      rejection_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      admin_notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      requested_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      processed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'SellerPayout',
      tableName: 'seller_payouts',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return SellerPayout;
};
