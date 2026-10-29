require('dotenv').config();
const http = require('http');
const app = require('../src/app');
const {
  sequelize,
  User,
  Vendor,
  Category,
  Product,
} = require('../src/models');
const { hashPassword } = require('../src/utils/password.util');

async function runProductSearchTests() {
  console.log('====================================================');
  console.log('  STARTING PRODUCT LISTING & SEARCH TEST SUITE      ');
  console.log('====================================================');

  await sequelize.authenticate();
  console.log('Sequelize connected.');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`Test server running at ${baseUrl}`);

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName} -> ${details}`);
      failed++;
    }
  }

  const testEmails = [
    'test_search_approved_seller@example.com',
    'test_search_pending_seller@example.com',
    'test_search_rejected_seller@example.com',
    'test_search_suspended_seller@example.com',
  ];

  const testPhones = [
    '9998880001',
    '9998880002',
    '9998880003',
    '9998880004',
  ];

  const testSkus = [
    'SRCH-LAPTOP-01',
    'SRCH-MOUSE-02',
    'SRCH-BOOK-03',
    'SRCH-KBD-04',
    'SRCH-OLD-CAM-05',
    'SRCH-PEND-MON-06',
    'SRCH-PEND-TAB-07',
    'SRCH-REJ-PHN-08',
    'SRCH-SUSP-WCH-09',
    'SRCH-GHOST-10',
  ];

  const testCategorySlugs = [
    'test-search-electronics',
    'test-search-laptops',
    'test-search-books',
    'test-search-inactive-cat',
  ];

  try {
    // -------------------------------------------------------------------------
    // 0. Cleanup any old fixtures
    // -------------------------------------------------------------------------
    console.log('\n--- 0. Database Test Fixture Setup & Cleanup ---');
    await Product.destroy({ where: { sku: testSkus } });
    await Category.destroy({ where: { slug: testCategorySlugs } });
    await Vendor.destroy({
      where: {
        store_slug: [
          'approved-tech-hub',
          'pending-gadget-mart',
          'rejected-phone-hub',
          'suspended-gear-store',
        ],
      },
    });
    await User.destroy({ where: { [sequelize.Sequelize.Op.or]: [{ email: testEmails }, { phone: testPhones }] } });

    // -------------------------------------------------------------------------
    // 1. Fixture Creation: Users and Vendors
    // -------------------------------------------------------------------------
    console.log('\n--- 1. Creating Sellers and Store Profiles ---');
    const passwordHash = await hashPassword('SellerPass123!');

    // 1.1 Approved Vendor
    const userApproved = await User.create({
      name: 'Approved Vendor User',
      email: testEmails[0],
      password_hash: passwordHash,
      phone: testPhones[0],
      role: 'vendor',
      status: 'active',
      is_verified: true,
    });
    const vendorApproved = await Vendor.create({
      user_id: userApproved.id,
      store_name: 'Approved Tech Hub',
      store_slug: 'approved-tech-hub',
      store_email: testEmails[0],
      store_phone: testPhones[0],
      status: 'approved',
    });

    // 1.2 Pending Vendor
    const userPending = await User.create({
      name: 'Pending Vendor User',
      email: testEmails[1],
      password_hash: passwordHash,
      phone: testPhones[1],
      role: 'vendor',
      status: 'active',
      is_verified: true,
    });
    const vendorPending = await Vendor.create({
      user_id: userPending.id,
      store_name: 'Pending Gadget Mart',
      store_slug: 'pending-gadget-mart',
      store_email: testEmails[1],
      store_phone: testPhones[1],
      status: 'pending',
    });

    // 1.3 Rejected Vendor
    const userRejected = await User.create({
      name: 'Rejected Vendor User',
      email: testEmails[2],
      password_hash: passwordHash,
      phone: testPhones[2],
      role: 'vendor',
      status: 'active',
      is_verified: true,
    });
    const vendorRejected = await Vendor.create({
      user_id: userRejected.id,
      store_name: 'Rejected Phone Hub',
      store_slug: 'rejected-phone-hub',
      store_email: testEmails[2],
      store_phone: testPhones[2],
      status: 'rejected',
    });

    // 1.4 Suspended Vendor
    const userSuspended = await User.create({
      name: 'Suspended Vendor User',
      email: testEmails[3],
      password_hash: passwordHash,
      phone: testPhones[3],
      role: 'vendor',
      status: 'active',
      is_verified: true,
    });
    const vendorSuspended = await Vendor.create({
      user_id: userSuspended.id,
      store_name: 'Suspended Gear Store',
      store_slug: 'suspended-gear-store',
      store_email: testEmails[3],
      store_phone: testPhones[3],
      status: 'suspended',
    });

    // -------------------------------------------------------------------------
    // 2. Fixture Creation: Categories
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Creating Categories and Subcategories ---');
    const catElectronics = await Category.create({
      name: 'Search Electronics',
      slug: 'test-search-electronics',
      status: 'active',
      parent_id: null,
    });

    const subLaptops = await Category.create({
      name: 'Search Laptops',
      slug: 'test-search-laptops',
      status: 'active',
      parent_id: catElectronics.id,
    });

    const catBooks = await Category.create({
      name: 'Search Books',
      slug: 'test-search-books',
      status: 'active',
      parent_id: null,
    });

    const catInactive = await Category.create({
      name: 'Search Inactive Cat',
      slug: 'test-search-inactive-cat',
      status: 'inactive',
      parent_id: null,
    });

    // -------------------------------------------------------------------------
    // 3. Fixture Creation: Products
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Creating Products with Varied Prices, Sellers, and Statuses ---');

    // Product A: Approved Seller, Active, Approved, Electronics -> Laptops, Price: 1500
    const prodA = await Product.create({
      vendor_id: vendorApproved.id,
      category_id: catElectronics.id,
      subcategory_id: subLaptops.id,
      name: 'Gaming Laptop Ultra Pro',
      slug: 'gaming-laptop-ultra-pro',
      description: 'High performance gaming laptop with dedicated GPU',
      price: 1500.00,
      discount_price: 1399.00,
      sku: 'SRCH-LAPTOP-01',
      stock: 25,
      status: 'active',
      approval_status: 'approved',
    });

    // Product B: Approved Seller, Active, Approved, Electronics, Price: 50
    const prodB = await Product.create({
      vendor_id: vendorApproved.id,
      category_id: catElectronics.id,
      subcategory_id: null,
      name: 'Wireless Bluetooth Mouse',
      slug: 'wireless-bluetooth-mouse',
      description: 'Ergonomic optical mouse with silent click',
      price: 50.00,
      sku: 'SRCH-MOUSE-02',
      stock: 100,
      status: 'active',
      approval_status: 'approved',
    });

    // Product C: Approved Seller, Active, Approved, Books, Price: 30
    const prodC = await Product.create({
      vendor_id: vendorApproved.id,
      category_id: catBooks.id,
      subcategory_id: null,
      name: 'Node.js Guide Book',
      slug: 'nodejs-guide-book',
      description: 'Complete backend engineering with Node.js and Express',
      price: 30.00,
      sku: 'SRCH-BOOK-03',
      stock: 60,
      status: 'active',
      approval_status: 'approved',
    });

    // Product D: Approved Seller, Active, Approved, Electronics, Price: 120
    const prodD = await Product.create({
      vendor_id: vendorApproved.id,
      category_id: catElectronics.id,
      subcategory_id: null,
      name: 'Mechanical Keyboard RGB',
      slug: 'mechanical-keyboard-rgb',
      description: 'Mechanical keyboard with blue switches and custom backlight',
      price: 120.00,
      sku: 'SRCH-KBD-04',
      stock: 40,
      status: 'active',
      approval_status: 'approved',
    });

    // Product E: Approved Seller, Inactive Status, Price: 40
    const prodE = await Product.create({
      vendor_id: vendorApproved.id,
      category_id: catElectronics.id,
      name: 'Old Inactive Webcam',
      slug: 'old-inactive-webcam',
      price: 40.00,
      sku: 'SRCH-OLD-CAM-05',
      stock: 10,
      status: 'inactive',
      approval_status: 'approved',
    });

    // Product F: Approved Seller, Pending Approval, Price: 300
    const prodF = await Product.create({
      vendor_id: vendorApproved.id,
      category_id: catElectronics.id,
      name: 'Pending Review Monitor',
      slug: 'pending-review-monitor',
      price: 300.00,
      sku: 'SRCH-PEND-MON-06',
      stock: 15,
      status: 'active',
      approval_status: 'pending',
    });

    // Product G: PENDING Seller, Approved Product, Price: 400 (SHOULD BE HIDDEN)
    const prodG = await Product.create({
      vendor_id: vendorPending.id,
      category_id: catElectronics.id,
      name: 'Pending Seller Tablet',
      slug: 'pending-seller-tablet',
      price: 400.00,
      sku: 'SRCH-PEND-TAB-07',
      stock: 20,
      status: 'active',
      approval_status: 'approved',
    });

    // Product H: REJECTED Seller, Approved Product, Price: 600 (SHOULD BE HIDDEN)
    const prodH = await Product.create({
      vendor_id: vendorRejected.id,
      category_id: catElectronics.id,
      name: 'Rejected Seller Phone',
      slug: 'rejected-seller-phone',
      price: 600.00,
      sku: 'SRCH-REJ-PHN-08',
      stock: 10,
      status: 'active',
      approval_status: 'approved',
    });

    // Product I: SUSPENDED Seller, Approved Product, Price: 250 (SHOULD BE HIDDEN)
    const prodI = await Product.create({
      vendor_id: vendorSuspended.id,
      category_id: catElectronics.id,
      name: 'Suspended Seller Watch',
      slug: 'suspended-seller-watch',
      price: 250.00,
      sku: 'SRCH-SUSP-WCH-09',
      stock: 15,
      status: 'active',
      approval_status: 'approved',
    });

    // Product J: Inactive Category, Approved Product (SHOULD BE HIDDEN)
    const prodJ = await Product.create({
      vendor_id: vendorApproved.id,
      category_id: catInactive.id,
      name: 'Ghost Inactive Category Product',
      slug: 'ghost-inactive-category-product',
      price: 99.00,
      sku: 'SRCH-GHOST-10',
      stock: 5,
      status: 'active',
      approval_status: 'approved',
    });

    console.log('Fixtures created successfully.');

    // =========================================================================
    // 4. Test Feature 1: Public Listing & Approved Sellers Strict Enforcement
    // =========================================================================
    console.log('\n--- 4. Public Product Listing & Seller Approval Enforcement ---');

    {
      const res = await fetch(`${baseUrl}/api/v1/products?search=SRCH`);
      // Or query by name prefix
      const data = await res.json();
      assert(res.status === 200, 'GET /api/v1/products returns 200 OK');
      assert(data.success === true, 'Response format indicates success: true');
      assert(data.data && Array.isArray(data.data.products), 'Products array is present');
      assert(data.data.pagination && data.data.pagination.total !== undefined, 'Pagination metadata is present');

      // Now query specifically in our test suite scope by filtering by our vendor ID or search
      const resTest = await fetch(`${baseUrl}/api/v1/products?vendor_id=${vendorApproved.id}`);
      const dataTest = await resTest.json();
      const productIds = dataTest.data.products.map((p) => p.id);

      assert(productIds.includes(prodA.id), 'Listing includes active approved Product A (Laptop)');
      assert(productIds.includes(prodB.id), 'Listing includes active approved Product B (Mouse)');
      assert(productIds.includes(prodC.id), 'Listing includes active approved Product C (Book)');
      assert(productIds.includes(prodD.id), 'Listing includes active approved Product D (Keyboard)');

      assert(!productIds.includes(prodE.id), 'Listing EXCLUDES inactive Product E');
      assert(!productIds.includes(prodF.id), 'Listing EXCLUDES pending approval Product F');
      assert(!productIds.includes(prodJ.id), 'Listing EXCLUDES product in inactive Category J');

      // Test unapproved vendors cannot leak products even if explicitly passing vendor_id
      const resPendingVendor = await fetch(`${baseUrl}/api/v1/products?vendor_id=${vendorPending.id}`);
      const dataPending = await resPendingVendor.json();
      assert(
        dataPending.data.products.length === 0,
        'Listing strictly excludes products from PENDING vendor (status: pending)'
      );

      const resRejectedVendor = await fetch(`${baseUrl}/api/v1/products?vendor_id=${vendorRejected.id}`);
      const dataRejected = await resRejectedVendor.json();
      assert(
        dataRejected.data.products.length === 0,
        'Listing strictly excludes products from REJECTED vendor (status: rejected)'
      );

      const resSuspendedVendor = await fetch(`${baseUrl}/api/v1/products?vendor_id=${vendorSuspended.id}`);
      const dataSuspended = await resSuspendedVendor.json();
      assert(
        dataSuspended.data.products.length === 0,
        'Listing strictly excludes products from SUSPENDED vendor (status: suspended)'
      );
    }

    // =========================================================================
    // 5. Test Feature 2: Product Details by ID & Slug
    // =========================================================================
    console.log('\n--- 5. Product Details by ID and Slug ---');

    // 5.1 Details by Numeric ID for approved product
    {
      const res = await fetch(`${baseUrl}/api/v1/products/${prodA.id}`);
      const data = await res.json();
      assert(res.status === 200, 'GET /api/v1/products/:id returns 200 for approved product');
      assert(data.data.id === prodA.id, 'Returns matching product ID');
      assert(data.data.name === 'Gaming Laptop Ultra Pro', 'Returns matching product name');
      assert(data.data.vendor && data.data.vendor.store_name === 'Approved Tech Hub', 'Returns associated approved vendor');
      assert(data.data.category && data.data.category.name === 'Search Electronics', 'Returns associated category');
      assert(data.data.subcategory && data.data.subcategory.name === 'Search Laptops', 'Returns associated subcategory');
    }

    // 5.2 Details by URL Slug
    {
      const res = await fetch(`${baseUrl}/api/v1/products/${prodB.slug}`);
      const data = await res.json();
      assert(res.status === 200, 'GET /api/v1/products/:slug returns 200 for approved slug');
      assert(data.data.id === prodB.id, 'Returns matching product ID from slug lookup');
    }

    // 5.3 Details for Pending Product returns 404
    {
      const res = await fetch(`${baseUrl}/api/v1/products/${prodF.id}`);
      assert(res.status === 404, 'GET /api/v1/products/:id returns 404 for product with pending approval');
    }

    // 5.4 Details for Product of PENDING Vendor returns 404
    {
      const res = await fetch(`${baseUrl}/api/v1/products/${prodG.id}`);
      assert(res.status === 404, 'GET /api/v1/products/:id returns 404 for product from pending vendor');
    }

    // 5.5 Details for Product of REJECTED Vendor returns 404
    {
      const res = await fetch(`${baseUrl}/api/v1/products/${prodH.id}`);
      assert(res.status === 404, 'GET /api/v1/products/:id returns 404 for product from rejected vendor');
    }

    // 5.6 Details for Non-existent Product returns 404
    {
      const res = await fetch(`${baseUrl}/api/v1/products/99999999`);
      assert(res.status === 404, 'GET /api/v1/products/:id returns 404 for non-existent product');
    }

    // =========================================================================
    // 6. Test Feature 3: Search by Product Name & Keywords
    // =========================================================================
    console.log('\n--- 6. Search by Product Name and /products/search Endpoint ---');

    // 6.1 Filter by specific `name` query param
    {
      const res = await fetch(`${baseUrl}/api/v1/products?name=Gaming&vendor_id=${vendorApproved.id}`);
      const data = await res.json();
      assert(res.status === 200, 'GET /api/v1/products?name=Gaming returns 200');
      assert(data.data.products.length === 1, 'Only 1 product matched name=Gaming');
      assert(data.data.products[0].id === prodA.id, 'Found Gaming Laptop Ultra Pro');
    }

    // 6.2 Filter via dedicated `/products/search` endpoint with `name`
    {
      const res = await fetch(`${baseUrl}/api/v1/products/search?name=Keyboard&vendor_id=${vendorApproved.id}`);
      const data = await res.json();
      assert(res.status === 200, 'GET /api/v1/products/search?name=Keyboard returns 200');
      assert(data.data.products.length === 1, 'Found exactly 1 match on /search');
      assert(data.data.products[0].id === prodD.id, 'Matched Mechanical Keyboard RGB');
    }

    // 6.3 Filter via `/products/search` with keyword `q`
    {
      const res = await fetch(`${baseUrl}/api/v1/products/search?q=Bluetooth&vendor_id=${vendorApproved.id}`);
      const data = await res.json();
      assert(res.status === 200, 'GET /api/v1/products/search?q=Bluetooth returns 200');
      assert(data.data.products.length === 1, 'Matched Bluetooth keyword');
      assert(data.data.products[0].id === prodB.id, 'Matched Wireless Bluetooth Mouse');
    }

    // 6.4 Keyword search across description
    {
      const res = await fetch(`${baseUrl}/api/v1/products/search?search=dedicated+GPU&vendor_id=${vendorApproved.id}`);
      const data = await res.json();
      assert(res.status === 200, 'GET /api/v1/products/search?search=dedicated+GPU returns 200');
      assert(data.data.products.some((p) => p.id === prodA.id), 'Matched description keyword');
    }

    // =========================================================================
    // 7. Test Feature 4: Category and Subcategory Filters & Category Endpoint
    // =========================================================================
    console.log('\n--- 7. Category and Subcategory Filters ---');

    // 7.1 Filter by category_id directly
    {
      const res = await fetch(`${baseUrl}/api/v1/products?category_id=${catBooks.id}&vendor_id=${vendorApproved.id}`);
      const data = await res.json();
      assert(res.status === 200, 'GET /api/v1/products?category_id=books returns 200');
      assert(data.data.products.length === 1, 'Returns only products in Books category');
      assert(data.data.products[0].id === prodC.id, 'Returns Node.js Guide Book');
    }

    // 7.2 Filter by category_slug
    {
      const res = await fetch(`${baseUrl}/api/v1/products?category_slug=${catBooks.slug}&vendor_id=${vendorApproved.id}`);
      const data = await res.json();
      assert(res.status === 200, 'GET /api/v1/products?category_slug=test-search-books returns 200');
      assert(data.data.products[0].id === prodC.id, 'Resolved category slug correctly');
    }

    // 7.3 Filter parent category also returns products in its subcategories
    {
      const res = await fetch(`${baseUrl}/api/v1/products?category_id=${catElectronics.id}&vendor_id=${vendorApproved.id}`);
      const data = await res.json();
      const ids = data.data.products.map((p) => p.id);
      assert(ids.includes(prodA.id), 'Parent category includes product in subcategory (Laptop)');
      assert(ids.includes(prodB.id), 'Parent category includes direct product (Mouse)');
      assert(ids.includes(prodD.id), 'Parent category includes direct product (Keyboard)');
      assert(!ids.includes(prodC.id), 'Parent category excludes product in Books category');
    }

    // 7.4 Filter by subcategory_id specifically
    {
      const res = await fetch(`${baseUrl}/api/v1/products?subcategory_id=${subLaptops.id}&vendor_id=${vendorApproved.id}`);
      const data = await res.json();
      assert(res.status === 200, 'GET /api/v1/products?subcategory_id=laptops returns 200');
      assert(data.data.products.length === 1, 'Returns only products in Laptops subcategory');
      assert(data.data.products[0].id === prodA.id, 'Matched Laptop');
    }

    // 7.5 Dedicated Category Products Endpoint: GET /api/v1/categories/:id/products
    {
      const res = await fetch(`${baseUrl}/api/v1/categories/${catElectronics.id}/products?vendor_id=${vendorApproved.id}`);
      const data = await res.json();
      assert(res.status === 200, 'GET /api/v1/categories/:id/products returns 200');
      assert(data.data.category && data.data.category.id === catElectronics.id, 'Response includes category header metadata');
      assert(Array.isArray(data.data.products), 'Response includes products array');
      const prodIds = data.data.products.map((p) => p.id);
      assert(prodIds.includes(prodA.id) && prodIds.includes(prodB.id), 'Returns approved products for category');
    }

    // 7.6 Category Products Endpoint by Slug: GET /api/v1/categories/:slug/products
    {
      const res = await fetch(`${baseUrl}/api/v1/categories/${catBooks.slug}/products`);
      const data = await res.json();
      assert(res.status === 200, 'GET /api/v1/categories/:slug/products returns 200');
      assert(data.data.products.some((p) => p.id === prodC.id), 'Returns books under category slug');
    }

    // =========================================================================
    // 8. Test Feature 5: Minimum & Maximum Price Filters
    // =========================================================================
    console.log('\n--- 8. Minimum and Maximum Price Filters ---');

    // 8.1 min_price filter (price >= 100) -> should match Keyboard (120) and Laptop (1500)
    {
      const res = await fetch(`${baseUrl}/api/v1/products?min_price=100&vendor_id=${vendorApproved.id}`);
      const data = await res.json();
      assert(res.status === 200, 'GET /api/v1/products?min_price=100 returns 200');
      const prices = data.data.products.map((p) => Number(p.price));
      assert(prices.every((p) => p >= 100), 'All returned products have price >= 100');
      const ids = data.data.products.map((p) => p.id);
      assert(ids.includes(prodD.id) && ids.includes(prodA.id), 'Matched Keyboard (120) and Laptop (1500)');
      assert(!ids.includes(prodB.id) && !ids.includes(prodC.id), 'Excluded Mouse (50) and Book (30)');
    }

    // 8.2 max_price filter (price <= 100) -> should match Book (30) and Mouse (50)
    {
      const res = await fetch(`${baseUrl}/api/v1/products?max_price=100&vendor_id=${vendorApproved.id}`);
      const data = await res.json();
      assert(res.status === 200, 'GET /api/v1/products?max_price=100 returns 200');
      const prices = data.data.products.map((p) => Number(p.price));
      assert(prices.every((p) => p <= 100), 'All returned products have price <= 100');
      const ids = data.data.products.map((p) => p.id);
      assert(ids.includes(prodC.id) && ids.includes(prodB.id), 'Matched Book (30) and Mouse (50)');
      assert(!ids.includes(prodD.id) && !ids.includes(prodA.id), 'Excluded Keyboard (120) and Laptop (1500)');
    }

    // 8.3 Combined min_price and max_price range [40, 200] -> should match Mouse (50) and Keyboard (120)
    {
      const res = await fetch(`${baseUrl}/api/v1/products?min_price=40&max_price=200&vendor_id=${vendorApproved.id}`);
      const data = await res.json();
      assert(res.status === 200, 'GET /api/v1/products?min_price=40&max_price=200 returns 200');
      const ids = data.data.products.map((p) => p.id);
      assert(ids.includes(prodB.id) && ids.includes(prodD.id), 'Matched range [40, 200] exactly');
      assert(!ids.includes(prodC.id) && !ids.includes(prodA.id), 'Excluded out-of-range items (30, 1500)');
    }

    // 8.4 Validation: min_price > max_price returns 400 Bad Request
    {
      const res = await fetch(`${baseUrl}/api/v1/products?min_price=500&max_price=100`);
      assert(res.status === 400, 'Query validation: min_price > max_price returns 400 Bad Request');
    }

    // 8.5 Validation: negative price returns 400 Bad Request
    {
      const res = await fetch(`${baseUrl}/api/v1/products?min_price=-10`);
      assert(res.status === 400, 'Query validation: negative min_price returns 400 Bad Request');
    }

    // =========================================================================
    // 9. Test Feature 6: Price Low-to-High & High-to-Low Sorting
    // =========================================================================
    console.log('\n--- 9. Price Sorting (Low-to-High and High-to-Low) ---');

    // 9.1 sort=low_to_high
    {
      const res = await fetch(`${baseUrl}/api/v1/products?sort=low_to_high&vendor_id=${vendorApproved.id}`);
      const data = await res.json();
      assert(res.status === 200, 'GET /api/v1/products?sort=low_to_high returns 200');
      const prices = data.data.products.map((p) => Number(p.price));
      assert(prices.length === 4, 'Returns all 4 approved items');
      assert(
        prices[0] <= prices[1] && prices[1] <= prices[2] && prices[2] <= prices[3],
        'Prices are strictly in ascending order (low to high)',
        `Actual: ${JSON.stringify(prices)}`
      );
      assert(prices[0] === 30 && prices[3] === 1500, 'Lowest is 30 (Book) and highest is 1500 (Laptop)');
    }

    // 9.2 sort=price_asc alias
    {
      const res = await fetch(`${baseUrl}/api/v1/products?sort=price_asc&vendor_id=${vendorApproved.id}`);
      const data = await res.json();
      const prices = data.data.products.map((p) => Number(p.price));
      assert(prices[0] === 30 && prices[prices.length - 1] === 1500, 'sort=price_asc sorts low-to-high properly');
    }

    // 9.3 sort=high_to_low
    {
      const res = await fetch(`${baseUrl}/api/v1/products?sort=high_to_low&vendor_id=${vendorApproved.id}`);
      const data = await res.json();
      assert(res.status === 200, 'GET /api/v1/products?sort=high_to_low returns 200');
      const prices = data.data.products.map((p) => Number(p.price));
      assert(
        prices[0] >= prices[1] && prices[1] >= prices[2] && prices[2] >= prices[3],
        'Prices are strictly in descending order (high to low)',
        `Actual: ${JSON.stringify(prices)}`
      );
      assert(prices[0] === 1500 && prices[3] === 30, 'Highest is 1500 (Laptop) and lowest is 30 (Book)');
    }

    // 9.4 sort=price_desc alias
    {
      const res = await fetch(`${baseUrl}/api/v1/products?sort=price_desc&vendor_id=${vendorApproved.id}`);
      const data = await res.json();
      const prices = data.data.products.map((p) => Number(p.price));
      assert(prices[0] === 1500 && prices[prices.length - 1] === 30, 'sort=price_desc sorts high-to-low properly');
    }

    // 9.5 sortBy=price & sortOrder=ASC / DESC standard parameters
    {
      const resAsc = await fetch(`${baseUrl}/api/v1/products?sortBy=price&sortOrder=ASC&vendor_id=${vendorApproved.id}`);
      const dataAsc = await resAsc.json();
      const pricesAsc = dataAsc.data.products.map((p) => Number(p.price));
      assert(pricesAsc[0] === 30, 'sortBy=price&sortOrder=ASC sorts ascending');

      const resDesc = await fetch(`${baseUrl}/api/v1/products?sortBy=price&sortOrder=DESC&vendor_id=${vendorApproved.id}`);
      const dataDesc = await resDesc.json();
      const pricesDesc = dataDesc.data.products.map((p) => Number(p.price));
      assert(pricesDesc[0] === 1500, 'sortBy=price&sortOrder=DESC sorts descending');
    }

    // =========================================================================
    // 10. Test Feature 7: Pagination with Page and Limit
    // =========================================================================
    console.log('\n--- 10. Pagination with Page and Limit ---');

    // 10.1 Page 1 with Limit 2
    {
      const res = await fetch(`${baseUrl}/api/v1/products?page=1&limit=2&sort=low_to_high&vendor_id=${vendorApproved.id}`);
      const data = await res.json();
      assert(res.status === 200, 'GET /api/v1/products?page=1&limit=2 returns 200');
      assert(data.data.products.length === 2, 'Page 1 contains exactly 2 products');
      assert(data.data.pagination.page === 1, 'Pagination page is 1');
      assert(data.data.pagination.limit === 2, 'Pagination limit is 2');
      assert(data.data.pagination.total === 4, 'Pagination total is 4');
      assert(data.data.pagination.totalPages === 2, 'Pagination totalPages is 2');
      assert(data.data.pagination.hasNextPage === true, 'Pagination hasNextPage is true');
      assert(data.data.pagination.hasPrevPage === false, 'Pagination hasPrevPage is false');
      assert(Number(data.data.products[0].price) === 30, 'Page 1 item 1 is Book ($30)');
      assert(Number(data.data.products[1].price) === 50, 'Page 1 item 2 is Mouse ($50)');
    }

    // 10.2 Page 2 with Limit 2
    {
      const res = await fetch(`${baseUrl}/api/v1/products?page=2&limit=2&sort=low_to_high&vendor_id=${vendorApproved.id}`);
      const data = await res.json();
      assert(res.status === 200, 'GET /api/v1/products?page=2&limit=2 returns 200');
      assert(data.data.products.length === 2, 'Page 2 contains exactly 2 products');
      assert(data.data.pagination.page === 2, 'Pagination page is 2');
      assert(data.data.pagination.hasNextPage === false, 'Pagination hasNextPage is false');
      assert(data.data.pagination.hasPrevPage === true, 'Pagination hasPrevPage is true');
      assert(Number(data.data.products[0].price) === 120, 'Page 2 item 1 is Keyboard ($120)');
      assert(Number(data.data.products[1].price) === 1500, 'Page 2 item 2 is Laptop ($1500)');
    }

    // =========================================================================
    // 11. Teardown
    // =========================================================================
    console.log('\n--- 11. Cleaning Up Test Fixtures ---');
    await Product.destroy({ where: { sku: testSkus } });
    await Category.destroy({ where: { slug: testCategorySlugs } });
    await Vendor.destroy({
      where: {
        store_slug: [
          'approved-tech-hub',
          'pending-gadget-mart',
          'rejected-phone-hub',
          'suspended-gear-store',
        ],
      },
    });
    await User.destroy({ where: { [sequelize.Sequelize.Op.or]: [{ email: testEmails }, { phone: testPhones }] } });
    console.log('Cleanup completed successfully.');

  } catch (err) {
    console.error('Fatal error in product search test suite:', err);
    failed++;
  } finally {
    server.close();
    console.log('\n====================================================');
    console.log(` Product Listing & Search Results: ${passed} passed, ${failed} failed`);
    console.log('====================================================');
    if (failed > 0) {
      process.exit(1);
    }
  }
}

runProductSearchTests();
