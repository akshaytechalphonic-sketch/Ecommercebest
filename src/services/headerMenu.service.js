const { HeaderMenu, HeaderMenuItem, Banner, Category, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * Recursively assemble a flat list of menu items into a nested tree
 * based on parent_id.
 */
function buildItemTree(items, parentId = null) {
  const result = [];
  for (const item of items) {
    const rawItem = typeof item.toJSON === 'function' ? item.toJSON() : { ...item };
    const currentParentId = rawItem.parent_id === null || rawItem.parent_id === undefined ? null : Number(rawItem.parent_id);
    const targetParentId = parentId === null ? null : Number(parentId);

    if (currentParentId === targetParentId) {
      const children = buildItemTree(items, rawItem.id);
      rawItem.children = children;
      result.push(rawItem);
    }
  }
  return result.sort((a, b) => (a.display_order || 0) - (b.display_order || 0) || a.id - b.id);
}

class HeaderMenuService {
  /**
   * 1. Admin: Create a new Header Menu
   */
  async createHeaderMenu(data) {
    const slug = data.slug
      ? HeaderMenu.slugify(data.slug)
      : HeaderMenu.slugify(data.name);

    // Check slug uniqueness
    const existing = await HeaderMenu.findOne({ where: { slug } });
    if (existing) {
      const error = new Error(`Header menu with slug '${slug}' already exists.`);
      error.statusCode = 409;
      throw error;
    }

    if (data.category_id) {
      const category = await Category.findByPk(data.category_id);
      if (!category) {
        const error = new Error(`Category with ID ${data.category_id} not found.`);
        error.statusCode = 404;
        throw error;
      }
    }

    if (data.banner_id) {
      const banner = await Banner.findByPk(data.banner_id);
      if (!banner) {
        const error = new Error(`Banner with ID ${data.banner_id} not found.`);
        error.statusCode = 404;
        throw error;
      }
    }

    const menu = await HeaderMenu.create({
      name: data.name,
      slug,
      url: data.url || null,
      icon: data.icon || null,
      image: data.image || null,
      status: data.status || 'active',
      display_order: data.display_order !== undefined ? data.display_order : 0,
      banner_id: data.banner_id || null,
      category_id: data.category_id || null,
    });

    return await this.getHeaderMenuById(menu.id);
  }

  /**
   * 2. Admin: Get all Header Menus with nested items and banners
   */
  async getAllAdminHeaderMenus() {
    const menus = await HeaderMenu.findAll({
      order: [
        ['display_order', 'ASC'],
        ['id', 'ASC'],
      ],
      include: [
        {
          model: Banner,
          as: 'banner',
          attributes: ['id', 'title', 'image_url', 'link_url', 'banner_type', 'is_active'],
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug', 'status'],
        },
      ],
    });

    const allItems = await HeaderMenuItem.findAll({
      order: [
        ['display_order', 'ASC'],
        ['id', 'ASC'],
      ],
      include: [
        {
          model: Banner,
          as: 'banner',
          attributes: ['id', 'title', 'image_url', 'link_url', 'banner_type', 'is_active'],
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug', 'status'],
        },
      ],
    });

    // Group items by menu
    const itemsByMenuId = new Map();
    for (const item of allItems) {
      const menuId = item.parent_menu_id;
      if (!itemsByMenuId.has(menuId)) {
        itemsByMenuId.set(menuId, []);
      }
      itemsByMenuId.get(menuId).push(item);
    }

    return menus.map((menu) => {
      const rawMenu = menu.toJSON();
      const menuItems = itemsByMenuId.get(menu.id) || [];
      rawMenu.items = buildItemTree(menuItems, null);
      return rawMenu;
    });
  }

  /**
   * 3. Admin: Get individual Header Menu by ID
   */
  async getHeaderMenuById(id) {
    const menu = await HeaderMenu.findByPk(id, {
      include: [
        {
          model: Banner,
          as: 'banner',
          attributes: ['id', 'title', 'subtitle', 'image_url', 'link_url', 'banner_type', 'is_active'],
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug', 'status'],
        },
      ],
    });

    if (!menu) {
      const error = new Error(`Header menu with ID ${id} not found.`);
      error.statusCode = 404;
      throw error;
    }

    const items = await HeaderMenuItem.findAll({
      where: { parent_menu_id: id },
      order: [
        ['display_order', 'ASC'],
        ['id', 'ASC'],
      ],
      include: [
        {
          model: Banner,
          as: 'banner',
          attributes: ['id', 'title', 'image_url', 'link_url', 'banner_type', 'is_active'],
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug', 'status'],
        },
      ],
    });

    const rawMenu = menu.toJSON();
    rawMenu.items = buildItemTree(items, null);
    return rawMenu;
  }

  /**
   * 4. Admin: Update Header Menu
   */
  async updateHeaderMenu(id, data) {
    const menu = await HeaderMenu.findByPk(id);
    if (!menu) {
      const error = new Error(`Header menu with ID ${id} not found.`);
      error.statusCode = 404;
      throw error;
    }

    if (data.slug) {
      const newSlug = HeaderMenu.slugify(data.slug);
      if (newSlug !== menu.slug) {
        const existing = await HeaderMenu.findOne({
          where: { slug: newSlug, id: { [Op.ne]: id } },
        });
        if (existing) {
          const error = new Error(`Header menu with slug '${newSlug}' already exists.`);
          error.statusCode = 409;
          throw error;
        }
        menu.slug = newSlug;
      }
    } else if (data.name && data.slug === undefined) {
      // Optional: keep current slug or update if name changed
    }

    if (data.name !== undefined) menu.name = data.name;
    if (data.url !== undefined) menu.url = data.url;
    if (data.icon !== undefined) menu.icon = data.icon;
    if (data.image !== undefined) menu.image = data.image;
    if (data.status !== undefined) menu.status = data.status;
    if (data.display_order !== undefined) menu.display_order = data.display_order;

    if (data.category_id !== undefined) {
      if (data.category_id) {
        const cat = await Category.findByPk(data.category_id);
        if (!cat) {
          const error = new Error(`Category with ID ${data.category_id} not found.`);
          error.statusCode = 404;
          throw error;
        }
        menu.category_id = data.category_id;
      } else {
        menu.category_id = null;
      }
    }

    if (data.banner_id !== undefined) {
      if (data.banner_id) {
        const ban = await Banner.findByPk(data.banner_id);
        if (!ban) {
          const error = new Error(`Banner with ID ${data.banner_id} not found.`);
          error.statusCode = 404;
          throw error;
        }
        menu.banner_id = data.banner_id;
      } else {
        menu.banner_id = null;
      }
    }

    await menu.save();
    return await this.getHeaderMenuById(id);
  }

  /**
   * 5. Admin: Delete Header Menu (and cascade delete items)
   */
  async deleteHeaderMenu(id) {
    const menu = await HeaderMenu.findByPk(id);
    if (!menu) {
      const error = new Error(`Header menu with ID ${id} not found.`);
      error.statusCode = 404;
      throw error;
    }

    // Unlink self-referencing parent_id first to prevent MySQL foreign key cycle errors
    await HeaderMenuItem.update(
      { parent_id: null },
      { where: { parent_menu_id: id } }
    );
    await HeaderMenuItem.destroy({ where: { parent_menu_id: id } });
    await menu.destroy();

    return {
      success: true,
      message: `Header menu '${menu.name}' and all associated submenus deleted successfully.`,
    };
  }

  /**
   * 6. Admin: Toggle Header Menu Status (active / inactive)
   */
  async updateHeaderMenuStatus(id, { status, is_active }) {
    const menu = await HeaderMenu.findByPk(id);
    if (!menu) {
      const error = new Error(`Header menu with ID ${id} not found.`);
      error.statusCode = 404;
      throw error;
    }

    if (status !== undefined) {
      menu.status = status;
    } else if (is_active !== undefined) {
      menu.status = is_active ? 'active' : 'inactive';
    }

    await menu.save();
    return await this.getHeaderMenuById(id);
  }

  /**
   * 7. Admin: Reorder multiple Header Menus
   */
  async reorderHeaderMenus(items) {
    const itemsList = Array.isArray(items) ? items : items?.items || [];
    if (!itemsList.length) {
      const error = new Error('Reorder list must contain at least one item.');
      error.statusCode = 400;
      throw error;
    }

    for (const item of itemsList) {
      if (item.id && item.display_order !== undefined) {
        await HeaderMenu.update(
          { display_order: item.display_order },
          { where: { id: item.id } }
        );
      }
    }

    return await this.getAllAdminHeaderMenus();
  }

  /**
   * 8. Admin: Create Submenu Item for Header Menu
   */
  async createHeaderMenuItem(menuId, data) {
    const menu = await HeaderMenu.findByPk(menuId);
    if (!menu) {
      const error = new Error(`Header menu with ID ${menuId} not found.`);
      error.statusCode = 404;
      throw error;
    }

    if (data.parent_id) {
      const parentItem = await HeaderMenuItem.findOne({
        where: { id: data.parent_id, parent_menu_id: menuId },
      });
      if (!parentItem) {
        const error = new Error(
          `Parent submenu item with ID ${data.parent_id} not found under menu ID ${menuId}.`
        );
        error.statusCode = 404;
        throw error;
      }
    }

    if (data.category_id) {
      const category = await Category.findByPk(data.category_id);
      if (!category) {
        const error = new Error(`Category with ID ${data.category_id} not found.`);
        error.statusCode = 404;
        throw error;
      }
    }

    if (data.banner_id) {
      const banner = await Banner.findByPk(data.banner_id);
      if (!banner) {
        const error = new Error(`Banner with ID ${data.banner_id} not found.`);
        error.statusCode = 404;
        throw error;
      }
    }

    const slug = data.slug
      ? HeaderMenuItem.slugify(data.slug)
      : HeaderMenuItem.slugify(data.name);

    const item = await HeaderMenuItem.create({
      parent_menu_id: menuId,
      parent_id: data.parent_id || null,
      name: data.name,
      slug,
      category_id: data.category_id || null,
      redirect_url: data.redirect_url || null,
      image: data.image || null,
      display_order: data.display_order !== undefined ? data.display_order : 0,
      is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
      banner_id: data.banner_id || null,
    });

    return await HeaderMenuItem.findByPk(item.id, {
      include: [
        {
          model: Banner,
          as: 'banner',
          attributes: ['id', 'title', 'image_url', 'link_url', 'banner_type', 'is_active'],
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug', 'status'],
        },
      ],
    });
  }

  /**
   * 9. Admin: Get all items of a Header Menu
   */
  async getHeaderMenuItems(menuId) {
    const menu = await HeaderMenu.findByPk(menuId);
    if (!menu) {
      const error = new Error(`Header menu with ID ${menuId} not found.`);
      error.statusCode = 404;
      throw error;
    }

    const items = await HeaderMenuItem.findAll({
      where: { parent_menu_id: menuId },
      order: [
        ['display_order', 'ASC'],
        ['id', 'ASC'],
      ],
      include: [
        {
          model: Banner,
          as: 'banner',
          attributes: ['id', 'title', 'image_url', 'link_url', 'banner_type', 'is_active'],
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug', 'status'],
        },
      ],
    });

    return buildItemTree(items, null);
  }

  /**
   * 10. Admin: Update Submenu Item
   */
  async updateHeaderMenuItem(itemId, data) {
    const item = await HeaderMenuItem.findByPk(itemId);
    if (!item) {
      const error = new Error(`Header menu item with ID ${itemId} not found.`);
      error.statusCode = 404;
      throw error;
    }

    if (data.parent_id !== undefined) {
      if (data.parent_id) {
        if (Number(data.parent_id) === Number(itemId)) {
          const error = new Error('A menu item cannot be its own parent.');
          error.statusCode = 400;
          throw error;
        }
        const parentItem = await HeaderMenuItem.findOne({
          where: { id: data.parent_id, parent_menu_id: item.parent_menu_id },
        });
        if (!parentItem) {
          const error = new Error(`Parent submenu item with ID ${data.parent_id} not found.`);
          error.statusCode = 404;
          throw error;
        }
        item.parent_id = data.parent_id;
      } else {
        item.parent_id = null;
      }
    }

    if (data.name !== undefined) item.name = data.name;
    if (data.slug !== undefined) item.slug = HeaderMenuItem.slugify(data.slug);
    if (data.redirect_url !== undefined) item.redirect_url = data.redirect_url;
    if (data.image !== undefined) item.image = data.image;
    if (data.display_order !== undefined) item.display_order = data.display_order;
    if (data.is_active !== undefined) item.is_active = Boolean(data.is_active);

    if (data.category_id !== undefined) {
      if (data.category_id) {
        const cat = await Category.findByPk(data.category_id);
        if (!cat) {
          const error = new Error(`Category with ID ${data.category_id} not found.`);
          error.statusCode = 404;
          throw error;
        }
        item.category_id = data.category_id;
      } else {
        item.category_id = null;
      }
    }

    if (data.banner_id !== undefined) {
      if (data.banner_id) {
        const ban = await Banner.findByPk(data.banner_id);
        if (!ban) {
          const error = new Error(`Banner with ID ${data.banner_id} not found.`);
          error.statusCode = 404;
          throw error;
        }
        item.banner_id = data.banner_id;
      } else {
        item.banner_id = null;
      }
    }

    await item.save();

    return await HeaderMenuItem.findByPk(itemId, {
      include: [
        {
          model: Banner,
          as: 'banner',
          attributes: ['id', 'title', 'image_url', 'link_url', 'banner_type', 'is_active'],
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug', 'status'],
        },
      ],
    });
  }

  /**
   * 11. Admin: Delete Submenu Item
   */
  async deleteHeaderMenuItem(itemId) {
    const item = await HeaderMenuItem.findByPk(itemId);
    if (!item) {
      const error = new Error(`Header menu item with ID ${itemId} not found.`);
      error.statusCode = 404;
      throw error;
    }

    // Unlink children first to prevent self-referencing foreign key constraint failures
    await HeaderMenuItem.update(
      { parent_id: null },
      { where: { parent_id: itemId } }
    );
    await HeaderMenuItem.destroy({ where: { parent_id: itemId } });
    await item.destroy();

    return {
      success: true,
      message: `Header menu item '${item.name}' deleted successfully.`,
    };
  }

  /**
   * 12. Public Storefront: Get All Active Menus, Submenus & Active Banners
   */
  async getStorefrontHeaderMenu() {
    // 1. Fetch only active header menus
    const menus = await HeaderMenu.findAll({
      where: { status: 'active' },
      order: [
        ['display_order', 'ASC'],
        ['id', 'ASC'],
      ],
      include: [
        {
          model: Banner,
          as: 'banner',
          where: { is_active: true },
          required: false,
          attributes: ['id', 'title', 'subtitle', 'image_url', 'link_url', 'banner_type'],
        },
        {
          model: Category,
          as: 'category',
          where: { status: 'active' },
          required: false,
          attributes: ['id', 'name', 'slug'],
        },
      ],
    });

    if (!menus.length) {
      return [];
    }

    const menuIds = menus.map((m) => m.id);

    // 2. Fetch only active menu items for these active menus
    const items = await HeaderMenuItem.findAll({
      where: {
        parent_menu_id: { [Op.in]: menuIds },
        is_active: true,
      },
      order: [
        ['display_order', 'ASC'],
        ['id', 'ASC'],
      ],
      include: [
        {
          model: Banner,
          as: 'banner',
          where: { is_active: true },
          required: false,
          attributes: ['id', 'title', 'subtitle', 'image_url', 'link_url', 'banner_type'],
        },
        {
          model: Category,
          as: 'category',
          where: { status: 'active' },
          required: false,
          attributes: ['id', 'name', 'slug'],
        },
      ],
    });

    // Group items by menu
    const itemsByMenuId = new Map();
    for (const item of items) {
      const menuId = item.parent_menu_id;
      if (!itemsByMenuId.has(menuId)) {
        itemsByMenuId.set(menuId, []);
      }
      itemsByMenuId.get(menuId).push(item);
    }

    return menus.map((menu) => {
      const rawMenu = menu.toJSON();
      const menuItems = itemsByMenuId.get(menu.id) || [];
      rawMenu.items = buildItemTree(menuItems, null);
      return rawMenu;
    });
  }
}

module.exports = new HeaderMenuService();
