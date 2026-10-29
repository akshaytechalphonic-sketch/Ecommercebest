const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class InventoryLog extends Model {}

  InventoryLog.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      product_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id',
        },
      },
      vendor_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        references: {
          model: 'vendors',
          key: 'id',
        },
      },
      user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      action_type: {
        type: DataTypes.ENUM('increase', 'decrease', 'set', 'threshold_update'),
        allowNull: false,
        defaultValue: 'increase',
      },
      previous_stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      changed_quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      new_stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      reason: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'InventoryLog',
      tableName: 'inventory_logs',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          fields: ['product_id'],
        },
        {
          fields: ['vendor_id'],
        },
        {
          fields: ['user_id'],
        },
        {
          fields: ['created_at'],
        },
      ],
    }
  );

  return InventoryLog;
};
