const { HeaderMenu, HeaderMenuItem, sequelize } = require('../src/models');

async function seedHeaderMenus() {
  await sequelize.authenticate();
  console.log('Connected to MySQL database.');

  // Clean existing header menus and items
  await HeaderMenuItem.destroy({ where: {}, truncate: false });
  await HeaderMenu.destroy({ where: {}, truncate: false });
  console.log('Cleared existing header menu tables.');

  const menusData = [
    {
      name: 'HOME & LIVING',
      slug: 'home-and-living',
      url: '/category/home-and-living',
      display_order: 1,
      status: 'active',
      submenus: [
        {
          name: 'Bed & Bath',
          slug: 'bed-and-bath',
          redirect_url: '/category/bed-and-bath',
          display_order: 1,
          children: [
            { name: 'Bedsheets', slug: 'bedsheets', redirect_url: '/category/bedsheets' },
            { name: 'Blankets & Quilts', slug: 'blankets-and-quilts', redirect_url: '/category/blankets-and-quilts' },
            { name: 'Pillows & Covers', slug: 'pillows-and-covers', redirect_url: '/category/pillows-and-covers' },
            { name: 'Towels', slug: 'towels', redirect_url: '/category/towels' },
          ],
        },
        {
          name: 'Decor',
          slug: 'decor',
          redirect_url: '/category/decor',
          display_order: 2,
          children: [
            { name: 'Wall Decor', slug: 'wall-decor', redirect_url: '/category/wall-decor' },
            { name: 'Candles & Aromas', slug: 'candles-and-aromas', redirect_url: '/category/candles-and-aromas' },
            { name: 'Mirrors & Clocks', slug: 'mirrors-and-clocks', redirect_url: '/category/mirrors-and-clocks' },
            { name: 'Plants & Planters', slug: 'plants-and-planters', redirect_url: '/category/plants-and-planters' },
            { name: 'Vases & Showpieces', slug: 'vases-and-showpieces', redirect_url: '/category/vases-and-showpieces' },
          ],
        },
        {
          name: 'Kitchen & Dining',
          slug: 'kitchen-and-dining',
          redirect_url: '/category/kitchen-and-dining',
          display_order: 3,
          children: [
            { name: 'Dinnerware', slug: 'dinnerware', redirect_url: '/category/dinnerware' },
            { name: 'Cups & Mugs', slug: 'cups-and-mugs', redirect_url: '/category/cups-and-mugs' },
            { name: 'Cookware', slug: 'cookware', redirect_url: '/category/cookware' },
            { name: 'Storage Jars', slug: 'storage-jars', redirect_url: '/category/storage-jars' },
          ],
        },
        {
          name: 'Lighting & Furniture',
          slug: 'lighting-and-furniture',
          redirect_url: '/category/lighting-and-furniture',
          display_order: 4,
          children: [
            { name: 'Table Lamps', slug: 'table-lamps', redirect_url: '/category/table-lamps' },
            { name: 'Floor Lamps', slug: 'floor-lamps', redirect_url: '/category/floor-lamps' },
            { name: 'String Lights', slug: 'string-lights', redirect_url: '/category/string-lights' },
            { name: 'Carpets & Rugs', slug: 'carpets-and-rugs', redirect_url: '/category/carpets-and-rugs' },
            { name: 'Cushions & Curtains', slug: 'cushions-and-curtains', redirect_url: '/category/cushions-and-curtains' },
            { name: 'Organisers', slug: 'organisers', redirect_url: '/category/organisers' },
            { name: 'Stools & Ottomans', slug: 'stools-and-ottomans', redirect_url: '/category/stools-and-ottomans' },
          ],
        },
        {
          name: 'Explore',
          slug: 'explore',
          redirect_url: '/category/home-and-living',
          display_order: 5,
          children: [
            { name: 'All Home & Living', slug: 'all-home-and-living', redirect_url: '/category/home-and-living' },
            { name: 'New Arrivals', slug: 'home-new-arrivals', redirect_url: '/category/home-new-arrivals' },
            { name: 'Sale', slug: 'home-sale', redirect_url: '/category/home-sale' },
          ],
        },
      ],
    },
    {
      name: 'WOMEN',
      slug: 'women',
      url: '/category/women',
      display_order: 2,
      status: 'active',
      submenus: [
        {
          name: 'Indian & Fusion Wear',
          slug: 'women-indian-wear',
          redirect_url: '/category/women-indian-wear',
          display_order: 1,
          children: [
            { name: 'Kurtas & Suits', slug: 'kurtas-and-suits', redirect_url: '/category/kurtas' },
            { name: 'Sarees', slug: 'sarees', redirect_url: '/category/sarees' },
            { name: 'Ethnic Dresses', slug: 'ethnic-dresses', redirect_url: '/category/ethnic-dresses' },
            { name: 'Lehengas', slug: 'lehengas', redirect_url: '/category/lehengas' },
          ],
        },
        {
          name: 'Western Wear',
          slug: 'women-western-wear',
          redirect_url: '/category/women-western-wear',
          display_order: 2,
          children: [
            { name: 'Dresses', slug: 'women-dresses', redirect_url: '/category/dresses' },
            { name: 'Tops & Shirts', slug: 'women-tops', redirect_url: '/category/tops' },
            { name: 'Jeans & Trousers', slug: 'women-jeans', redirect_url: '/category/jeans' },
            { name: 'Jackets & Coats', slug: 'women-jackets', redirect_url: '/category/jackets' },
          ],
        },
        {
          name: 'Footwear & Bags',
          slug: 'women-footwear-bags',
          redirect_url: '/category/women-footwear',
          display_order: 3,
          children: [
            { name: 'Flats & Sandals', slug: 'women-flats', redirect_url: '/category/flats' },
            { name: 'Heels', slug: 'women-heels', redirect_url: '/category/heels' },
            { name: 'Handbags', slug: 'handbags', redirect_url: '/category/handbags' },
            { name: 'Totes & Clutches', slug: 'clutches', redirect_url: '/category/clutches' },
          ],
        },
      ],
    },
    {
      name: 'MEN',
      slug: 'men',
      url: '/category/men',
      display_order: 3,
      status: 'active',
      submenus: [
        {
          name: 'Topwear',
          slug: 'men-topwear',
          redirect_url: '/category/men-topwear',
          display_order: 1,
          children: [
            { name: 'T-Shirts', slug: 'men-t-shirts', redirect_url: '/category/t-shirts' },
            { name: 'Casual Shirts', slug: 'men-casual-shirts', redirect_url: '/category/casual-shirts' },
            { name: 'Formal Shirts', slug: 'men-formal-shirts', redirect_url: '/category/formal-shirts' },
            { name: 'Jackets & Sweaters', slug: 'men-jackets', redirect_url: '/category/jackets' },
          ],
        },
        {
          name: 'Bottomwear',
          slug: 'men-bottomwear',
          redirect_url: '/category/men-bottomwear',
          display_order: 2,
          children: [
            { name: 'Jeans', slug: 'men-jeans', redirect_url: '/category/jeans' },
            { name: 'Casual Trousers', slug: 'men-trousers', redirect_url: '/category/trousers' },
            { name: 'Shorts & Track Pants', slug: 'men-shorts', redirect_url: '/category/shorts' },
          ],
        },
        {
          name: 'Footwear',
          slug: 'men-footwear',
          redirect_url: '/category/men-footwear',
          display_order: 3,
          children: [
            { name: 'Casual Shoes', slug: 'men-casual-shoes', redirect_url: '/category/casual-shoes' },
            { name: 'Formal Shoes', slug: 'men-formal-shoes', redirect_url: '/category/formal-shoes' },
            { name: 'Sneakers', slug: 'men-sneakers', redirect_url: '/category/sneakers' },
          ],
        },
      ],
    },
    {
      name: 'KIDS',
      slug: 'kids',
      url: '/category/kids',
      display_order: 4,
      status: 'active',
      submenus: [
        {
          name: 'Boys Clothing',
          slug: 'boys-clothing',
          redirect_url: '/category/boys-clothing',
          display_order: 1,
          children: [
            { name: 'T-Shirts & Shirts', slug: 'boys-tshirts', redirect_url: '/category/boys-tshirts' },
            { name: 'Jeans & Trousers', slug: 'boys-jeans', redirect_url: '/category/boys-jeans' },
            { name: 'Ethnic Wear', slug: 'boys-ethnic', redirect_url: '/category/boys-ethnic' },
          ],
        },
        {
          name: 'Girls Clothing',
          slug: 'girls-clothing',
          redirect_url: '/category/girls-clothing',
          display_order: 2,
          children: [
            { name: 'Dresses & Frocks', slug: 'girls-dresses', redirect_url: '/category/girls-dresses' },
            { name: 'Tops & T-Shirts', slug: 'girls-tops', redirect_url: '/category/girls-tops' },
            { name: 'Lehengas & Sarees', slug: 'girls-ethnic', redirect_url: '/category/girls-ethnic' },
          ],
        },
        {
          name: 'Baby Care & Toys',
          slug: 'baby-care-toys',
          redirect_url: '/category/toys',
          display_order: 3,
          children: [
            { name: 'Soft Toys', slug: 'soft-toys', redirect_url: '/category/soft-toys' },
            { name: 'Learning Toys', slug: 'learning-toys', redirect_url: '/category/learning-toys' },
          ],
        },
      ],
    },
    {
      name: 'JEWELLERY',
      slug: 'jewellery',
      url: '/category/jewellery',
      display_order: 5,
      status: 'active',
      submenus: [
        {
          name: 'Fine Jewellery',
          slug: 'fine-jewellery',
          redirect_url: '/category/fine-jewellery',
          display_order: 1,
          children: [
            { name: 'Necklaces & Pendants', slug: 'necklaces', redirect_url: '/category/necklaces' },
            { name: 'Earrings', slug: 'earrings', redirect_url: '/category/earrings' },
            { name: 'Rings', slug: 'rings', redirect_url: '/category/rings' },
            { name: 'Bangles & Bracelets', slug: 'bracelets', redirect_url: '/category/bracelets' },
          ],
        },
        {
          name: 'Fashion Jewellery',
          slug: 'fashion-jewellery',
          redirect_url: '/category/fashion-jewellery',
          display_order: 2,
          children: [
            { name: 'Chokers & Sets', slug: 'chokers', redirect_url: '/category/chokers' },
            { name: 'Anklets', slug: 'anklets', redirect_url: '/category/anklets' },
            { name: 'Nosepins', slug: 'nosepins', redirect_url: '/category/nosepins' },
          ],
        },
      ],
    },
    {
      name: 'NEW IN',
      slug: 'new-in',
      url: '/category/new-in',
      display_order: 6,
      status: 'active',
      submenus: [
        {
          name: 'Trending Drops',
          slug: 'trending-drops',
          redirect_url: '/category/trending',
          display_order: 1,
          children: [
            { name: 'This Week Arrivals', slug: 'this-week-arrivals', redirect_url: '/category/this-week' },
            { name: 'Best of Season', slug: 'best-of-season', redirect_url: '/category/best-of-season' },
            { name: 'Editor Picks', slug: 'editor-picks', redirect_url: '/category/editor-picks' },
          ],
        },
      ],
    },
    {
      name: 'SALE',
      slug: 'sale',
      url: '/sale',
      display_order: 7,
      status: 'active',
      submenus: [
        {
          name: 'Special Offers',
          slug: 'special-offers',
          redirect_url: '/sale',
          display_order: 1,
          children: [
            { name: 'Up to 50% Off', slug: 'up-to-50-off', redirect_url: '/sale/50-off' },
            { name: 'Flat 70% Clearance', slug: 'flat-70-clearance', redirect_url: '/sale/clearance' },
            { name: 'Buy 1 Get 1 Free', slug: 'bogo-offers', redirect_url: '/sale/bogo' },
          ],
        },
      ],
    },
  ];

  for (const menuData of menusData) {
    const { submenus, ...menuFields } = menuData;
    const menu = await HeaderMenu.create(menuFields);
    console.log(`Created Header Menu: ${menu.name} (ID: ${menu.id})`);

    if (submenus && submenus.length) {
      for (let sIdx = 0; sIdx < submenus.length; sIdx++) {
        const sub = submenus[sIdx];
        const { children, ...subFields } = sub;
        const level1Item = await HeaderMenuItem.create({
          parent_menu_id: menu.id,
          parent_id: null,
          name: subFields.name,
          slug: `${menu.slug}-${subFields.slug}`,
          redirect_url: subFields.redirect_url,
          display_order: subFields.display_order || sIdx + 1,
          is_active: true,
        });

        if (children && children.length) {
          for (let cIdx = 0; cIdx < children.length; cIdx++) {
            const child = children[cIdx];
            await HeaderMenuItem.create({
              parent_menu_id: menu.id,
              parent_id: level1Item.id,
              name: child.name,
              slug: `${menu.slug}-${subFields.slug}-${child.slug}`,
              redirect_url: child.redirect_url,
              display_order: cIdx + 1,
              is_active: true,
            });
          }
        }
      }
    }
  }

  console.log('Successfully seeded all header menus and submenus!');
  process.exit(0);
}

seedHeaderMenus().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});

