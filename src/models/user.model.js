const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class User extends Model {
    /**
     * Helper to return safe user object without sensitive fields
     */
    toSafeObject() {
      const values = { ...this.get() };
      delete values.password_hash;
      return values;
    }
  }

  User.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [2, 100],
        },
      },
      email: {
        type: DataTypes.STRING(191),
        allowNull: false,
        unique: {
          name: 'users_email_unique',
          msg: 'Email address already in use',
        },
        validate: {
          isEmail: true,
        },
        set(value) {
          if (value) {
            this.setDataValue('email', value.trim().toLowerCase());
          }
        },
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
        unique: {
          name: 'users_phone_unique',
          msg: 'Phone number already in use',
        },
      },
      avatar_url: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
      },
      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM('admin', 'vendor', 'customer'),
        allowNull: false,
        defaultValue: 'customer',
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive', 'blocked'),
        allowNull: false,
        defaultValue: 'active',
      },
      is_verified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          unique: true,
          fields: ['email'],
        },
        {
          unique: true,
          fields: ['phone'],
        },
        {
          fields: ['role'],
        },
        {
          fields: ['status'],
        },
      ],
    }
  );

  return User;
};
