const { Address, sequelize } = require('../models');
const { AppError } = require('../middleware/error.middleware');

class AddressService {
  /**
   * List all delivery addresses for a user
   */
  async getUserAddresses(userId) {
    return Address.findAll({
      where: { user_id: userId },
      order: [
        ['is_default', 'DESC'],
        ['created_at', 'DESC'],
      ],
    });
  }

  /**
   * Get single address by ID (owned by user)
   */
  async getAddressById(userId, addressId) {
    const address = await Address.findOne({
      where: {
        id: addressId,
        user_id: userId,
      },
    });

    if (!address) {
      throw new AppError('Delivery address not found', 404, 'ADDRESS_NOT_FOUND');
    }

    return address;
  }

  /**
   * Create a new delivery address
   */
  async createAddress(userId, data) {
    return sequelize.transaction(async (t) => {
      // Check existing count
      const count = await Address.count({
        where: { user_id: userId },
        transaction: t,
      });

      // If user has no existing addresses, this one must be default
      let makeDefault = Boolean(data.is_default) || count === 0;

      if (makeDefault && count > 0) {
        // Reset previous default addresses for this user
        await Address.update(
          { is_default: false },
          { where: { user_id: userId }, transaction: t }
        );
      }

      const address = await Address.create(
        {
          ...data,
          user_id: userId,
          is_default: makeDefault,
        },
        { transaction: t }
      );

      return address;
    });
  }

  /**
   * Update an existing delivery address
   */
  async updateAddress(userId, addressId, updateData) {
    return sequelize.transaction(async (t) => {
      const address = await Address.findOne({
        where: { id: addressId, user_id: userId },
        transaction: t,
      });

      if (!address) {
        throw new AppError('Delivery address not found', 404, 'ADDRESS_NOT_FOUND');
      }

      // If updating to default, unset other defaults
      if (updateData.is_default === true) {
        await Address.update(
          { is_default: false },
          { where: { user_id: userId }, transaction: t }
        );
      } else if (updateData.is_default === false && address.is_default) {
        // If unsetting default, make sure another address becomes default if any exist
        const otherAddress = await Address.findOne({
          where: { user_id: userId, id: { [sequelize.Sequelize.Op.ne]: addressId } },
          order: [['created_at', 'DESC']],
          transaction: t,
        });

        if (otherAddress) {
          await otherAddress.update({ is_default: true }, { transaction: t });
        } else {
          // If this is the only address, it must remain default
          updateData.is_default = true;
        }
      }

      await address.update(updateData, { transaction: t });
      return address;
    });
  }

  /**
   * Set address as default delivery address
   */
  async setDefaultAddress(userId, addressId) {
    return sequelize.transaction(async (t) => {
      const address = await Address.findOne({
        where: { id: addressId, user_id: userId },
        transaction: t,
      });

      if (!address) {
        throw new AppError('Delivery address not found', 404, 'ADDRESS_NOT_FOUND');
      }

      // Unset all previous defaults
      await Address.update(
        { is_default: false },
        { where: { user_id: userId }, transaction: t }
      );

      await address.update({ is_default: true }, { transaction: t });
      return address;
    });
  }

  /**
   * Delete address
   */
  async deleteAddress(userId, addressId) {
    return sequelize.transaction(async (t) => {
      const address = await Address.findOne({
        where: { id: addressId, user_id: userId },
        transaction: t,
      });

      if (!address) {
        throw new AppError('Delivery address not found', 404, 'ADDRESS_NOT_FOUND');
      }

      const wasDefault = address.is_default;
      await address.destroy({ transaction: t });

      // If the deleted address was default, promote another address to default if available
      if (wasDefault) {
        const nextAddress = await Address.findOne({
          where: { user_id: userId },
          order: [['created_at', 'DESC']],
          transaction: t,
        });

        if (nextAddress) {
          await nextAddress.update({ is_default: true }, { transaction: t });
        }
      }

      return true;
    });
  }
}

module.exports = new AddressService();
