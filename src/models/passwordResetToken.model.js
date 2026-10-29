const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class PasswordResetToken extends Model {
    get isExpired() {
      return new Date() >= this.expires_at;
    }

    get isValid() {
      return !this.is_used && !this.isExpired;
    }
  }

  PasswordResetToken.init(
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
      token_hash: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: {
          name: 'password_reset_tokens_token_hash_unique',
          msg: 'Token hash must be unique',
        },
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      is_used: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      used_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      sequelize,
      modelName: 'PasswordResetToken',
      tableName: 'password_reset_tokens',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          fields: ['user_id'],
        },
        {
          unique: true,
          fields: ['token_hash'],
        },
      ],
    }
  );

  return PasswordResetToken;
};
