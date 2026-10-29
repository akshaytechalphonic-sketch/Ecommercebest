const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class RefreshToken extends Model {
    get isExpired() {
      return new Date() >= this.expires_at;
    }

    get isRevoked() {
      return this.revoked_at !== null;
    }

    get isValid() {
      return !this.isExpired && !this.isRevoked;
    }
  }

  RefreshToken.init(
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
          name: 'refresh_tokens_token_hash_unique',
          msg: 'Token hash must be unique',
        },
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      revoked_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
      replaced_by_token_hash: {
        type: DataTypes.STRING(64),
        allowNull: true,
        defaultValue: null,
      },
      user_agent: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      ip_address: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'RefreshToken',
      tableName: 'refresh_tokens',
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

  return RefreshToken;
};
