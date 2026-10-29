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
  Order,
  OrderItem,
  Commission,
  Payment,
  Withdrawal,
  Setting,
} = require('../src/models');
const { hashPassword } = require('../src/utils/password.util');
const { generateAccessToken } = require('../src/utils/token.util');
const financialService = require('../src/services/financial.service');

async function runCommissionEarningsTests() {
  console.log('====================================================');
  console.log('   STARTING COMMISSION & VENDOR EARNINGS TEST SUITE ');
  console.log('====================================================\n');

  await sequelize.authenticate();
  console.log('Sequelize connected.');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`Test server running at ${baseUrl}\n`);

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

  async function apiRequest(endpoint, method = 'GET', body = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${baseUrl}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  }

  try {
    // --- 0. Setup Fixtures & Users ---
    console.log('--- 0. Setting up Test Fixtures (Admin, Customer, Vendors) ---');

    const hashedPassword = await hashPassword('TestPassword123!');

    // Admin user
    let [adminUser] = await User.findOrCreate({
      where: { email: 'comm_admin@test.com' },
      defaults: {
        name: 'Super Admin',
        role: 'admin',
        password_hash: hashedPassword,
      },
    });
    const adminToken = generateAccessToken(adminUser);

    // Customer user
    let [customerUser] = await User.findOrCreate({
      where: { email: 'comm_customer@test.com' },
      defaults: {
        name: 'John Buyer',
        role: 'customer',
        password_hash: hashedPassword,
      },
    });
    const customerToken = generateAccessToken(customerUser);

    // Vendor 1: Custom 15% commission rate
    let [vendor1User] = await User.findOrCreate({
      where: { email: 'comm_vendor1@test.com' },
      defaults: {
        name: 'Vendor One',
        role: 'vendor',
        password_hash: hashedPassword,
      },
    });
    const vendor1Token = generateAccessToken(vendor1User);

    let [vendor1] = await Vendor.findOrCreate({
      where: { user_id: vendor1User.id },
      defaults: {
        store_name: 'Premium Electronics Store',
        store_slug: 'premium-electronics-store-test',
        store_email: 'store1@test.com',
        commission_rate: 15.00,
        status: 'approved',
        wallet_balance: 0.00,
        total_withdrawn: 0.00,
      },
    });
    await vendor1.update({ commission_rate: 15.00, wallet_balance: 0.00, status: 'approved' });

    // Vendor 2: Default 10% commission rate
    let [vendor2User] = await User.findOrCreate({
      where: { email: 'comm_vendor2@test.com' },
      defaults: {
        name: 'Vendor Two',
        role: 'vendor',
        password_hash: hashedPassword,
      },
    });
    const vendor2Token = generateAccessToken(vendor2User);

    let [vendor2] = await Vendor.findOrCreate({
      where: { user_id: vendor2User.id },
      defaults: {
        store_name: 'Standard Books Store',
        store_slug: 'standard-books-store-test',
        store_email: 'store2@test.com',
        commission_rate: 10.00,
        status: 'approved',
        wallet_balance: 0.00,
        total_withdrawn: 0.00,
      },
    });
    await vendor2.update({ commission_rate: 10.00, wallet_balance: 0.00, status: 'approved' });

    // Test Category
    let [category] = await Category.findOrCreate({
      where: { slug: 'comm-test-category' },
      defaults: { name: 'Commission Test Category', is_active: true },
    });

    // Test Products
    let [product1] = await Product.findOrCreate({
      where: { sku: 'COMM-TEST-P1' },
      defaults: {
        vendor_id: vendor1.id,
        category_id: category.id,
        name: 'Premium Wireless Headphones',
        slug: 'comm-test-p1-headphones',
        price: 2000.00,
        stock: 50,
        status: 'active',
        approval_status: 'approved',
      },
    });
    await product1.update({ stock: 50, price: 2000.00, status: 'active', approval_status: 'approved' });

    let [product2] = await Product.findOrCreate({
      where: { sku: 'COMM-TEST-P2' },
      defaults: {
        vendor_id: vendor2.id,
        category_id: category.id,
        name: 'Node.js Mastery Book',
        slug: 'comm-test-p2-book',
        price: 1000.00,
        stock: 40,
        status: 'active',
        approval_status: 'approved',
      },
    });
    await product2.update({ stock: 40, price: 1000.00, status: 'active', approval_status: 'approved' });

    // --- TEST 1: Commission Rate Resolution Hierarchy ---
    console.log('\n--- TEST 1: Commission Rate Resolution Hierarchy ---');
    const rate1 = await financialService.getEffectiveCommissionRate(vendor1.id);
    const rate2 = await financialService.getEffectiveCommissionRate(vendor2.id);
    assert(rate1 === 15.00, 'Vendor 1 respects custom commission rate (15%)', `Got: ${rate1}`);
    assert(rate2 === 10.00, 'Vendor 2 respects default commission rate (10%)', `Got: ${rate2}`);

    // --- TEST 2: Order Checkout & Commission Calculation ---
    console.log('\n--- TEST 2: Order Checkout & Initial Pending Commission Ledger ---');

    // Setup Cart for customer
    await CartItem.destroy({ where: {} });
    await Cart.destroy({ where: { user_id: customerUser.id } });

    const cart = await Cart.create({ user_id: customerUser.id });
    // Add 2 of product1 (2 x 2000 = 4000) and 1 of product2 (1 x 1000 = 1000)
    await CartItem.create({ cart_id: cart.id, product_id: product1.id, quantity: 2 });
    await CartItem.create({ cart_id: cart.id, product_id: product2.id, quantity: 1 });

    const checkoutRes = await apiRequest('/api/v1/orders/checkout', 'POST', {
      notes: 'Commission test order',
    }, customerToken);

    assert(checkoutRes.status === 201, 'Customer can checkout cart into order', `Status: ${checkoutRes.status}`);
    const createdOrder = checkoutRes.data.data;
    assert(createdOrder && createdOrder.id, 'Created order has valid ID');
    assert(Number(createdOrder.total_amount) === 5000, 'Order total matches 4000 + 1000 = 5000', `Got: ${createdOrder.total_amount}`);

    // Verify Commission entries generated in Pending status
    const commEntries = await Commission.findAll({
      where: { order_id: createdOrder.id },
      order: [['id', 'ASC']],
    });
    assert(commEntries.length === 2, 'Commissions created for both order items', `Got count: ${commEntries.length}`);

    // Item 1: Gross 4000, 15% rate -> Comm 600, Net 3400
    const comm1 = commEntries.find((c) => c.vendor_id === vendor1.id);
    assert(comm1 !== undefined, 'Commission entry exists for Vendor 1');
    assert(Number(comm1.gross_amount) === 4000, 'Item 1 gross amount is 4000', `Got: ${comm1.gross_amount}`);
    assert(Number(comm1.commission_rate) === 15.00, 'Item 1 commission rate is 15%', `Got: ${comm1.commission_rate}`);
    assert(Number(comm1.commission_amount) === 600, 'Item 1 admin commission is 600 (15% of 4000)', `Got: ${comm1.commission_amount}`);
    assert(Number(comm1.vendor_earning) === 3400, 'Item 1 vendor net earning is 3400', `Got: ${comm1.vendor_earning}`);
    assert(comm1.status === 'pending', 'Item 1 initial commission status is pending');
    assert(comm1.settlement_status === 'unsettled', 'Item 1 initial settlement status is unsettled');

    // Item 2: Gross 1000, 10% rate -> Comm 100, Net 900
    const comm2 = commEntries.find((c) => c.vendor_id === vendor2.id);
    assert(comm2 !== undefined, 'Commission entry exists for Vendor 2');
    assert(Number(comm2.gross_amount) === 1000, 'Item 2 gross amount is 1000', `Got: ${comm2.gross_amount}`);
    assert(Number(comm2.commission_rate) === 10.00, 'Item 2 commission rate is 10%', `Got: ${comm2.commission_rate}`);
    assert(Number(comm2.commission_amount) === 100, 'Item 2 admin commission is 100 (10% of 1000)', `Got: ${comm2.commission_amount}`);
    assert(Number(comm2.vendor_earning) === 900, 'Item 2 vendor net earning is 900', `Got: ${comm2.vendor_earning}`);
    assert(comm2.status === 'pending', 'Item 2 initial commission status is pending');

    // --- TEST 3: Idempotency & Duplicate Prevention ---
    console.log('\n--- TEST 3: Idempotency & Database Constraint (order_item_id unique) ---');
    try {
      // Direct insertion attempt on same order_item_id should violate UNIQUE constraint
      await Commission.create({
        order_id: createdOrder.id,
        order_item_id: comm1.order_item_id,
        vendor_id: vendor1.id,
        gross_amount: 4000,
        commission_rate: 15.00,
        commission_amount: 600,
        vendor_earning: 3400,
        status: 'pending',
      });
      assert(false, 'Duplicate commission insert should fail due to UNIQUE constraint');
    } catch (dbErr) {
      assert(true, 'Database UNIQUE constraint prevented duplicate commission entry');
    }

    // Service method idempotency
    const reCalc = await financialService.calculateOrderItemCommission({
      order: createdOrder,
      orderItem: { id: comm1.order_item_id, vendor_id: vendor1.id, total_price: 4000, quantity: 2 },
      status: 'pending',
    });
    assert(reCalc.id === comm1.id, 'Idempotent calculateOrderItemCommission returns existing commission without re-creating');

    // --- TEST 4: Payment Recording & Atomic Wallet Crediting ---
    console.log('\n--- TEST 4: Payment Recording & Vendor Wallet Crediting ---');
    const prevVendor1 = await Vendor.findByPk(vendor1.id);
    const initialWallet1 = Number(prevVendor1.wallet_balance);

    const paymentRes = await apiRequest('/api/v1/payments', 'POST', {
      order_id: createdOrder.id,
      amount: 5000,
      payment_method: 'card',
      gateway: 'stripe',
      transaction_id: `txn_test_${Date.now()}`,
    }, customerToken);

    assert(paymentRes.status === 201, 'Payment recorded successfully', `Status: ${paymentRes.status}`);

    // Verify commissions moved to 'credited'
    await comm1.reload();
    await comm2.reload();
    assert(comm1.status === 'credited', 'Vendor 1 commission transitioned from pending to credited');
    assert(comm2.status === 'credited', 'Vendor 2 commission transitioned from pending to credited');

    // Verify Vendor 1 wallet credited with 3400
    await vendor1.reload();
    const updatedWallet1 = Number(vendor1.wallet_balance);
    assert(
      updatedWallet1 === initialWallet1 + 3400,
      `Vendor 1 wallet atomically incremented by 3400 (was: ${initialWallet1}, now: ${updatedWallet1})`
    );

    // Verify Vendor 2 wallet credited with 900
    await vendor2.reload();
    assert(Number(vendor2.wallet_balance) === 900, `Vendor 2 wallet credited with 900`);

    // --- TEST 5: Role-Based Financial Data Isolation ---
    console.log('\n--- TEST 5: Role-Based Financial Data Isolation ---');

    // Vendor 1 queries commissions: should only see their own
    const vendor1CommRes = await apiRequest('/api/v1/commissions', 'GET', null, vendor1Token);
    assert(vendor1CommRes.status === 200, 'Vendor 1 can query commissions ledger');
    const v1List = vendor1CommRes.data.data;
    const hasOtherVendor = v1List.some((c) => c.vendor_id !== vendor1.id);
    assert(!hasOtherVendor, 'Vendor 1 cannot see commissions belonging to other vendors (Data Isolation Enforced)');

    // Vendor queries their financial earnings summary
    const v1SummaryRes = await apiRequest('/api/v1/commissions/vendor', 'GET', null, vendor1Token);
    assert(v1SummaryRes.status === 200, 'Vendor can get earnings summary');
    const v1Data = v1SummaryRes.data.data;
    assert(Number(v1Data.vendor.wallet_balance) === 3400, 'Summary reflects live available wallet balance', `Got: ${v1Data.vendor.wallet_balance}`);
    assert(v1Data.effective_commission_rate === 15, 'Summary returns effective commission rate 15%');

    // Admin queries overall overview reports
    const overviewRes = await apiRequest('/api/v1/commissions/reports/overview', 'GET', null, adminToken);
    assert(overviewRes.status === 200, 'Admin can access commission reports overview');
    assert(overviewRes.data.data.platform_summary !== undefined, 'Reports overview contains platform_summary');
    assert(overviewRes.data.data.vendor_breakdown.length > 0, 'Reports overview contains vendor_breakdown');

    // Non-admin cannot access admin overview report
    const nonAdminReportRes = await apiRequest('/api/v1/commissions/reports/overview', 'GET', null, vendor1Token);
    assert(nonAdminReportRes.status === 403, 'Non-admin/vendor blocked from platform overview reports (403 Forbidden)');

    // --- TEST 6: Order Cancellation & Earning Reversal ---
    console.log('\n--- TEST 6: Order Cancellation & Earning Reversal ---');

    // Check inventory stock before cancel
    await product1.reload();
    const stockBeforeCancel = product1.stock;

    // Customer cancels order
    const cancelRes = await apiRequest(`/api/v1/orders/${createdOrder.id}/cancel`, 'POST', {
      reason: 'Customer requested cancellation for test',
    }, customerToken);

    assert(cancelRes.status === 200, 'Order cancelled successfully via cancellation endpoint');

    // Check commission updated to cancelled
    await comm1.reload();
    assert(comm1.status === 'cancelled', 'Commission status transitioned to cancelled');

    // Check vendor wallet reversed
    await vendor1.reload();
    assert(
      Number(vendor1.wallet_balance) === initialWallet1,
      `Vendor 1 wallet earning reversed back to initial balance (${vendor1.wallet_balance})`
    );

    // Check inventory restored
    await product1.reload();
    assert(
      product1.stock === stockBeforeCancel + 2,
      `Inventory stock restored by 2 units (was: ${stockBeforeCancel}, now: ${product1.stock})`
    );

    // --- TEST 7: Payout Settlement Lifecycle ---
    console.log('\n--- TEST 7: Payout Settlement Lifecycle ---');

    // Give vendor 2 a credited commission and balance
    await vendor2.update({ wallet_balance: 5000.00, total_withdrawn: 0.00 });

    // Vendor requests withdrawal
    const withdrawRes = await apiRequest('/api/v1/payouts/request', 'POST', {
      amount: 2000.00,
      payout_method: 'bank_transfer',
      account_details: { account_number: '1234567890', ifsc: 'HDFC0001234' },
    }, vendor2Token);

    assert(withdrawRes.status === 201, 'Vendor can request withdrawal payout', `Status: ${withdrawRes.status}`);
    const payout = withdrawRes.data.data;
    assert(payout && payout.status === 'pending', 'Withdrawal initial status is pending');

    // Admin approves/processes withdrawal
    const processRes = await apiRequest(`/api/v1/payouts/${payout.id}/process`, 'PUT', {
      action: 'approve',
      reference: 'UTR_TEST_998877',
      admin_note: 'Approved test payout',
    }, adminToken);

    assert(processRes.status === 200, 'Admin can approve withdrawal payout');
    assert(processRes.data.data.status === 'approved', 'Payout status updated to approved');

    await vendor2.reload();
    assert(Number(vendor2.wallet_balance) === 3000.00, 'Vendor wallet deducted to 3000.00');
    assert(Number(vendor2.total_withdrawn) === 2000.00, 'Vendor total_withdrawn updated to 2000.00');

    console.log('\n====================================================');
    console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');

    if (failed > 0) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Unexpected error during test execution:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

runCommissionEarningsTests().then(() => {
  setTimeout(() => process.exit(process.exitCode || 0), 1000);
});
