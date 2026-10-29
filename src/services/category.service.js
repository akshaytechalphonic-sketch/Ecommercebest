const { Op } = require('sequelize');
const { Category } = require('../models');
const { AppError } = require('../middleware/error.middleware');

class CategoryService {
  /**
   * Helper to ensure unique slug for categories
   */
  async generateUniqueSlug(baseText, currentId = null) {
    let slug = Category.slugify(baseText);
    if (!slug) {
      slug = 'category-' + Math.floor(1000 + Math.random() * 9000);
    }

    let candidate = slug;
    let count = 1;

    while (true) {
      const where = { slug: candidate };
      if (currentId) {
        where.id = { [Op.ne]: currentId };
      }

      const existing = await Category.findOne({ where });
      if (!existing) {
        return candidate;
      }

      count += 1;
      candidate = `${slug}-${count}`;
    }
  }

  /**
   * 1. Create a category (Admin only)
   * Can be top-level (parent_id: null) or a subcategory (parent_id: ID)
   */
  async createCategory(data) {
    const { name, slug, description, banner_image, thumbnail_image, status = 'active', parent_id = null, display_order = 0 } = data;

    if (parent_id) {
      const parent = await Category.findByPk(parent_id);
      if (!parent) {
        throw new AppError('Parent category not found', 404, 'PARENT_CATEGORY_NOT_FOUND');
      }
    }

    const finalSlug = slug
      ? Category.slugify(slug)
      : await this.generateUniqueSlug(name);

    // Verify slug uniqueness if manually provided
    if (slug) {
      const existing = await Category.findOne({ where: { slug: finalSlug } });
      if (existing) {
        throw new AppError('Category slug is already in use', 409, 'DUPLICATE_SLUG', [
          { field: 'slug', message: 'Slug already in use' },
        ]);
      }
    }

    const category = await Category.create({
      name: name.trim(),
      slug: finalSlug,
      description: description ? description.trim() : null,
      banner_image: banner_image ? banner_image.trim() : null,
      thumbnail_image: thumbnail_image ? thumbnail_image.trim() : null,
      status: status || 'active',
      parent_id: parent_id || null,
      display_order: display_order || 0,
    });

    return category;
  }

  /**
   * 2. List categories (Active for public, or all for admin)
   * By default returns top-level categories with their active subcategories
   */
  async getCategories({
    status = 'active',
    parent_id,
    include_subcategories = true,
    search,
    all = false,
  } = {}) {
    const where = {};

    if (!all && status) {
      where.status = status;
    }

    if (parent_id !== undefined) {
      if (parent_id === 'null' || parent_id === null) {
        where.parent_id = null;
      } else {
        where.parent_id = Number(parent_id);
      }
    } else if (!search) {
      // Default: top-level categories only when listing tree
      where.parent_id = null;
    }

    if (search) {
      where.name = { [Op.like]: `%${search.trim()}%` };
    }

    const include = [];
    if (include_subcategories) {
      include.push({
        model: Category,
        as: 'subcategories',
        where: !all ? { status: 'active' } : undefined,
        required: false,
      });
    }

    const categories = await Category.findAll({
      where,
      include,
      order: [
        ['display_order', 'ASC'],
        ['name', 'ASC'],
      ],
    });

    return categories;
  }

  /**
   * 3. Get category details by ID or Slug
   */
  async getCategoryById(identifier, { all = false } = {}) {
    const isNum = !isNaN(identifier) && !isNaN(parseFloat(identifier));
    const where = isNum ? { id: Number(identifier) } : { slug: identifier };

    if (!all) {
      where.status = 'active';
    }

    const category = await Category.findOne({
      where,
      include: [
        {
          model: Category,
          as: 'subcategories',
          where: !all ? { status: 'active' } : undefined,
          required: false,
        },
        {
          model: Category,
          as: 'parent',
          required: false,
        },
      ],
    });

    if (!category) {
      throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
    }

    return category;
  }

  /**
   * 4. Update a category (Admin only)
   */
  async updateCategory(id, data) {
    const category = await Category.findByPk(id);
    if (!category) {
      throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
    }

    // Cycle prevention: category cannot be its own parent
    if (data.parent_id !== undefined && data.parent_id !== null) {
      if (Number(data.parent_id) === Number(id)) {
        throw new AppError('Category cannot be set as its own parent', 400, 'INVALID_PARENT_ID');
      }
      const parent = await Category.findByPk(data.parent_id);
      if (!parent) {
        throw new AppError('Parent category not found', 404, 'PARENT_CATEGORY_NOT_FOUND');
      }
    }

    const updates = {};

    if (data.name !== undefined) {
      updates.name = data.name.trim();
    }

    if (data.slug !== undefined) {
      const candidateSlug = Category.slugify(data.slug);
      const existing = await Category.findOne({
        where: {
          slug: candidateSlug,
          id: { [Op.ne]: id },
        },
      });
      if (existing) {
        throw new AppError('Category slug is already in use', 409, 'DUPLICATE_SLUG', [
          { field: 'slug', message: 'Slug already in use' },
        ]);
      }
      updates.slug = candidateSlug;
    } else if (data.name && data.name !== category.name && !data.slug) {
      updates.slug = await this.generateUniqueSlug(data.name, id);
    }

    if (data.description !== undefined) {
      updates.description = data.description ? data.description.trim() : null;
    }
    if (data.banner_image !== undefined) {
      updates.banner_image = data.banner_image ? data.banner_image.trim() : null;
    }
    if (data.thumbnail_image !== undefined) {
      updates.thumbnail_image = data.thumbnail_image ? data.thumbnail_image.trim() : null;
    }
    if (data.status !== undefined) {
      updates.status = data.status;
    }
    if (data.parent_id !== undefined) {
      updates.parent_id = data.parent_id ? Number(data.parent_id) : null;
    }
    if (data.display_order !== undefined) {
      updates.display_order = Number(data.display_order);
    }

    await category.update(updates);

    return category;
  }

  /**
   * 5. Delete or safely deactivate category (Admin only)
   */
  async deleteCategory(id, { safe_deactivate = false } = {}) {
    const category = await Category.findByPk(id, {
      include: [
        {
          model: Category,
          as: 'subcategories',
          required: false,
        },
      ],
    });

    if (!category) {
      throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
    }

    if (safe_deactivate) {
      // Soft deactivate category and its subcategories
      await category.update({ status: 'inactive' });
      await Category.update(
        { status: 'inactive' },
        { where: { parent_id: category.id } }
      );
      return {
        id: category.id,
        status: 'inactive',
        message: 'Category and its subcategories safely deactivated',
      };
    }

    // Hard delete
    await category.destroy();
    return {
      id: category.id,
      deleted: true,
      message: 'Category deleted successfully',
    };
  }

  /**
   * 6. Create subcategory linked to parent :id (Admin only)
   */
  async createSubcategory(parentId, data) {
    const parent = await Category.findByPk(parentId);
    if (!parent) {
      throw new AppError('Parent category not found', 404, 'PARENT_CATEGORY_NOT_FOUND');
    }

    const finalSlug = data.slug
      ? Category.slugify(data.slug)
      : await this.generateUniqueSlug(data.name);

    if (data.slug) {
      const existing = await Category.findOne({ where: { slug: finalSlug } });
      if (existing) {
        throw new AppError('Subcategory slug is already in use', 409, 'DUPLICATE_SLUG', [
          { field: 'slug', message: 'Slug already in use' },
        ]);
      }
    }

    const subcategory = await Category.create({
      name: data.name.trim(),
      slug: finalSlug,
      description: data.description ? data.description.trim() : null,
      banner_image: data.banner_image ? data.banner_image.trim() : null,
      thumbnail_image: data.thumbnail_image ? data.thumbnail_image.trim() : null,
      status: data.status || 'active',
      parent_id: parent.id,
      display_order: data.display_order || 0,
    });

    return subcategory;
  }

  /**
   * 7. Get subcategories of a category
   */
  async getSubcategories(parentId, { all = false } = {}) {
    const parent = await Category.findByPk(parentId);
    if (!parent) {
      throw new AppError('Parent category not found', 404, 'PARENT_CATEGORY_NOT_FOUND');
    }

    const where = {
      parent_id: parent.id,
    };

    if (!all) {
      where.status = 'active';
    }

    const subcategories = await Category.findAll({
      where,
      order: [
        ['display_order', 'ASC'],
        ['name', 'ASC'],
      ],
    });

    return subcategories;
  }
}

module.exports = new CategoryService();
