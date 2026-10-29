const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class OrderItem extends Model {}

  OrderItem.init(
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
      vendor_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      product_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      quantity: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 1,
      },
      unit_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      subtotal: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      item_status: {
        type: DataTypes.ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded'),
        allowNull: false,
        defaultValue: 'pending',
      },
    },
    {
      sequelize,
      modelName: 'OrderItem',
      tableName: 'order_items',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return OrderItem;
};
