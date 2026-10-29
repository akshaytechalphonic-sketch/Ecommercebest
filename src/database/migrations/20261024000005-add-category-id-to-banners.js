'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add category_id column to banners table
    await queryInterface.addColumn('banners', 'category_id', {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: true,
      defaultValue: null,
      references: {
        model: 'categories',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    // 2. Add index for fast category-based banner filtering
    await queryInterface.addIndex('banners', ['category_id'], {
      name: 'banners_category_id_idx',
    });

    // 3. Composite index for category and active status
    await queryInterface.addIndex('banners', ['category_id', 'is_active'], {
      name: 'banners_category_active_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('banners', 'banners_category_active_idx');
    await queryInterface.removeIndex('banners', 'banners_category_id_idx');
    await queryInterface.removeColumn('banners', 'category_id');
  },
};
