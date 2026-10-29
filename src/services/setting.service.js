const { Setting, sequelize } = require('../models');

const DEFAULT_BRANDING = {
  site_name: 'Bada Vyapaar',
  site_tagline: "India's Leading Multi-Vendor Marketplace",
  site_logo: '',
  site_dark_logo: '',
  site_favicon: '',
  contact_email: 'support@multivendor.com',
  contact_phone: '+91 98765 43210',
  primary_color: '#4f46e5',
  accent_color: '#4338ca',
  sidebar_color: '#ffffff',
  theme_preset: 'royal_indigo',
};

class SettingService {
  /**
   * 1. Public: Get Dynamic Branding & Site Identity
   */
  async getBranding() {
    const brandingKeys = Object.keys(DEFAULT_BRANDING);
    const records = await Setting.findAll({
      where: {
        key: brandingKeys,
      },
    });

    const result = { ...DEFAULT_BRANDING };
    for (const record of records) {
      if (record.value !== null && record.value !== undefined) {
        result[record.key] = record.value;
      }
    }

    return result;
  }

  /**
   * 2. Public: Get All Public Settings (key-value dictionary)
   */
  async getPublicSettings() {
    const records = await Setting.findAll({
      where: { is_public: true },
    });

    const dict = {};
    for (const item of records) {
      dict[item.key] = item.value;
    }
    return dict;
  }

  /**
   * 3. Admin: Get All Platform Settings Grouped by Category
   */
  async getAllSettings() {
    const records = await Setting.findAll({
      order: [
        ['group', 'ASC'],
        ['key', 'ASC'],
      ],
    });

    const grouped = {};
    for (const item of records) {
      if (!grouped[item.group]) {
        grouped[item.group] = [];
      }
      grouped[item.group].push(item);
    }

    return {
      all: records,
      grouped,
    };
  }

  /**
   * 4. Admin: Update Store Dynamic Branding (Logo, Name, Tagline, Favicon)
   */
  async updateBranding(data) {
    const transaction = await sequelize.transaction();
    try {
      const allowedKeys = Object.keys(DEFAULT_BRANDING);

      for (const [key, value] of Object.entries(data)) {
        if (allowedKeys.includes(key) && value !== undefined) {
          const stringVal = value === null ? '' : String(value);

          const existing = await Setting.findOne({
            where: { key },
            transaction,
          });

          if (existing) {
            await existing.update(
              {
                value: stringVal,
                group: 'branding',
                is_public: true,
              },
              { transaction }
            );
          } else {
            await Setting.create(
              {
                key,
                value: stringVal,
                group: 'branding',
                description: `Dynamic store ${key.replace(/_/g, ' ')}`,
                is_public: true,
              },
              { transaction }
            );
          }
        }
      }

      await transaction.commit();
      return await this.getBranding();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * 5. Admin: Bulk Update Platform Settings
   */
  async bulkUpdateSettings(settingsList) {
    const transaction = await sequelize.transaction();
    try {
      const updated = [];

      for (const item of settingsList) {
        const { key, value, group = 'general', description = null, is_public = true } = item;
        const stringVal = typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');

        const existing = await Setting.findOne({
          where: { key },
          transaction,
        });

        if (existing) {
          await existing.update(
            {
              value: stringVal,
              group,
              description: description || existing.description,
              is_public: Boolean(is_public),
            },
            { transaction }
          );
          updated.push(existing);
        } else {
          const created = await Setting.create(
            {
              key,
              value: stringVal,
              group,
              description,
              is_public: Boolean(is_public),
            },
            { transaction }
          );
          updated.push(created);
        }
      }

      await transaction.commit();
      return updated;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = new SettingService();
