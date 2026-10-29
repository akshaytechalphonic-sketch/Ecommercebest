const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Order extends Model {}

  Order.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      order_number: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      shipping_address_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      total_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      tax_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      shipping_fee: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      discount_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      payment_status: {
        type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded', 'partially_refunded'),
        allowNull: false,
        defaultValue: 'pending',
      },
      order_status: {
        type: DataTypes.ENUM('placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'),
        allowNull: false,
        defaultValue: 'placed',
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Order',
      tableName: 'orders',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return Order;
};
