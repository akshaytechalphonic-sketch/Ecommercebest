const { HeaderMenu, Banner, sequelize } = require('../src/models');

const MENU_BANNERS = [
  {
    menuSlug: 'women',
    banner: {
      title: "LUXE Women's Autumn Couture",
      subtitle: "Exclusive Designer Wear, Silks, Sarees & Contemporary Classics",
      image_url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=80',
      destination_url: '/category/women',
      banner_type: 'home_hero',
      status: 'active',
      display_order: 2,
    },
  },
  {
    menuSlug: 'men',
    banner: {
      title: "LUXE Men's Bespoke Collection",
      subtitle: "Tailored Suits, Luxury Casuals, Leather Footwear & Handcrafted Timepieces",
      image_url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1600&q=80',
      destination_url: '/category/men',
      banner_type: 'home_hero',
      status: 'active',
      display_order: 3,
    },
  },
  {
    menuSlug: 'kids',
    banner: {
      title: "LUXE Junior Wonder World",
      subtitle: "Playful Outfits, Organic Cotton Comforts, Footwear & Designer Toys",
      image_url: 'https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?auto=format&fit=crop&w=1600&q=80',
      destination_url: '/category/kids',
      banner_type: 'home_hero',
      status: 'active',
      display_order: 4,
    },
  },
  {
    menuSlug: 'jewellery',
    banner: {
      title: "Royal Heritage Fine Jewellery",
      subtitle: "22K Certified Hallmarked Gold, Solitaire Diamonds & Handcrafted Gemstones",
      image_url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1600&q=80',
      destination_url: '/category/jewellery',
      banner_type: 'home_hero',
      status: 'active',
      display_order: 5,
    },
  },
  {
    menuSlug: 'new-in',
    banner: {
      title: "The Fresh Horizon 2026 Drops",
      subtitle: "Be The First To Own This Season's Runway Curations & Handpicked Exclusives",
      image_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=80',
      destination_url: '/category/new-in',
      banner_type: 'home_hero',
      status: 'active',
      display_order: 6,
    },
  },
  {
    menuSlug: 'sale',
    banner: {
      title: "The Grand End-of-Season Luxe Sale",
      subtitle: "Up to 60% Off Across Top Designer Brands & Curated Labels",
      image_url: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=1600&q=80',
      destination_url: '/category/sale',
      banner_type: 'home_hero',
      status: 'active',
      display_order: 7,
    },
  },
];

async function seedAllBanners() {
  console.log('--- Seeding Banners for All Header Menus ---');
  for (const item of MENU_BANNERS) {
    const menu = await HeaderMenu.findOne({ where: { slug: item.menuSlug } });
    if (!menu) {
      console.log(`Menu with slug "${item.menuSlug}" not found, skipping.`);
      continue;
    }

    // Check if banner already exists
    let banner = await Banner.findOne({ where: { title: item.banner.title } });
    if (!banner) {
      banner = await Banner.create(item.banner);
      console.log(`Created banner "${banner.title}" (ID: ${banner.id})`);
    } else {
      await banner.update(item.banner);
      console.log(`Updated banner "${banner.title}" (ID: ${banner.id})`);
    }

    // Link banner to header menu
    await menu.update({ banner_id: banner.id });
    console.log(`Linked banner ${banner.id} to HeaderMenu "${menu.name}"`);
  }

  console.log('--- All Header Menus now have linked HD Promotional Banners! ---');
  process.exit(0);
}

seedAllBanners().catch((err) => {
  console.error('Failed to seed banners:', err);
  process.exit(1);
});
