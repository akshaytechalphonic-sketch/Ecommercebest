const assert = require('assert');
const {
  sequelize,
  User,
  Vendor,
  Product,
  Cart,
  CartItem,
  Order,
  OrderItem,
  Payment,
  Commission,
  SellerPayout,
  Refund,
} = require('../src/models');
const financialService = require('../src/services/financial.service');

async function runTests() {
  console.log('🚀 Starting Comprehensive Financial Suite Tests...\n');

  try {
    // 1. Setup Test Users: Customer & Vendor
    let customer = await User.findOne({ where: { email: 'fin_test_customer@example.com' } });
    if (!customer) {
      customer = await User.create({
        name: 'Finance Test Customer',
        email: 'fin_test_customer@example.com',
        password_hash: '$2b$10$abcdefghijklmnopqrstuv',
        role: 'customer',
      });
    }

    let vendorUser = await User.findOne({ where: { email: 'fin_test_vendor@example.com' } });
    if (!vendorUser) {
      vendorUser = await User.create({
        name: 'Finance Test Vendor',
        email: 'fin_test_vendor@example.com',
        password_hash: '$2b$10$abcdefghijklmnopqrstuv',
        role: 'vendor',
      });
    }

    let vendor = await Vendor.findOne({ where: { user_id: vendorUser.id } });
    if (!vendor) {
      vendor = await Vendor.create({
        user_id: vendorUser.id,
        store_name: 'Apex Electronics Store',
        store_slug: 'apex-electronics-store',
        commission_rate: 10.00, // 10% commission
        wallet_balance: 0.00,
        total_withdrawn: 0.00,
        status: 'approved',
      });
    } else {
      await vendor.update({
        commission_rate: 10.00,
        wallet_balance: 0.00,
        total_withdrawn: 0.00,
        status: 'approved',
      });
    }

    const { Category } = require('../src/models');
    let cat = await Category.findOne();
    if (!cat) {
      cat = await Category.create({ name: 'Electronics', slug: 'electronics' });
    }

    let product = await Product.findOne({ where: { name: 'Wireless Pro Headphones' } });
    if (!product) {
      product = await Product.create({
        vendor_id: vendor.id,
        category_id: cat.id,
        sku: 'HEADPHONES-PRO-001',
        name: 'Wireless Pro Headphones',
        slug: 'wireless-pro-headphones',
        price: 2000.00,
        stock: 50,
        status: 'active',
        approval_status: 'approved',
      });
    } else {
      await product.update({ stock: 50, price: 2000.00, status: 'active', approval_status: 'approved' });
    }

    console.log('✅ Test Fixtures (Customer, Vendor, Product) verified.');

    // 2. Setup Cart & Add Item (2 units @ 2000 = 4000)
    let cart = await Cart.findOne({ where: { user_id: customer.id } });
    if (!cart) {
      cart = await Cart.create({ user_id: customer.id });
    }
    await CartItem.destroy({ where: { cart_id: cart.id } });
    await CartItem.create({
      cart_id: cart.id,
      product_id: product.id,
      quantity: 2,
    });

    console.log('✅ Cart populated with 2 units of product.');

    // 3. Test Checkout & Order Creation
    const order = await financialService.createOrderFromCart(customer.id, { notes: 'Deliver in evening' });
    assert.strictEqual(parseFloat(order.total_amount), 4000.00, 'Order total must match item subtotal');
    assert.strictEqual(order.payment_status, 'pending', 'Initial order payment status must be pending');
    assert.strictEqual(order.items.length, 1, 'Order must contain 1 item line');
    assert.strictEqual(order.items[0].quantity, 2, 'Item quantity must be 2');

    // Verify cart is cleared
    const remainingItems = await CartItem.count({ where: { cart_id: cart.id } });
    assert.strictEqual(remainingItems, 0, 'Cart must be emptied after checkout');
    console.log(`✅ Order placed: ${order.order_number} (Total: ₹${order.total_amount}). Cart emptied.`);

    // 4. Test Payment & Commission Calculation
    const initialStock = product.stock;
    const paymentResult = await financialService.recordPayment({
      order_id: order.id,
      user_id: customer.id,
      amount: order.total_amount,
      payment_method: 'upi',
      gateway: 'razorpay',
      transaction_id: `TXN-TEST-${Date.now()}`,
    });

    assert.strictEqual(paymentResult.payment.status, 'completed', 'Payment status must be completed');
    assert.strictEqual(paymentResult.order.payment_status, 'paid', 'Order payment status must be paid');

    // Commission verification:
    // Gross: 4000.00, Rate: 10%, Commission: 400.00, Vendor net earning: 3600.00
    const commission = await Commission.findOne({ where: { order_id: order.id } });
    assert(commission, 'Commission record must exist');
    assert.strictEqual(parseFloat(commission.gross_amount), 4000.00, 'Gross must be 4000.00');
    assert.strictEqual(parseFloat(commission.commission_amount), 400.00, '10% Commission must be 400.00');
    assert.strictEqual(parseFloat(commission.vendor_earning), 3600.00, 'Vendor earning must be 3600.00');
    assert.strictEqual(commission.status, 'credited', 'Commission status must be credited');

    // Vendor balance check
    await vendor.reload();
    assert.strictEqual(parseFloat(vendor.wallet_balance), 3600.00, 'Vendor wallet balance must be ₹3600.00');

    // Product stock check (50 - 2 = 48)
    await product.reload();
    assert.strictEqual(product.stock, initialStock - 2, 'Product stock must be decremented by quantity purchased');
    console.log(`✅ Payment verified & Commissions calculated: Admin Commission = ₹${commission.commission_amount}, Vendor Balance = ₹${vendor.wallet_balance}, New Stock = ${product.stock}`);

    // 5. Test Withdrawal / Payout Request
    // Try requesting more than available balance -> should fail
    try {
      await financialService.requestWithdrawal(vendor.id, { amount: 5000.00 });
      assert.fail('Should fail when requesting amount exceeding wallet balance');
    } catch (err) {
      assert(err.message.includes('Insufficient wallet balance'), 'Must reject excessive payout');
    }

    // Valid withdrawal request for ₹1500.00
    const payout = await financialService.requestWithdrawal(vendor.id, {
      amount: 1500.00,
      payout_method: 'bank_transfer',
      account_details: { bank: 'HDFC', ifsc: 'HDFC0001', ac: '123456789' },
    });
    assert.strictEqual(payout.status, 'pending', 'Payout status must be pending');
    assert.strictEqual(parseFloat(payout.amount), 1500.00, 'Payout amount must match');

    // Verify held escrow: wallet_balance should now be 3600 - 1500 = 2100
    await vendor.reload();
    assert.strictEqual(parseFloat(vendor.wallet_balance), 2100.00, 'Vendor balance must be decremented by held payout');
    console.log(`✅ Withdrawal request created: ${payout.payout_number} for ₹1500. Vendor Balance held: ₹${vendor.wallet_balance}`);

    // Test Admin Approval of Withdrawal
    await financialService.processWithdrawal(payout.id, {
      action: 'approve',
      transaction_reference: 'UTR99887766',
      admin_notes: 'NEFT transferred',
    });
    await payout.reload();
    assert.strictEqual(payout.status, 'approved', 'Payout must be approved');
    assert.strictEqual(payout.transaction_reference, 'UTR99887766');

    await vendor.reload();
    assert.strictEqual(parseFloat(vendor.total_withdrawn), 1500.00, 'Vendor total_withdrawn must be updated');
    console.log(`✅ Withdrawal approved & settled. Total Withdrawn = ₹${vendor.total_withdrawn}`);

    // Test Withdrawal Rejection Reversal
    const payout2 = await financialService.requestWithdrawal(vendor.id, {
      amount: 1000.00,
      payout_method: 'upi',
    });
    await vendor.reload();
    assert.strictEqual(parseFloat(vendor.wallet_balance), 1100.00, 'Balance must be 1100 after 2nd payout hold');

    await financialService.processWithdrawal(payout2.id, {
      action: 'reject',
      rejection_reason: 'Incorrect UPI ID provided',
    });
    await vendor.reload();
    assert.strictEqual(parseFloat(vendor.wallet_balance), 2100.00, 'Balance must be refunded back to 2100 after rejection');
    console.log('✅ Withdrawal rejection successfully restored held balance back to vendor.');

    // 6. Test Returns & Refunds Management
    const refundRequest = await financialService.requestRefund(customer.id, {
      order_id: order.id,
      order_item_id: order.items[0].id,
      reason: 'Defective audio channel',
    });
    assert.strictEqual(refundRequest.status, 'requested', 'Initial refund status must be requested');
    assert.strictEqual(parseFloat(refundRequest.amount), 4000.00, 'Refund amount must match item amount');
    console.log(`✅ Refund request created: ${refundRequest.refund_number} for Order ${order.order_number}`);

    // Process & Approve Refund:
    // Should deduct vendor earning (₹3600) from vendor balance (2100 - 3600 = -1500)
    // Reverse commission
    // Restock product (48 + 2 = 50)
    // Update order & payment status to refunded
    const stockBeforeRefund = product.stock;
    await financialService.processRefund(refundRequest.id, {
      action: 'approve',
      gateway_refund_id: 'RFD_GATEWAY_123',
    });

    await refundRequest.reload();
    assert.strictEqual(refundRequest.status, 'refunded', 'Refund record must be marked refunded');
    assert.strictEqual(parseFloat(refundRequest.vendor_balance_deducted), 3600.00, 'Deducted amount must be 3600.00');

    await commission.reload();
    assert.strictEqual(commission.status, 'refunded', 'Commission ledger must be marked refunded');

    await product.reload();
    assert.strictEqual(product.stock, stockBeforeRefund + 2, 'Product stock must be restocked on return');

    const paymentRecord = await Payment.findOne({ where: { order_id: order.id } });
    assert.strictEqual(paymentRecord.status, 'refunded', 'Payment must be marked refunded');

    await order.reload();
    assert.strictEqual(order.payment_status, 'refunded', 'Order payment status must be refunded');
    assert.strictEqual(order.order_status, 'returned', 'Order status must be returned');

    console.log('✅ Refund approved: Vendor balance debited, commission reversed, product stock restocked, payment marked refunded.');

    // 7. Verify List APIs
    const paymentsList = await financialService.getPayments({ page: 1, limit: 5 });
    assert(paymentsList.payments.length > 0, 'Must retrieve payments list');
    assert(paymentsList.stats.total_collected !== undefined, 'Stats must include total collected');

    const withdrawalsList = await financialService.getWithdrawals({ page: 1, limit: 5 });
    assert(withdrawalsList.payouts.length > 0, 'Must retrieve withdrawals list');

    const commissionsList = await financialService.getCommissions({ page: 1, limit: 5 });
    assert(commissionsList.commissions.length > 0, 'Must retrieve commissions list');

    const refundsList = await financialService.getRefunds({ page: 1, limit: 5 });
    assert(refundsList.refunds.length > 0, 'Must retrieve refunds list');

    const vendorSummary = await financialService.getVendorEarningsSummary(vendor.id);
    assert(vendorSummary.vendor.store_name, 'Vendor summary must return store name');

    console.log('\n🎉 ALL 18 FINANCIAL SUITE TESTS PASSED SUCCESSFULLY! 🚀');
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  }
}

runTests();
