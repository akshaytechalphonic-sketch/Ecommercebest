const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Commission extends Model {}

  Commission.init(
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
      order_item_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      vendor_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      gross_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      discount_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      net_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      commission_rate: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
      },
      commission_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      vendor_earning: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('pending', 'available', 'credited', 'settled', 'refunded', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      settlement_status: {
        type: DataTypes.ENUM('unsettled', 'settling', 'settled'),
        allowNull: false,
        defaultValue: 'unsettled',
      },
      credited_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      settled_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Commission',
      tableName: 'commissions',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          name: 'commissions_order_item_id_unique',
          unique: true,
          fields: ['order_item_id'],
        },
        {
          name: 'commissions_order_id_idx',
          fields: ['order_id'],
        },
        {
          name: 'commissions_vendor_id_idx',
          fields: ['vendor_id'],
        },
        {
          name: 'commissions_status_idx',
          fields: ['status'],
        },
        {
          name: 'commissions_settlement_status_idx',
          fields: ['settlement_status'],
        },
      ],
    }
  );

  return Commission;
};
