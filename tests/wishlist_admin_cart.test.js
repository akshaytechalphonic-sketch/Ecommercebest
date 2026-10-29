require('dotenv').config();
const http = require('http');
const app = require('../src/app');
const {
  sequelize,
  User,
  Vendor,
  Category,
  Product,
  Cart,
  CartItem,
  Wishlist,
} = require('../src/models');
const { hashPassword } = require('../src/utils/password.util');
const { generateAccessToken } = require('../src/utils/token.util');

async function runWishlistAndAdminCartTests() {
  console.log('====================================================');
  console.log('   STARTING WISHLIST & ADMIN CARTS TEST SUITE       ');
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

  try {
    // 0. Setup Fixtures
    console.log('\n--- 0. Setup Test Fixtures ---');
    // Clean up any previous test records
    await Wishlist.destroy({ where: {} });
    await CartItem.destroy({ where: {} });
    await Cart.destroy({ where: {} });
    await Product.destroy({
      where: {
        sku: ['WISH-PROD-01', 'WISH-PROD-02', 'WISH-INACTIVE'],
      },
    });
    await Category.destroy({ where: { slug: 'wish-test-cat' } });
    await Vendor.destroy({ where: { store_email: 'wish.vendor@market.test' } });
    await User.destroy({
      where: {
        email: [
          'wish.customer@market.test',
          'wish.admin@market.test',
          'wish.vendor.user@market.test',
        ],
      },
    });

    const hashedPassword = await hashPassword('Password@123');

    // Admin user
    const adminUser = await User.create({
      name: 'Super Admin',
      email: 'wish.admin@market.test',
      password_hash: hashedPassword,
      phone: '9900000001',
      role: 'admin',
      status: 'active',
      is_verified: true,
    });
    const adminToken = generateAccessToken(adminUser);

    // Customer user
    const customer = await User.create({
      name: 'Priya Sharma',
      email: 'wish.customer@market.test',
      password_hash: hashedPassword,
      phone: '9900000002',
      role: 'customer',
      status: 'active',
      is_verified: true,
    });
    const customerToken = generateAccessToken(customer);

    // Vendor user & record
    const vendorUser = await User.create({
      name: 'Vendor Seller',
      email: 'wish.vendor.user@market.test',
      password_hash: hashedPassword,
      phone: '9900000003',
      role: 'vendor',
      status: 'active',
      is_verified: true,
    });
    const vendor = await Vendor.create({
      user_id: vendorUser.id,
      store_name: 'Apex Global Electronics',
      store_slug: 'apex-global-electronics-wish',
      store_email: 'wish.vendor@market.test',
      store_phone: '+919876543210',
      status: 'approved',
    });

    const category = await Category.create({
      name: 'Tech Gadgets',
      slug: 'wish-test-cat',
      status: 'active',
    });

    const product1 = await Product.create({
      vendor_id: vendor.id,
      category_id: category.id,
      name: 'Wireless Noise Cancelling Headphones',
      slug: 'wireless-noise-cancelling-headphones',
      sku: 'WISH-PROD-01',
      price: 2999.0,
      discount_price: 2499.0,
      stock: 50,
      status: 'active',
      is_active: true,
      approval_status: 'approved',
    });

    const product2 = await Product.create({
      vendor_id: vendor.id,
      category_id: category.id,
      name: 'Mechanical RGB Gaming Keyboard',
      slug: 'mechanical-rgb-gaming-keyboard',
      sku: 'WISH-PROD-02',
      price: 4500.0,
      stock: 25,
      status: 'active',
      is_active: true,
      approval_status: 'approved',
    });

    const inactiveProduct = await Product.create({
      vendor_id: vendor.id,
      category_id: category.id,
      name: 'Discontinued Smart Watch',
      slug: 'discontinued-smart-watch',
      sku: 'WISH-INACTIVE',
      price: 1999.0,
      stock: 0,
      status: 'inactive',
      is_active: false,
      approval_status: 'approved',
    });

    console.log('Fixtures created successfully.');

    // 1. Wishlist Authentication Guard
    console.log('\n--- 1. Wishlist Authentication Guard ---');
    const unauthRes = await fetch(`${baseUrl}/api/v1/wishlist`);
    assert(unauthRes.status === 401, 'GET /api/v1/wishlist without token returns 401');

    // 2. Add to Wishlist
    console.log('\n--- 2. Add to Wishlist ---');
    const addRes1 = await fetch(`${baseUrl}/api/v1/wishlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({ product_id: product1.id }),
    });
    const addBody1 = await addRes1.json();
    assert(addRes1.status === 200, 'POST /api/v1/wishlist returns 200 OK');
    assert(addBody1.success === true, 'Response indicates success: true');
    assert(
      addBody1.data.items && addBody1.data.items.some((it) => it.product_id === product1.id),
      'Returns updated wishlist containing product 1'
    );

    // Duplicate add should be idempotent/handle gracefully
    const addResDuplicate = await fetch(`${baseUrl}/api/v1/wishlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({ product_id: product1.id }),
    });
    assert(
      addResDuplicate.status === 200,
      'Duplicate add handles cleanly (returns 200)'
    );

    // Inactive product rejected
    const addInactiveRes = await fetch(`${baseUrl}/api/v1/wishlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({ product_id: inactiveProduct.id }),
    });
    assert(addInactiveRes.status === 400, 'Adding inactive product to wishlist returns 400 Bad Request');

    // Add second product
    const addRes2 = await fetch(`${baseUrl}/api/v1/wishlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({ product_id: product2.id }),
    });
    assert(addRes2.status === 200, 'Adding second product to wishlist returns 200');

    // 3. Get Wishlist
    console.log('\n--- 3. Get Wishlist ---');
    const getWishRes = await fetch(`${baseUrl}/api/v1/wishlist`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const getWishBody = await getWishRes.json();
    assert(getWishRes.status === 200, 'GET /api/v1/wishlist returns 200');
    assert(Array.isArray(getWishBody.data.items), 'items is an array');
    assert(getWishBody.data.items.length === 2, 'Wishlist contains exactly 2 items');
    const item1 = getWishBody.data.items.find((i) => i.product_id === product1.id);
    assert(
      Boolean(item1 && item1.product && item1.product.name === product1.name),
      'Product details attached to wishlist item'
    );

    // 4. Move Wishlist Item to Cart
    console.log('\n--- 4. Move Wishlist Item to Cart ---');
    const wishItemToMove = item1;
    const moveRes = await fetch(`${baseUrl}/api/v1/wishlist/${wishItemToMove.id}/move-to-cart`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const moveBody = await moveRes.json();
    assert(moveRes.status === 200, 'POST /wishlist/:id/move-to-cart returns 200');
    assert(moveBody.success === true, 'Move to cart success is true');

    // Verify it is in cart
    const cartCheck = await fetch(`${baseUrl}/api/v1/cart`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const cartBody = await cartCheck.json();
    assert(cartBody.data.items.length === 1, 'Customer cart now contains 1 item');
    assert(
      cartBody.data.items[0].product_id === product1.id,
      'Moved item matches product1 in cart'
    );

    // Verify removed from wishlist
    const wishCheckAfterMove = await fetch(`${baseUrl}/api/v1/wishlist`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const wishCheckBody = await wishCheckAfterMove.json();
    assert(
      wishCheckBody.data.items.length === 1,
      'Wishlist has 1 item remaining after move-to-cart'
    );

    // 5. Admin Cart & Pipeline Intelligence
    console.log('\n--- 5. Admin Cart & Pipeline Intelligence ---');
    // Non-admin forbidden
    const customerAdminRes = await fetch(`${baseUrl}/api/v1/admin/carts`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert(customerAdminRes.status === 403, 'Customer accessing /api/v1/admin/carts returns 403');

    // Admin allowed
    const adminCartsRes = await fetch(`${baseUrl}/api/v1/admin/carts`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminCartsBody = await adminCartsRes.json();
    assert(adminCartsRes.status === 200, 'Admin GET /api/v1/admin/carts returns 200');
    assert(adminCartsBody.success === true, 'Admin carts response success is true');
    assert(adminCartsBody.data.carts.length >= 1, 'Admin carts lists at least 1 active cart');
    assert(
      adminCartsBody.data.summary.active_carts_count >= 1,
      'Summary reports active_carts_count >= 1'
    );
    assert(
      adminCartsBody.data.summary.total_pipeline_value > 0,
      'Summary reports positive total_pipeline_value'
    );

    // Inspect first cart
    const firstCart = adminCartsBody.data.carts[0];
    assert(Boolean(firstCart.customer), 'Cart includes customer identity details');
    assert(firstCart.items.length >= 1, 'Cart includes line items preview');

    // 6. Admin Wishlist Demand Analytics
    console.log('\n--- 6. Admin Wishlist Demand Analytics ---');
    const adminDemandRes = await fetch(`${baseUrl}/api/v1/admin/carts/wishlists`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminDemandBody = await adminDemandRes.json();
    assert(adminDemandRes.status === 200, 'GET /api/v1/admin/carts/wishlists returns 200');
    assert(
      adminDemandBody.data.summary.total_wishlist_records >= 1,
      'Demand summary reports total_wishlist_records >= 1'
    );
    assert(
      adminDemandBody.data.products.length >= 1,
      'Products grouped by wishlist demand count returned'
    );

    // 7. Cleanup Fixtures
    console.log('\n--- 7. Cleanup Fixtures ---');
    await Wishlist.destroy({ where: {} });
    await CartItem.destroy({ where: {} });
    await Cart.destroy({ where: {} });
    await Product.destroy({
      where: {
        sku: ['WISH-PROD-01', 'WISH-PROD-02', 'WISH-INACTIVE'],
      },
    });
    await Category.destroy({ where: { slug: 'wish-test-cat' } });
    await Vendor.destroy({ where: { store_email: 'wish.vendor@market.test' } });
    await User.destroy({
      where: {
        email: [
          'wish.customer@market.test',
          'wish.admin@market.test',
          'wish.vendor.user@market.test',
        ],
      },
    });
    console.log('Test fixtures cleaned up.');
  } finally {
    server.close();
  }

  console.log('\n====================================================');
  console.log(` Wishlist & Admin Cart Results: ${passed} passed, ${failed} failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runWishlistAndAdminCartTests().catch((err) => {
  console.error('Test run failed with unexpected error:', err);
  process.exit(1);
});
