const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Address extends Model {}

  Address.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      recipient_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [2, 100],
        },
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      address_line1: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      address_line2: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
      },
      city: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      state: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      postal_code: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      country: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: 'India',
      },
      type: {
        type: DataTypes.ENUM('home', 'work', 'other'),
        allowNull: false,
        defaultValue: 'home',
      },
      is_default: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: 'Address',
      tableName: 'addresses',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          fields: ['user_id'],
        },
        {
          fields: ['user_id', 'is_default'],
        },
      ],
    }
  );

  return Address;
};
