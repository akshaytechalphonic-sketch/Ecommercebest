const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class CartItem extends Model {}

  CartItem.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      cart_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'carts',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      product_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      quantity: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 1,
        validate: {
          min: 1,
        },
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
        get() {
          const val = this.getDataValue('price');
          return val === null ? null : parseFloat(val);
        },
      },
    },
    {
      sequelize,
      modelName: 'CartItem',
      tableName: 'cart_items',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          unique: true,
          fields: ['cart_id', 'product_id'],
        },
        {
          fields: ['cart_id'],
        },
        {
          fields: ['product_id'],
        },
      ],
    }
  );

  return CartItem;
};
