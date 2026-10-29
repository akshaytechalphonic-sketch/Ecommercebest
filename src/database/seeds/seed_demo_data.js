require('dotenv').config();
const {
  sequelize,
  User,
  Vendor,
  Category,
  Product,
  Cart,
  CartItem,
  Wishlist,
  InventoryLog,
} = require('../../models');

async function seedDemoData() {
  console.log('========================================================');
  console.log('   SEEDING RICH MARKETPLACE DEMO DATA (PRODUCTS, CARTS, ');
  console.log('   WISHLISTS, INVENTORY & CATEGORIES)                   ');
  console.log('========================================================');

  await sequelize.authenticate();
  console.log('Database connected.');

  // 1. Fetch or Ensure Users
  console.log('\n--- 1. Users Setup ---');
  let admin = await User.findOne({ where: { email: 'admin@gmail.com' } });
  if (!admin) {
    admin = await User.findOne({ where: { role: 'admin' } });
  }

  const demoCustomer = await User.findOne({ where: { email: 'democustomer@example.com' } });
  const amanCustomer = await User.findOne({ where: { email: 'aman@example.com' } });
  const testCustomer = await User.findOne({ where: { email: 'testuser@example.com' } });

  console.log(`Admin ID: ${admin?.id}, Customers: ${demoCustomer?.id}, ${amanCustomer?.id}, ${testCustomer?.id}`);

  // 2. Setup Approved Vendors
  console.log('\n--- 2. Vendors Setup ---');
  let vendorTech = await Vendor.findOne({ where: { store_slug: 'tech-haven-store' } });
  if (vendorTech) {
    vendorTech.status = 'approved';
    await vendorTech.save();
  }

  let vendorGrocery = await Vendor.findOne({ where: { user_id: 332 } });
  if (vendorGrocery) {
    vendorGrocery.store_name = 'Swati Grocery & Fresh Mart';
    vendorGrocery.store_slug = 'swati-grocery-fresh-mart';
    vendorGrocery.status = 'approved';
    await vendorGrocery.save();
  }

  let vendorFashion = await Vendor.findOne({ where: { user_id: 341 } });
  if (vendorFashion) {
    vendorFashion.store_name = 'Urban Trends Apparel & Co';
    vendorFashion.store_slug = 'urban-trends-apparel';
    vendorFashion.status = 'approved';
    await vendorFashion.save();
  } else {
    let [vf] = await Vendor.findOrCreate({
      where: { store_slug: 'urban-trends-apparel' },
      defaults: {
        user_id: 341,
        store_name: 'Urban Trends Apparel & Co',
        store_slug: 'urban-trends-apparel',
        store_email: 'urban.trends@example.com',
        store_phone: '+919876500001',
        status: 'approved',
      },
    });
    vendorFashion = vf;
  }

  console.log(`Vendors active: Tech (${vendorTech?.id}), Grocery (${vendorGrocery?.id}), Fashion (${vendorFashion?.id})`);

  // 3. Setup Categories & Subcategories
  console.log('\n--- 3. Categories & Subcategories Setup ---');
  // Electronics
  let [catElectronics] = await Category.findOrCreate({
    where: { slug: 'electronics' },
    defaults: {
      name: 'Electronics & Gadgets',
      slug: 'electronics',
      description: 'Cutting edge consumer electronics, laptops, wearables and smart tech accessories',
      banner_image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&auto=format&fit=crop&q=80',
      thumbnail_image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&auto=format&fit=crop&q=80',
      status: 'active',
      display_order: 1,
    },
  });

  let [subLaptops] = await Category.findOrCreate({
    where: { slug: 'laptops-computers' },
    defaults: {
      parent_id: catElectronics.id,
      name: 'Laptops & Computers',
      slug: 'laptops-computers',
      status: 'active',
      display_order: 1,
    },
  });

  let [subAudio] = await Category.findOrCreate({
    where: { slug: 'audio-headphones' },
    defaults: {
      parent_id: catElectronics.id,
      name: 'Audio & Wireless Headphones',
      slug: 'audio-headphones',
      status: 'active',
      display_order: 2,
    },
  });

  let [subWearables] = await Category.findOrCreate({
    where: { slug: 'smart-wearables' },
    defaults: {
      parent_id: catElectronics.id,
      name: 'Smart Watches & Wearables',
      slug: 'smart-wearables',
      status: 'active',
      display_order: 3,
    },
  });

  // Fashion
  let catFashion = await Category.findOne({ where: { slug: 'fashion' } });
  if (!catFashion) {
    catFashion = await Category.create({
      name: 'Fashion & Apparel',
      slug: 'fashion',
      description: 'Designer clothing, premium footwear, and timeless accessories',
      banner_image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80',
      thumbnail_image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&auto=format&fit=crop&q=80',
      status: 'active',
      display_order: 2,
    });
  }

  let [subMenFashion] = await Category.findOrCreate({
    where: { slug: 'mens-apparel' },
    defaults: {
      parent_id: catFashion.id,
      name: 'Men Premium Apparel',
      slug: 'mens-apparel',
      status: 'active',
      display_order: 1,
    },
  });

  // Grocery & Home
  let [catHome] = await Category.findOrCreate({
    where: { slug: 'home-kitchen' },
    defaults: {
      name: 'Home, Living & Gourmet',
      slug: 'home-kitchen',
      description: 'Gourmet organic pantry items, smart home appliances, and decor',
      banner_image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1200&auto=format&fit=crop&q=80',
      thumbnail_image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=400&auto=format&fit=crop&q=80',
      status: 'active',
      display_order: 3,
    },
  });

  console.log('Categories & Subcategories ready.');

  // 4. Products Creation
  console.log('\n--- 4. Products Creation & Seeding ---');
  const demoProducts = [
    {
      vendor_id: vendorTech?.id || 120,
      category_id: catElectronics.id,
      subcategory_id: subAudio.id,
      name: 'Sony WH-1000XM5 Noise Cancelling Headphones',
      slug: 'sony-wh-1000xm5-noise-cancelling-headphones',
      sku: 'TECH-SONY-XM5',
      price: 29990.0,
      discount_price: 24990.0,
      stock: 35,
      low_stock_threshold: 5,
      status: 'active',
      approval_status: 'approved',
      description: 'Industry-leading noise cancellation with two processors and 8 microphones for exceptional call clarity and immersive hi-res audio.',
      images: [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80',
      ],
    },
    {
      vendor_id: vendorTech?.id || 120,
      category_id: catElectronics.id,
      subcategory_id: subLaptops.id,
      name: 'MacBook Air M2 16GB 512GB Space Grey',
      slug: 'macbook-air-m2-16gb-512gb-space-grey',
      sku: 'TECH-MBA-M2-16',
      price: 119900.0,
      discount_price: 107900.0,
      stock: 14,
      low_stock_threshold: 4,
      status: 'active',
      approval_status: 'approved',
      description: 'Stunningly thin design with fast Apple M2 silicon, 13.6-inch Liquid Retina display, MagSafe 3 charging port and 18-hour all-day battery life.',
      images: [
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80',
      ],
    },
    {
      vendor_id: vendorTech?.id || 120,
      category_id: catElectronics.id,
      subcategory_id: subLaptops.id,
      name: 'Logitech MX Master 3S Wireless Performance Mouse',
      slug: 'logitech-mx-master-3s-performance-mouse',
      sku: 'TECH-LOGI-MX3S',
      price: 9995.0,
      discount_price: 8495.0,
      stock: 3, // LOW STOCK
      low_stock_threshold: 5,
      status: 'active',
      approval_status: 'approved',
      description: 'Ergonomic wireless mouse with Quiet Clicks, 8,000 DPI track-on-glass sensor, and ultrafast MagSpeed electromagnetic scroll wheel.',
      images: [
        'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&auto=format&fit=crop&q=80',
      ],
    },
    {
      vendor_id: vendorTech?.id || 120,
      category_id: catElectronics.id,
      subcategory_id: subWearables.id,
      name: 'Apple Watch Series 9 GPS 45mm Midnight',
      slug: 'apple-watch-series-9-gps-45mm-midnight',
      sku: 'TECH-AW9-45-MID',
      price: 44900.0,
      discount_price: 39900.0,
      stock: 0, // OUT OF STOCK
      low_stock_threshold: 5,
      status: 'active',
      approval_status: 'approved',
      description: 'Advanced health sensors, Double Tap gesture, brighter edge-to-edge Always-On display, and Precision Finding for iPhone.',
      images: [
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
      ],
    },
    {
      vendor_id: vendorGrocery?.id || vendorTech?.id,
      category_id: catHome.id,
      subcategory_id: null,
      name: 'Organic Kashmiri Walnut Kernels Vacuum Sealed 1kg',
      slug: 'organic-kashmiri-walnut-kernels-1kg',
      sku: 'GROC-WALNUT-1KG',
      price: 1800.0,
      discount_price: 1450.0,
      stock: 85,
      low_stock_threshold: 10,
      status: 'active',
      approval_status: 'approved',
      description: 'Handpicked Grade-A raw walnut halves grown in high-altitude Kashmiri orchards. Zero additives, pure crunch, and packed with Omega-3.',
      images: [
        'https://images.unsplash.com/photo-1557089851-f7035bf4041b?w=800&auto=format&fit=crop&q=80',
      ],
    },
    {
      vendor_id: vendorGrocery?.id || vendorTech?.id,
      category_id: catHome.id,
      subcategory_id: null,
      name: 'Cold Pressed Extra Virgin Spanish Olive Oil 1L',
      slug: 'cold-pressed-extra-virgin-olive-oil-1l',
      sku: 'GROC-OLIVEOIL-1L',
      price: 1499.0,
      discount_price: 1199.0,
      stock: 22,
      low_stock_threshold: 6,
      status: 'active',
      approval_status: 'approved',
      description: 'First cold pressed unfiltered extra virgin olive oil made from single-estate Picual olives with low acidity and robust fruity aroma.',
      images: [
        'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&auto=format&fit=crop&q=80',
      ],
    },
    {
      vendor_id: vendorFashion?.id || vendorTech?.id,
      category_id: catFashion.id,
      subcategory_id: subMenFashion.id,
      name: 'Men Tailored Slim Fit Linen Casual Blazer',
      slug: 'men-tailored-slim-fit-linen-blazer',
      sku: 'FASH-BLAZER-SLIM',
      price: 4999.0,
      discount_price: 3799.0,
      stock: 18,
      low_stock_threshold: 4,
      status: 'active',
      approval_status: 'approved',
      description: 'Crafted from breathable pure European flax linen. Notch lapel, two-button closure, and lightweight half-canvas construction.',
      images: [
        'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80',
      ],
    },
    {
      vendor_id: vendorFashion?.id || vendorTech?.id,
      category_id: catFashion.id,
      subcategory_id: subMenFashion.id,
      name: 'Classic Handcrafted Leather Chelsea Boots Tan',
      slug: 'classic-leather-chelsea-boots-tan',
      sku: 'FASH-BOOTS-CHELSEA-TAN',
      price: 3499.0,
      discount_price: 2799.0,
      stock: 4, // LOW STOCK
      low_stock_threshold: 5,
      status: 'active',
      approval_status: 'approved',
      description: 'Full-grain pull-up leather upper with Goodyear welted rubber sole, elastic side gussets, and cushioned ergonomic footbed.',
      images: [
        'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&auto=format&fit=crop&q=80',
      ],
    },
  ];

  const createdProducts = [];
  for (const p of demoProducts) {
    let [prod] = await Product.findOrCreate({
      where: { sku: p.sku },
      defaults: p,
    });
    // Ensure stock and threshold are updated
    prod.stock = p.stock;
    prod.low_stock_threshold = p.low_stock_threshold;
    prod.approval_status = 'approved';
    prod.status = 'active';
    await prod.save();
    createdProducts.push(prod);
  }

  console.log(`Created/synced ${createdProducts.length} marketplace products.`);

  // 5. Inventory Logs Seeding
  console.log('\n--- 5. Inventory Audit Logs Setup ---');
  await InventoryLog.destroy({ where: {} }); // Reset logs for clean demonstration

  for (const prod of createdProducts) {
    // Initial stock creation log
    await InventoryLog.create({
      product_id: prod.id,
      vendor_id: prod.vendor_id,
      user_id: admin?.id || 20,
      action_type: 'set',
      previous_stock: 0,
      changed_quantity: Number(prod.stock),
      new_stock: Number(prod.stock),
      reason: 'Initial warehouse stock onboarding from central supply',
      created_at: new Date(Date.now() - 3600 * 24 * 5 * 1000), // 5 days ago
    });

    // Add a secondary realistic adjustment log for products
    if (prod.stock > 10) {
      await InventoryLog.create({
        product_id: prod.id,
        vendor_id: prod.vendor_id,
        user_id: admin?.id || 20,
        action_type: 'increase',
        previous_stock: Number(prod.stock) - 10,
        changed_quantity: 10,
        new_stock: Number(prod.stock),
        reason: 'Restock shipment received at regional fulfillment hub',
        created_at: new Date(Date.now() - 3600 * 24 * 1 * 1000), // 1 day ago
      });
    } else if (prod.stock === 0) {
      await InventoryLog.create({
        product_id: prod.id,
        vendor_id: prod.vendor_id,
        user_id: admin?.id || 20,
        action_type: 'decrease',
        previous_stock: 5,
        changed_quantity: -5,
        new_stock: 0,
        reason: 'Flash sale inventory clearance event',
        created_at: new Date(Date.now() - 3600 * 12 * 1000), // 12 hours ago
      });
    }
  }
  console.log('Inventory audit logs seeded.');

  // 6. Active Customer Shopping Carts
  console.log('\n--- 6. Customer Shopping Carts Setup ---');
  await CartItem.destroy({ where: {} });
  await Cart.destroy({ where: {} });

  const pSony = createdProducts.find((p) => p.sku === 'TECH-SONY-XM5');
  const pMouse = createdProducts.find((p) => p.sku === 'TECH-LOGI-MX3S');
  const pWalnut = createdProducts.find((p) => p.sku === 'GROC-WALNUT-1KG');
  const pOlive = createdProducts.find((p) => p.sku === 'GROC-OLIVEOIL-1L');
  const pBlazer = createdProducts.find((p) => p.sku === 'FASH-BLAZER-SLIM');
  const pBoots = createdProducts.find((p) => p.sku === 'FASH-BOOTS-CHELSEA-TAN');
  const pMacbook = createdProducts.find((p) => p.sku === 'TECH-MBA-M2-16');
  const pWatch = createdProducts.find((p) => p.sku === 'TECH-AW9-45-MID');

  // Customer 1 Cart (Demo Customer)
  if (demoCustomer && pSony && pMouse) {
    const [c1] = await Cart.findOrCreate({ where: { user_id: demoCustomer.id } });
    await CartItem.create({ cart_id: c1.id, product_id: pSony.id, quantity: 1 });
    await CartItem.create({ cart_id: c1.id, product_id: pMouse.id, quantity: 1 });
  }

  // Customer 2 Cart (Aman)
  if (amanCustomer && pWalnut && pOlive) {
    const [c2] = await Cart.findOrCreate({ where: { user_id: amanCustomer.id } });
    await CartItem.create({ cart_id: c2.id, product_id: pWalnut.id, quantity: 2 });
    await CartItem.create({ cart_id: c2.id, product_id: pOlive.id, quantity: 1 });
  }

  // Customer 3 Cart (Test Customer)
  if (testCustomer && pBlazer && pBoots) {
    const [c3] = await Cart.findOrCreate({ where: { user_id: testCustomer.id } });
    await CartItem.create({ cart_id: c3.id, product_id: pBlazer.id, quantity: 1 });
    await CartItem.create({ cart_id: c3.id, product_id: pBoots.id, quantity: 1 });
  }

  console.log('Active customer shopping carts created.');

  // 7. Customer Wishlists
  console.log('\n--- 7. Customer Wishlists Setup ---');
  await Wishlist.destroy({ where: {} });

  if (demoCustomer && pMacbook) {
    await Wishlist.create({ user_id: demoCustomer.id, product_id: pMacbook.id });
  }
  if (demoCustomer && pWatch) {
    await Wishlist.create({ user_id: demoCustomer.id, product_id: pWatch.id });
  }
  if (amanCustomer && pMacbook) {
    await Wishlist.create({ user_id: amanCustomer.id, product_id: pMacbook.id });
  }
  if (amanCustomer && pSony) {
    await Wishlist.create({ user_id: amanCustomer.id, product_id: pSony.id });
  }
  if (testCustomer && pMacbook) {
    await Wishlist.create({ user_id: testCustomer.id, product_id: pMacbook.id });
  }
  if (testCustomer && pBlazer) {
    await Wishlist.create({ user_id: testCustomer.id, product_id: pBlazer.id });
  }

  console.log('Customer wishlists created.');

  console.log('\n========================================================');
  console.log('   DEMO SEEDING COMPLETED SUCCESSFULLY!                ');
  console.log('========================================================');
}

seedDemoData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seeding error:', err);
    process.exit(1);
  });
