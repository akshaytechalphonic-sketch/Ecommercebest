const { Banner, HeaderMenu, HeaderMenuItem, Category, sequelize } = require('../src/models');

async function addHomeLivingBanners() {
  await sequelize.authenticate();
  console.log('Connected to database.');

  // Find Home & Living category
  let homeCategory = await Category.findOne({ where: { slug: 'home-kitchen' } });
  if (!homeCategory) {
    homeCategory = await Category.findOne({ where: { name: { [sequelize.Op.like]: '%Home%' } } });
  }
  const categoryId = homeCategory ? homeCategory.id : null;
  console.log(`Using Category ID: ${categoryId} (${homeCategory?.name})`);

  // 1. Create Main Home & Living Hero Mega Banner
  const [heroBanner] = await Banner.findOrCreate({
    where: { title: 'LUXE Home & Living Festival' },
    defaults: {
      title: 'LUXE Home & Living Festival',
      subtitle: 'Up to 50% Off on Luxury Furnishings, Decor & Bedding',
      description: 'Discover curated designer furniture, ambient lighting, and artisanal home accents.',
      image_url: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1600&auto=format&fit=crop&q=80',
      mobile_image_url: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&auto=format&fit=crop&q=80',
      link_url: '/category/home-and-living',
      banner_type: 'home_hero',
      category_id: categoryId,
      position: 1,
      is_active: true,
      click_count: 0,
    },
  });
  console.log(`Hero Banner: ${heroBanner.title} (ID: ${heroBanner.id})`);

  // 2. Create Bed & Bath Promo Banner
  const [bedBathBanner] = await Banner.findOrCreate({
    where: { title: 'Premium Egyptian Cotton Bedding & Linens' },
    defaults: {
      title: 'Premium Egyptian Cotton Bedding & Linens',
      subtitle: 'Flat 40% Off on King Size Bedsheets & Comforters',
      description: 'Ultra-soft 600 thread-count cotton sheets engineered for restorative sleep.',
      image_url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1200&auto=format&fit=crop&q=80',
      mobile_image_url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&auto=format&fit=crop&q=80',
      link_url: '/category/bed-and-bath',
      banner_type: 'promo_strip',
      category_id: categoryId,
      position: 2,
      is_active: true,
      click_count: 0,
    },
  });
  console.log(`Bed & Bath Banner: ${bedBathBanner.title} (ID: ${bedBathBanner.id})`);

  // 3. Create Decor & Ambient Lighting Banner
  const [decorBanner] = await Banner.findOrCreate({
    where: { title: 'Handcrafted Decor & Warm Ambient Lights' },
    defaults: {
      title: 'Handcrafted Decor & Warm Ambient Lights',
      subtitle: 'Transform Your Spaces With Timeless Elegance',
      description: 'Aesthetic ceramic vases, scented soy candles, and statement wall art.',
      image_url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=1200&auto=format&fit=crop&q=80',
      mobile_image_url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&auto=format&fit=crop&q=80',
      link_url: '/category/decor',
      banner_type: 'sidebar',
      category_id: categoryId,
      position: 3,
      is_active: true,
      click_count: 0,
    },
  });
  console.log(`Decor Banner: ${decorBanner.title} (ID: ${decorBanner.id})`);

  // 4. Create Kitchen & Dining Banner
  const [kitchenBanner] = await Banner.findOrCreate({
    where: { title: 'Luxury Dinnerware & Ceramic Tableware' },
    defaults: {
      title: 'Luxury Dinnerware & Ceramic Tableware',
      subtitle: 'Modern Culinary Craftsmanship for Every Gathering',
      description: 'Handcrafted stoneware plates, artisanal coffee mugs, and cast iron cookware.',
      image_url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1200&auto=format&fit=crop&q=80',
      mobile_image_url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop&q=80',
      link_url: '/category/kitchen-and-dining',
      banner_type: 'home_middle',
      category_id: categoryId,
      position: 4,
      is_active: true,
      click_count: 0,
    },
  });
  console.log(`Kitchen Banner: ${kitchenBanner.title} (ID: ${kitchenBanner.id})`);

  // 5. Link Hero Banner to HeaderMenu 'HOME & LIVING'
  const homeMenu = await HeaderMenu.findOne({ where: { slug: 'home-and-living' } });
  if (homeMenu) {
    homeMenu.banner_id = heroBanner.id;
    if (categoryId) homeMenu.category_id = categoryId;
    await homeMenu.save();
    console.log(`Linked Hero Banner to HeaderMenu '${homeMenu.name}'`);
  }

  // 6. Link Submenu Banners
  const bedBathItem = await HeaderMenuItem.findOne({
    where: { slug: 'home-and-living-bed-and-bath' },
  });
  if (bedBathItem) {
    bedBathItem.banner_id = bedBathBanner.id;
    await bedBathItem.save();
    console.log(`Linked Bed & Bath Banner to Submenu '${bedBathItem.name}'`);
  }

  const decorItem = await HeaderMenuItem.findOne({
    where: { slug: 'home-and-living-decor' },
  });
  if (decorItem) {
    decorItem.banner_id = decorBanner.id;
    await decorItem.save();
    console.log(`Linked Decor Banner to Submenu '${decorItem.name}'`);
  }

  const kitchenItem = await HeaderMenuItem.findOne({
    where: { slug: 'home-and-living-kitchen-and-dining' },
  });
  if (kitchenItem) {
    kitchenItem.banner_id = kitchenBanner.id;
    await kitchenItem.save();
    console.log(`Linked Kitchen Banner to Submenu '${kitchenItem.name}'`);
  }

  console.log('\n=======================================================');
  console.log('SUCCESS: All Home & Living Banners created & linked!');
  console.log('=======================================================');
  process.exit(0);
}

addHomeLivingBanners().catch((err) => {
  console.error('Failed to add Home & Living banners:', err);
  process.exit(1);
});
