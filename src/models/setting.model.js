const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Setting extends Model {}

  Setting.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      key: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: { msg: 'Setting key cannot be empty' },
        },
      },
      value: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      group: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'general',
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      is_public: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: 'Setting',
      tableName: 'settings',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          name: 'settings_key_unique',
          unique: true,
          fields: ['key'],
        },
        {
          name: 'settings_group_idx',
          fields: ['group'],
        },
      ],
    }
  );

  return Setting;
};
