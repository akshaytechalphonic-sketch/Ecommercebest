require('dotenv').config();
const http = require('http');
const app = require('../src/app');
const {
  sequelize,
  User,
  Vendor,
  Category,
  Product,
  InventoryLog,
} = require('../src/models');
const { hashPassword } = require('../src/utils/password.util');
const { generateAccessToken } = require('../src/utils/token.util');

async function runInventoryTests() {
  console.log('====================================================');
  console.log('   STARTING INVENTORY & STOCK MANAGEMENT TEST SUITE ');
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

  let adminUser, adminToken;
  let sellerUser1, vendor1, sellerToken1;
  let sellerUser2, vendor2, sellerToken2;
  let unapprovedSellerUser, unapprovedVendor, unapprovedToken;
  let customerUser, customerToken;
  let category;
  let product1, product2;

  try {
    // --- 0. Database Test Fixture Setup & Cleanup ---
    console.log('\n--- 0. Setup Test Fixtures ---');
    await InventoryLog.destroy({ where: {} });
    await Product.destroy({
      where: {
        sku: ['INV-TEST-PROD-01', 'INV-TEST-PROD-02', 'INV-TEST-PROD-03'],
      },
    });
    await Category.destroy({ where: { slug: 'inventory-test-cat' } });
    await Vendor.destroy({
      where: {
        store_email: [
          'inv.vendor1@market.test',
          'inv.vendor2@market.test',
          'inv.unappr@market.test',
        ],
      },
    });
    await User.destroy({
      where: {
        email: [
          'inv.admin@market.test',
          'inv.seller1@market.test',
          'inv.seller2@market.test',
          'inv.unappr.user@market.test',
          'inv.customer@market.test',
        ],
      },
    });

    const hashedPassword = await hashPassword('Password@123');

    // 1. Admin
    adminUser = await User.create({
      name: 'Inventory Admin',
      email: 'inv.admin@market.test',
      password_hash: hashedPassword,
      phone: '9811111101',
      role: 'admin',
      status: 'active',
      is_verified: true,
    });
    adminToken = generateAccessToken(adminUser);

    // 2. Approved Seller 1
    sellerUser1 = await User.create({
      name: 'Seller One',
      email: 'inv.seller1@market.test',
      password_hash: hashedPassword,
      phone: '9811111102',
      role: 'vendor',
      status: 'active',
      is_verified: true,
    });
    vendor1 = await Vendor.create({
      user_id: sellerUser1.id,
      store_name: 'Store One Electronics',
      store_slug: 'store-one-electronics',
      store_email: 'inv.vendor1@market.test',
      store_phone: '+919811111102',
      status: 'approved',
    });
    sellerToken1 = generateAccessToken(sellerUser1);

    // 3. Approved Seller 2
    sellerUser2 = await User.create({
      name: 'Seller Two',
      email: 'inv.seller2@market.test',
      password_hash: hashedPassword,
      phone: '9811111103',
      role: 'vendor',
      status: 'active',
      is_verified: true,
    });
    vendor2 = await Vendor.create({
      user_id: sellerUser2.id,
      store_name: 'Store Two Gadgets',
      store_slug: 'store-two-gadgets',
      store_email: 'inv.vendor2@market.test',
      store_phone: '+919811111103',
      status: 'approved',
    });
    sellerToken2 = generateAccessToken(sellerUser2);

    // 4. Pending / Unapproved Seller
    unapprovedSellerUser = await User.create({
      name: 'Pending Seller',
      email: 'inv.unappr.user@market.test',
      password_hash: hashedPassword,
      phone: '9811111104',
      role: 'vendor',
      status: 'active',
      is_verified: true,
    });
    unapprovedVendor = await Vendor.create({
      user_id: unapprovedSellerUser.id,
      store_name: 'Pending Store',
      store_slug: 'pending-store',
      store_email: 'inv.unappr@market.test',
      store_phone: '+919811111104',
      status: 'pending',
    });
    unapprovedToken = generateAccessToken(unapprovedSellerUser);

    // 5. Customer User
    customerUser = await User.create({
      name: 'Regular Customer',
      email: 'inv.customer@market.test',
      password_hash: hashedPassword,
      phone: '9811111105',
      role: 'customer',
      status: 'active',
      is_verified: true,
    });
    customerToken = generateAccessToken(customerUser);

    // Category
    category = await Category.create({
      name: 'Inventory Test Category',
      slug: 'inventory-test-cat',
      status: 'active',
    });

    // Product 1 (Owned by Seller 1): Initial Stock = 20, Threshold = 5
    product1 = await Product.create({
      vendor_id: vendor1.id,
      category_id: category.id,
      name: 'Pro Wireless Mouse',
      slug: 'pro-wireless-mouse',
      sku: 'INV-TEST-PROD-01',
      price: 1500.0,
      stock: 20,
      low_stock_threshold: 5,
      status: 'active',
      approval_status: 'approved',
    });

    // Product 2 (Owned by Seller 2): Initial Stock = 3, Threshold = 10 (Low stock initially!)
    product2 = await Product.create({
      vendor_id: vendor2.id,
      category_id: category.id,
      name: 'Mechanical RGB Keyboard',
      slug: 'mechanical-rgb-keyboard',
      sku: 'INV-TEST-PROD-02',
      price: 3500.0,
      stock: 3,
      low_stock_threshold: 10,
      status: 'active',
      approval_status: 'approved',
    });

    console.log('Fixtures created successfully.');

    // --- 1. Authentication & Role-Based Authorization Guards ---
    console.log('\n--- 1. Authentication & Role-Based Authorization Guards ---');

    // Unauthenticated access
    const unauthRes = await fetch(`${baseUrl}/api/v1/inventory`);
    assert(unauthRes.status === 401, 'GET /api/v1/inventory without token returns 401 Unauthorized');

    // Customer role access
    const custRes = await fetch(`${baseUrl}/api/v1/inventory`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert(custRes.status === 403, 'Customer accessing /api/v1/inventory returns 403 Forbidden');

    // Unapproved vendor access
    const unapprRes = await fetch(`${baseUrl}/api/v1/inventory`, {
      headers: { Authorization: `Bearer ${unapprovedToken}` },
    });
    assert(unapprRes.status === 403, 'Unapproved vendor accessing /api/v1/inventory returns 403 Forbidden');
    const unapprBody = await unapprRes.json();
    assert(unapprBody.code === 'VENDOR_NOT_APPROVED', 'Returns code VENDOR_NOT_APPROVED');

    // Approved vendor access
    const seller1Res = await fetch(`${baseUrl}/api/v1/inventory`, {
      headers: { Authorization: `Bearer ${sellerToken1}` },
    });
    assert(seller1Res.status === 200, 'Approved vendor GET /api/v1/inventory returns 200 OK');
    const seller1Body = await seller1Res.json();
    assert(seller1Body.success === true, 'Response indicates success: true');
    assert(seller1Body.data.products.length === 1, 'Seller 1 sees only their 1 product');
    assert(seller1Body.data.products[0].sku === 'INV-TEST-PROD-01', 'Matches Seller 1 product SKU');
    assert(seller1Body.data.summary.total_products === 1, 'Summary reports 1 product');
    assert(seller1Body.data.summary.total_stock_units === 20, 'Summary reports 20 total stock units');

    // Admin access
    const adminInvRes = await fetch(`${baseUrl}/api/v1/inventory`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminInvRes.status === 200, 'Admin GET /api/v1/inventory returns 200 OK');
    const adminInvBody = await adminInvRes.json();
    assert(adminInvBody.data.products.length >= 2, 'Admin sees all marketplace products');

    // --- 2. Ownership Enforcement (Cross-Seller Protection) ---
    console.log('\n--- 2. Ownership Enforcement (Cross-Seller Protection) ---');

    // Seller 1 attempts to view Seller 2 product details
    const crossViewRes = await fetch(`${baseUrl}/api/v1/inventory/${product2.id}`, {
      headers: { Authorization: `Bearer ${sellerToken1}` },
    });
    assert(crossViewRes.status === 403, 'Seller 1 viewing Seller 2 product returns 403 Forbidden');
    const crossViewBody = await crossViewRes.json();
    assert(crossViewBody.code === 'UNAUTHORIZED_PRODUCT_ACCESS', 'Returns code UNAUTHORIZED_PRODUCT_ACCESS');

    // Seller 1 attempts to adjust stock of Seller 2 product
    const crossAdjustRes = await fetch(`${baseUrl}/api/v1/inventory/${product2.id}/adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken1}`,
      },
      body: JSON.stringify({
        action: 'increase',
        quantity: 10,
        reason: 'Malicious adjustment attempt',
      }),
    });
    assert(crossAdjustRes.status === 403, 'Seller 1 adjusting Seller 2 product stock returns 403 Forbidden');

    // Seller 1 attempts to update threshold of Seller 2 product
    const crossThreshRes = await fetch(`${baseUrl}/api/v1/inventory/${product2.id}/threshold`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken1}`,
      },
      body: JSON.stringify({ low_stock_threshold: 2 }),
    });
    assert(crossThreshRes.status === 403, 'Seller 1 updating Seller 2 product threshold returns 403 Forbidden');

    // --- 3. Atomic Stock Adjustments (Increase, Decrease, Set) ---
    console.log('\n--- 3. Atomic Stock Adjustments (Increase, Decrease, Set) ---');

    // A. Increase Stock
    const incRes = await fetch(`${baseUrl}/api/v1/inventory/${product1.id}/adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken1}`,
      },
      body: JSON.stringify({
        action: 'increase',
        quantity: 15,
        reason: 'Restock shipment received from supplier',
      }),
    });
    assert(incRes.status === 200, 'POST /inventory/:id/adjust (increase) returns 200');
    const incBody = await incRes.json();
    assert(incBody.data.previous_stock === 20, 'Previous stock was 20');
    assert(incBody.data.changed_quantity === 15, 'Changed quantity is +15');
    assert(incBody.data.new_stock === 35, 'New stock is 35 (20 + 15)');
    assert(incBody.data.action_type === 'increase', 'Action type is increase');

    // Verify DB updated
    const p1AfterInc = await Product.findByPk(product1.id);
    assert(p1AfterInc.stock === 35, 'Database product stock reflects 35');

    // B. Decrease Stock
    const decRes = await fetch(`${baseUrl}/api/v1/inventory/${product1.id}/adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken1}`,
      },
      body: JSON.stringify({
        action: 'decrease',
        quantity: 10,
        reason: 'Offline retail order fulfillment',
      }),
    });
    assert(decRes.status === 200, 'POST /inventory/:id/adjust (decrease) returns 200');
    const decBody = await decRes.json();
    assert(decBody.data.previous_stock === 35, 'Previous stock was 35');
    assert(decBody.data.changed_quantity === -10, 'Changed quantity is -10');
    assert(decBody.data.new_stock === 25, 'New stock is 25 (35 - 10)');
    assert(decBody.data.action_type === 'decrease', 'Action type is decrease');

    // C. Set Absolute Stock
    const setRes = await fetch(`${baseUrl}/api/v1/inventory/${product1.id}/adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken1}`,
      },
      body: JSON.stringify({
        action: 'set',
        quantity: 50,
        reason: 'Warehouse physical inventory count audit',
      }),
    });
    assert(setRes.status === 200, 'POST /inventory/:id/adjust (set) returns 200');
    const setBody = await setRes.json();
    assert(setBody.data.previous_stock === 25, 'Previous stock was 25');
    assert(setBody.data.new_stock === 50, 'New stock is 50');
    assert(setBody.data.changed_quantity === 25, 'Changed quantity is +25 (50 - 25)');
    assert(setBody.data.action_type === 'set', 'Action type is set');

    // D. PATCH /inventory/:id/stock alias works identically
    const patchAliasRes = await fetch(`${baseUrl}/api/v1/inventory/${product1.id}/stock`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken1}`,
      },
      body: JSON.stringify({
        action: 'increase',
        quantity: 5,
        reason: 'Stock addition via PATCH alias',
      }),
    });
    assert(patchAliasRes.status === 200, 'PATCH /inventory/:id/stock alias returns 200');
    const patchAliasBody = await patchAliasRes.json();
    assert(patchAliasBody.data.new_stock === 55, 'Stock updated to 55 via PATCH alias');

    // --- 4. Non-Negative Stock & Input Validation Safeguards ---
    console.log('\n--- 4. Non-Negative Stock & Input Validation Safeguards ---');

    // Decrease exceeding stock (e.g. stock is 55, attempt to decrease by 60)
    const oversellRes = await fetch(`${baseUrl}/api/v1/inventory/${product1.id}/adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken1}`,
      },
      body: JSON.stringify({
        action: 'decrease',
        quantity: 60,
        reason: 'Excessive decrease attempt',
      }),
    });
    assert(oversellRes.status === 400, 'Decreasing stock exceeding available quantity returns 400 Bad Request');
    const oversellBody = await oversellRes.json();
    assert(oversellBody.code === 'INSUFFICIENT_STOCK', 'Returns code INSUFFICIENT_STOCK');

    // Negative quantity rejected
    const negQtyRes = await fetch(`${baseUrl}/api/v1/inventory/${product1.id}/adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken1}`,
      },
      body: JSON.stringify({
        action: 'increase',
        quantity: -5,
        reason: 'Negative quantity test',
      }),
    });
    assert(negQtyRes.status === 400, 'Negative quantity rejected with 400 Bad Request');

    // Non-integer float quantity rejected
    const floatQtyRes = await fetch(`${baseUrl}/api/v1/inventory/${product1.id}/adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken1}`,
      },
      body: JSON.stringify({
        action: 'increase',
        quantity: 4.75,
        reason: 'Float quantity test',
      }),
    });
    assert(floatQtyRes.status === 400, 'Floating point quantity rejected with 400 Bad Request');

    // Missing / empty reason rejected
    const noReasonRes = await fetch(`${baseUrl}/api/v1/inventory/${product1.id}/adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken1}`,
      },
      body: JSON.stringify({
        action: 'increase',
        quantity: 10,
        reason: ' ',
      }),
    });
    assert(noReasonRes.status === 400, 'Blank reason rejected with 400 Bad Request');

    // Non-existent product ID
    const notFoundRes = await fetch(`${baseUrl}/api/v1/inventory/999999/adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken1}`,
      },
      body: JSON.stringify({
        action: 'increase',
        quantity: 10,
        reason: 'Non-existent product',
      }),
    });
    assert(notFoundRes.status === 404, 'Adjusting non-existent product returns 404 Not Found');

    // --- 5. Stock Change History & Audit Logs ---
    console.log('\n--- 5. Stock Change History & Audit Logs ---');

    // Query product stock history
    const historyRes = await fetch(`${baseUrl}/api/v1/inventory/${product1.id}/logs`, {
      headers: { Authorization: `Bearer ${sellerToken1}` },
    });
    assert(historyRes.status === 200, 'GET /inventory/:id/logs returns 200 OK');
    const historyBody = await historyRes.json();
    assert(Array.isArray(historyBody.data.logs), 'Logs is an array');
    assert(historyBody.data.logs.length === 4, 'Contains all 4 previous adjustments');

    // Inspect latest log
    const latestLog = historyBody.data.logs[0];
    assert(latestLog.product_id === product1.id, 'Log records correct product_id');
    assert(latestLog.vendor_id === vendor1.id, 'Log records correct seller/vendor_id');
    assert(latestLog.user_id === sellerUser1.id, 'Log records actor user_id');
    assert(latestLog.previous_stock === 50, 'Log records previous_stock (50)');
    assert(latestLog.changed_quantity === 5, 'Log records changed_quantity (+5)');
    assert(latestLog.new_stock === 55, 'Log records new_stock (55)');
    assert(latestLog.reason.includes('PATCH alias'), 'Log records reason accurately');
    assert(Boolean(latestLog.created_at), 'Log includes timestamp');
    assert(Boolean(latestLog.actor), 'Log includes actor profile details');

    // Cross-product activity logs
    const allLogsRes = await fetch(`${baseUrl}/api/v1/inventory/logs`, {
      headers: { Authorization: `Bearer ${sellerToken1}` },
    });
    assert(allLogsRes.status === 200, 'GET /api/v1/inventory/logs returns 200 OK');
    const allLogsBody = await allLogsRes.json();
    assert(allLogsBody.data.logs.length === 4, 'Seller 1 sees all 4 store logs');

    // --- 6. Low-Stock Threshold Configuration & Alerts ---
    console.log('\n--- 6. Low-Stock Threshold Configuration & Alerts ---');

    // Check product 2 (initial stock 3, threshold 10) in low-stock API
    const lowStockRes = await fetch(`${baseUrl}/api/v1/inventory/low-stock`, {
      headers: { Authorization: `Bearer ${sellerToken2}` },
    });
    assert(lowStockRes.status === 200, 'GET /inventory/low-stock returns 200 OK');
    const lowStockBody = await lowStockRes.json();
    assert(lowStockBody.data.products.length === 1, 'Seller 2 has 1 low-stock product');
    assert(lowStockBody.data.products[0].id === product2.id, 'Identifies Product 2 as low stock');
    assert(lowStockBody.data.products[0].is_low_stock === true, 'Product has is_low_stock: true');

    // Update threshold of product 1 to 60 (currently stock is 55, so it should become low-stock!)
    const updateThreshRes = await fetch(`${baseUrl}/api/v1/inventory/${product1.id}/threshold`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken1}`,
      },
      body: JSON.stringify({ low_stock_threshold: 60 }),
    });
    assert(updateThreshRes.status === 200, 'PATCH /inventory/:id/threshold returns 200 OK');
    const updateThreshBody = await updateThreshRes.json();
    assert(updateThreshBody.data.low_stock_threshold === 60, 'Threshold updated to 60');
    assert(updateThreshBody.data.is_low_stock === true, 'Product 1 now flagged as low-stock (stock 55 <= threshold 60)');

    // Verify product 1 now appears in Seller 1 low-stock list
    const seller1LowRes = await fetch(`${baseUrl}/api/v1/inventory/low-stock`, {
      headers: { Authorization: `Bearer ${sellerToken1}` },
    });
    const seller1LowBody = await seller1LowRes.json();
    assert(seller1LowBody.data.products.some((p) => p.id === product1.id), 'Product 1 appears in low-stock list');

    // Negative threshold rejected
    const negThreshRes = await fetch(`${baseUrl}/api/v1/inventory/${product1.id}/threshold`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken1}`,
      },
      body: JSON.stringify({ low_stock_threshold: -1 }),
    });
    assert(negThreshRes.status === 400, 'Negative low_stock_threshold rejected with 400');

    // --- 7. Concurrency Safety & Pessimistic Row Locking ---
    console.log('\n--- 7. Concurrency Safety & Atomic Concurrency Testing ---');

    // Product 1 current stock is 55. Let's set stock = 10 for concurrency test
    await fetch(`${baseUrl}/api/v1/inventory/${product1.id}/adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken1}`,
      },
      body: JSON.stringify({
        action: 'set',
        quantity: 10,
        reason: 'Reset stock to 10 for concurrency test',
      }),
    });

    // Send 3 simultaneous decrease requests of quantity 4 each (total 12 needed, but only 10 in stock)
    // Exactly 2 must succeed (4 + 4 = 8, leaving 2 in stock), and 1 must fail with 400 INSUFFICIENT_STOCK
    const concurrentRequests = [
      fetch(`${baseUrl}/api/v1/inventory/${product1.id}/adjust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sellerToken1}`,
        },
        body: JSON.stringify({
          action: 'decrease',
          quantity: 4,
          reason: 'Concurrent order 1',
        }),
      }),
      fetch(`${baseUrl}/api/v1/inventory/${product1.id}/adjust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sellerToken1}`,
        },
        body: JSON.stringify({
          action: 'decrease',
          quantity: 4,
          reason: 'Concurrent order 2',
        }),
      }),
      fetch(`${baseUrl}/api/v1/inventory/${product1.id}/adjust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sellerToken1}`,
        },
        body: JSON.stringify({
          action: 'decrease',
          quantity: 4,
          reason: 'Concurrent order 3',
        }),
      }),
    ];

    const results = await Promise.all(concurrentRequests);
    const statuses = results.map((r) => r.status);
    const successCount = statuses.filter((s) => s === 200).length;
    const failCount = statuses.filter((s) => s === 400).length;

    assert(successCount === 2, 'Exactly 2 concurrent requests succeed');
    assert(failCount === 1, 'Exactly 1 concurrent request fails with 400');

    const finalProduct = await Product.findByPk(product1.id);
    assert(finalProduct.stock === 2, 'Final stock is exactly 2 (10 - 4 - 4 = 2, zero overselling)');

    // --- 8. Admin Global Control ---
    console.log('\n--- 8. Admin Global Stock Management ---');

    // Admin adjusting Seller 2 product stock
    const adminAdjustRes = await fetch(`${baseUrl}/api/v1/inventory/${product2.id}/adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        action: 'increase',
        quantity: 100,
        reason: 'Admin marketplace promotion injection',
      }),
    });
    assert(adminAdjustRes.status === 200, 'Admin can adjust stock for any seller product');
    const adminAdjustBody = await adminAdjustRes.json();
    assert(adminAdjustBody.data.new_stock === 103, 'Stock updated to 103 (3 + 100)');

    // Admin can filter inventory by seller
    const adminSellerFilterRes = await fetch(`${baseUrl}/api/v1/inventory?vendor_id=${vendor2.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminSellerFilterRes.status === 200, 'Admin can filter inventory by vendor_id');
    const adminSellerFilterBody = await adminSellerFilterRes.json();
    assert(
      adminSellerFilterBody.data.products.every((p) => p.vendor_id === vendor2.id),
      'All returned products belong to requested vendor'
    );

    // --- 9. Clean Up Test Fixtures ---
    console.log('\n--- 9. Cleanup Test Fixtures ---');
    await InventoryLog.destroy({ where: {} });
    await Product.destroy({
      where: {
        sku: ['INV-TEST-PROD-01', 'INV-TEST-PROD-02', 'INV-TEST-PROD-03'],
      },
    });
    await Category.destroy({ where: { slug: 'inventory-test-cat' } });
    await Vendor.destroy({
      where: {
        store_email: [
          'inv.vendor1@market.test',
          'inv.vendor2@market.test',
          'inv.unappr@market.test',
        ],
      },
    });
    await User.destroy({
      where: {
        email: [
          'inv.admin@market.test',
          'inv.seller1@market.test',
          'inv.seller2@market.test',
          'inv.unappr.user@market.test',
          'inv.customer@market.test',
        ],
      },
    });
    console.log('Cleanup completed successfully.');
  } finally {
    server.close();
  }

  console.log('\n====================================================');
  console.log(` Inventory Test Results: ${passed} passed, ${failed} failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runInventoryTests().catch((err) => {
  console.error('Inventory test failed with unhandled error:', err);
  process.exit(1);
});
