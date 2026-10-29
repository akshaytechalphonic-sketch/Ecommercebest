'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'avatar_url', {
      type: Sequelize.STRING(255),
      allowNull: true,
      defaultValue: null,
      after: 'phone',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'avatar_url');
  },
};
