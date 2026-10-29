const { Op } = require('sequelize');
const { Banner, Category } = require('../models');
const { AppError } = require('../middleware/error.middleware');

class BannerService {
  /**
   * 1. Public: Get Active Banners for Frontend Display (Home & Category-specific)
   */
  async getPublicBanners(params = {}) {
    const { banner_type, category_id, limit = 20, fallback_home = true } = params;
    const now = new Date();

    const baseWhere = {
      is_active: true,
      [Op.and]: [
        {
          [Op.or]: [
            { start_date: null },
            { start_date: { [Op.lte]: now } },
          ],
        },
        {
          [Op.or]: [
            { end_date: null },
            { end_date: { [Op.gte]: now } },
          ],
        },
      ],
    };

    if (banner_type) {
      baseWhere.banner_type = banner_type;
    }

    const where = { ...baseWhere };

    // Handle category filter
    if (category_id !== undefined) {
      if (category_id === null || category_id === 'null' || category_id === 'home') {
        where.category_id = null;
      } else {
        where.category_id = Number(category_id);
      }
    }

    let banners = await Banner.findAll({
      where,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug'],
          required: false,
        },
      ],
      order: [
        ['position', 'ASC'],
        ['id', 'ASC'],
      ],
      limit: Math.min(Number(limit) || 20, 100),
    });

    // If specific category was requested but has no dedicated banners,
    // optionally fallback to global home banners so the category page is never blank
    if (
      banners.length === 0 &&
      category_id &&
      category_id !== 'null' &&
      category_id !== 'home' &&
      fallback_home !== false &&
      fallback_home !== 'false'
    ) {
      const fallbackWhere = {
        ...baseWhere,
        category_id: null,
      };

      banners = await Banner.findAll({
        where: fallbackWhere,
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name', 'slug'],
            required: false,
          },
        ],
        order: [
          ['position', 'ASC'],
          ['id', 'ASC'],
        ],
        limit: Math.min(Number(limit) || 20, 100),
      });
    }

    return banners;
  }

  /**
   * 2. Public / App: Get Banner by ID
   */
  async getBannerById(id) {
    const banner = await Banner.findByPk(id, {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug'],
        },
      ],
    });
    if (!banner) {
      throw new AppError('Banner not found', 404, 'BANNER_NOT_FOUND');
    }
    return banner;
  }

  /**
   * 3. Public: Increment Banner Click Count
   */
  async recordClick(id) {
    const banner = await Banner.findByPk(id);
    if (!banner) {
      throw new AppError('Banner not found', 404, 'BANNER_NOT_FOUND');
    }

    await banner.increment('click_count', { by: 1 });
    await banner.reload();
    return { id: banner.id, click_count: banner.click_count };
  }

  /**
   * 4. Admin: Get All Banners with Pagination, Filtering & Search
   */
  async getAdminBanners(params = {}) {
    const { page = 1, limit = 20, banner_type, category_id, is_active, search } = params;
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
    const offset = (pageNum - 1) * limitNum;

    const where = {};

    if (banner_type) {
      where.banner_type = banner_type;
    }

    if (category_id !== undefined) {
      if (category_id === null || category_id === 'null' || category_id === 'home') {
        where.category_id = null;
      } else {
        where.category_id = Number(category_id);
      }
    }

    if (is_active !== undefined) {
      where.is_active = is_active === true || is_active === 'true' || is_active === 1 || is_active === '1';
    }

    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { subtitle: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Banner.findAndCountAll({
      where,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug'],
          required: false,
        },
      ],
      order: [
        ['position', 'ASC'],
        ['id', 'DESC'],
      ],
      limit: limitNum,
      offset,
    });

    // Summary statistics for executive admin
    const totalActive = await Banner.count({ where: { is_active: true } });
    const totalClicks = (await Banner.sum('click_count')) || 0;
    const categoryBannersCount = await Banner.count({
      where: {
        category_id: { [Op.ne]: null },
      },
    });

    return {
      banners: rows,
      pagination: {
        total: count,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(count / limitNum) || 1,
      },
      stats: {
        total_banners: count,
        active_banners: totalActive,
        total_clicks: totalClicks,
        category_banners: categoryBannersCount,
      },
    };
  }

  /**
   * 5. Admin: Create a New Banner (Global or Category-specific)
   */
  async createBanner(data) {
    const {
      title,
      subtitle,
      description,
      image_url,
      mobile_image_url,
      link_url,
      banner_type = 'home_hero',
      category_id = null,
      position = 0,
      is_active = true,
      start_date = null,
      end_date = null,
    } = data;

    let targetCategoryId = null;
    if (category_id && category_id !== 'null' && category_id !== 'none') {
      const cat = await Category.findByPk(Number(category_id));
      if (!cat) {
        throw new AppError('Specified category does not exist', 404, 'CATEGORY_NOT_FOUND');
      }
      targetCategoryId = cat.id;
    }

    const banner = await Banner.create({
      title,
      subtitle,
      description,
      image_url,
      mobile_image_url,
      link_url,
      banner_type,
      category_id: targetCategoryId,
      position: Number(position) || 0,
      is_active: Boolean(is_active),
      start_date: start_date ? new Date(start_date) : null,
      end_date: end_date ? new Date(end_date) : null,
      click_count: 0,
    });

    return await this.getBannerById(banner.id);
  }

  /**
   * 6. Admin: Update Banner
   */
  async updateBanner(id, data) {
    const banner = await this.getBannerById(id);

    const updateFields = {};
    const allowed = [
      'title',
      'subtitle',
      'description',
      'image_url',
      'mobile_image_url',
      'link_url',
      'banner_type',
      'category_id',
      'position',
      'is_active',
      'start_date',
      'end_date',
    ];

    for (const key of allowed) {
      if (data[key] !== undefined) {
        if (key === 'start_date' || key === 'end_date') {
          updateFields[key] = data[key] ? new Date(data[key]) : null;
        } else if (key === 'category_id') {
          if (data[key] && data[key] !== 'null' && data[key] !== 'none') {
            const cat = await Category.findByPk(Number(data[key]));
            if (!cat) {
              throw new AppError('Specified category does not exist', 404, 'CATEGORY_NOT_FOUND');
            }
            updateFields[key] = cat.id;
          } else {
            updateFields[key] = null;
          }
        } else {
          updateFields[key] = data[key];
        }
      }
    }

    await banner.update(updateFields);
    return await this.getBannerById(banner.id);
  }

  /**
   * 7. Admin: Toggle Banner Active Status
   */
  async updateBannerStatus(id, isActive) {
    const banner = await this.getBannerById(id);
    await banner.update({ is_active: Boolean(isActive) });
    return banner;
  }

  /**
   * 8. Admin: Delete Banner
   */
  async deleteBanner(id) {
    const banner = await this.getBannerById(id);
    await banner.destroy();
    return { success: true, message: 'Banner deleted successfully' };
  }
}

module.exports = new BannerService();
