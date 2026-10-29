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
} = require('../src/models');
const { hashPassword } = require('../src/utils/password.util');
const { generateAccessToken } = require('../src/utils/token.util');

async function runCartTests() {
  console.log('====================================================');
  console.log('       STARTING SHOPPING CART MODULE TEST SUITE     ');
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
    // --- 0. Database Test Fixture Setup & Cleanup ---
    console.log('\n--- 0. Database Test Fixture Setup & Cleanup ---');

    // Clean up any previous test records
    await CartItem.destroy({ where: {} });
    await Cart.destroy({ where: {} });
    await Product.destroy({
      where: {
        sku: [
          'CART-TEST-PROD-01',
          'CART-TEST-PROD-02',
          'CART-TEST-INACTIVE',
          'CART-TEST-UNAPPROVED',
          'CART-TEST-REJ-VENDOR',
          'CART-TEST-LOW-STOCK',
        ],
      },
    });
    await Category.destroy({ where: { slug: 'cart-test-cat' } });
    await Vendor.destroy({ where: { store_slug: ['cart-approved-store', 'cart-rejected-store'] } });
    await User.destroy({
      where: {
        email: [
          'cart_cust1@test.com',
          'cart_cust2@test.com',
          'cart_vendor_appr@test.com',
          'cart_vendor_rej@test.com',
        ],
      },
    });

    const hashedPassword = await hashPassword('Password@123');

    // Create 2 test customers
    const customer1 = await User.create({
      name: 'Cart Customer One',
      email: 'cart_cust1@test.com',
      password_hash: hashedPassword,
      phone: '9800000011',
      role: 'customer',
      status: 'active',
      is_verified: true,
    });
    const tokenCust1 = generateAccessToken(customer1);

    const customer2 = await User.create({
      name: 'Cart Customer Two',
      email: 'cart_cust2@test.com',
      password_hash: hashedPassword,
      phone: '9800000012',
      role: 'customer',
      status: 'active',
      is_verified: true,
    });
    const tokenCust2 = generateAccessToken(customer2);

    // Create Approved Vendor
    const vendorUser1 = await User.create({
      name: 'Approved Store Owner',
      email: 'cart_vendor_appr@test.com',
      password_hash: hashedPassword,
      phone: '9800000013',
      role: 'vendor',
      status: 'active',
      is_verified: true,
    });
    const approvedVendor = await Vendor.create({
      user_id: vendorUser1.id,
      store_name: 'Cart Approved Store',
      store_slug: 'cart-approved-store',
      store_email: 'cart_vendor_appr@test.com',
      status: 'approved',
      approved_at: new Date(),
    });

    // Create Rejected Vendor
    const vendorUser2 = await User.create({
      name: 'Rejected Store Owner',
      email: 'cart_vendor_rej@test.com',
      password_hash: hashedPassword,
      phone: '9800000014',
      role: 'vendor',
      status: 'active',
      is_verified: true,
    });
    const rejectedVendor = await Vendor.create({
      user_id: vendorUser2.id,
      store_name: 'Cart Rejected Store',
      store_slug: 'cart-rejected-store',
      store_email: 'cart_vendor_rej@test.com',
      status: 'rejected',
      rejection_reason: 'Fraudulent documents',
    });

    // Create Category
    const category = await Category.create({
      name: 'Cart Test Category',
      slug: 'cart-test-cat',
      status: 'active',
    });

    // Create Products with varied pricing, statuses and stock
    // Product 1: Approved, regular 1000, discount 800, stock 15
    const product1 = await Product.create({
      vendor_id: approvedVendor.id,
      category_id: category.id,
      name: 'Wireless Ergonomic Keyboard',
      slug: 'cart-test-keyboard',
      sku: 'CART-TEST-PROD-01',
      price: 1000.00,
      discount_price: 800.00,
      stock: 15,
      status: 'active',
      approval_status: 'approved',
    });

    // Product 2: Approved, regular 500, no discount, stock 10
    const product2 = await Product.create({
      vendor_id: approvedVendor.id,
      category_id: category.id,
      name: 'Precision Optical Mouse',
      slug: 'cart-test-mouse',
      sku: 'CART-TEST-PROD-02',
      price: 500.00,
      discount_price: null,
      stock: 10,
      status: 'active',
      approval_status: 'approved',
    });

    // Product 3: Inactive product (status: inactive)
    const inactiveProduct = await Product.create({
      vendor_id: approvedVendor.id,
      category_id: category.id,
      name: 'Discontinued Desk Mat',
      slug: 'cart-test-desk-mat',
      sku: 'CART-TEST-INACTIVE',
      price: 300.00,
      stock: 20,
      status: 'inactive',
      approval_status: 'approved',
    });

    // Product 4: Unapproved product (approval_status: pending)
    const unapprovedProduct = await Product.create({
      vendor_id: approvedVendor.id,
      category_id: category.id,
      name: 'Unmoderated Monitor Stand',
      slug: 'cart-test-monitor-stand',
      sku: 'CART-TEST-UNAPPROVED',
      price: 1200.00,
      stock: 5,
      status: 'active',
      approval_status: 'pending',
    });

    // Product 5: Product from REJECTED vendor
    const rejectedVendorProduct = await Product.create({
      vendor_id: rejectedVendor.id,
      category_id: category.id,
      name: 'Banned Seller Cable',
      slug: 'cart-test-banned-cable',
      sku: 'CART-TEST-REJ-VENDOR',
      price: 200.00,
      stock: 30,
      status: 'active',
      approval_status: 'approved',
    });

    // Product 6: Low Stock Product (stock: 2)
    const lowStockProduct = await Product.create({
      vendor_id: approvedVendor.id,
      category_id: category.id,
      name: 'Limited Edition Keycap',
      slug: 'cart-test-limited-keycap',
      sku: 'CART-TEST-LOW-STOCK',
      price: 450.00,
      stock: 2,
      status: 'active',
      approval_status: 'approved',
    });

    console.log('Test fixtures created successfully.');

    // --- 1. Unauthorized Access Tests ---
    console.log('\n--- 1. Unauthorized Access Enforcement ---');
    {
      const res = await fetch(`${baseUrl}/api/v1/cart`);
      assert(res.status === 401, 'GET /api/v1/cart without auth returns 401');
    }
    {
      const res = await fetch(`${baseUrl}/api/v1/cart/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: product1.id, quantity: 1 }),
      });
      assert(res.status === 401, 'POST /api/v1/cart/items without auth returns 401');
    }
    {
      const res = await fetch(`${baseUrl}/api/v1/cart/items/1`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: 2 }),
      });
      assert(res.status === 401, 'PUT /api/v1/cart/items/:id without auth returns 401');
    }
    {
      const res = await fetch(`${baseUrl}/api/v1/cart/items/1`, { method: 'DELETE' });
      assert(res.status === 401, 'DELETE /api/v1/cart/items/:id without auth returns 401');
    }
    {
      const res = await fetch(`${baseUrl}/api/v1/cart`, { method: 'DELETE' });
      assert(res.status === 401, 'DELETE /api/v1/cart without auth returns 401');
    }

    // --- 2. Initial Empty Cart Retrieval ---
    console.log('\n--- 2. Initial Empty Cart Retrieval ---');
    {
      const res = await fetch(`${baseUrl}/api/v1/cart`, {
        headers: { Authorization: `Bearer ${tokenCust1}` },
      });
      const data = await res.json();
      assert(res.status === 200, 'GET /api/v1/cart returns 200 OK');
      assert(data.success === true, 'Response indicates success: true');
      assert(Array.isArray(data.data.items), 'Cart items is an array');
      assert(data.data.items.length === 0, 'New customer cart is empty initially');
      assert(data.data.total_items === 0, 'total_items is 0');
      assert(data.data.subtotal === 0, 'subtotal is 0');
      assert(data.data.total_price === 0, 'total_price is 0');
    }

    // --- 3. Add to Cart & Validation Tests ---
    console.log('\n--- 3. Add Product to Cart & Validation Checks ---');

    // 3a. Rejects missing / invalid product_id
    {
      const res = await fetch(`${baseUrl}/api/v1/cart/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenCust1}`,
        },
        body: JSON.stringify({ product_id: 'invalid-id' }),
      });
      assert(res.status === 400, 'POST /cart/items with invalid product_id returns 400 Bad Request');
    }

    // 3b. Rejects non-existent product
    {
      const res = await fetch(`${baseUrl}/api/v1/cart/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenCust1}`,
        },
        body: JSON.stringify({ product_id: 999999, quantity: 1 }),
      });
      const data = await res.json();
      assert(res.status === 404, 'POST /cart/items with non-existent product returns 404');
      assert(data.code === 'PRODUCT_NOT_FOUND', 'Returns error code PRODUCT_NOT_FOUND');
    }

    // 3c. Rejects inactive product
    {
      const res = await fetch(`${baseUrl}/api/v1/cart/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenCust1}`,
        },
        body: JSON.stringify({ product_id: inactiveProduct.id, quantity: 1 }),
      });
      const data = await res.json();
      assert(res.status === 400, 'POST /cart/items with inactive product returns 400');
      assert(data.code === 'PRODUCT_INACTIVE', 'Returns error code PRODUCT_INACTIVE');
    }

    // 3d. Rejects unapproved product
    {
      const res = await fetch(`${baseUrl}/api/v1/cart/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenCust1}`,
        },
        body: JSON.stringify({ product_id: unapprovedProduct.id, quantity: 1 }),
      });
      const data = await res.json();
      assert(res.status === 400, 'POST /cart/items with unapproved product returns 400');
      assert(data.code === 'PRODUCT_NOT_APPROVED', 'Returns error code PRODUCT_NOT_APPROVED');
    }

    // 3e. Rejects product from unapproved/rejected vendor
    {
      const res = await fetch(`${baseUrl}/api/v1/cart/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenCust1}`,
        },
        body: JSON.stringify({ product_id: rejectedVendorProduct.id, quantity: 1 }),
      });
      const data = await res.json();
      assert(res.status === 400, 'POST /cart/items with product from rejected vendor returns 400');
      assert(data.code === 'VENDOR_NOT_APPROVED', 'Returns error code VENDOR_NOT_APPROVED');
    }

    // 3f. Rejects quantity exceeding stock
    {
      const res = await fetch(`${baseUrl}/api/v1/cart/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenCust1}`,
        },
        body: JSON.stringify({ product_id: lowStockProduct.id, quantity: 5 }), // stock is only 2
      });
      const data = await res.json();
      assert(res.status === 400, 'POST /cart/items with quantity > stock returns 400');
      assert(data.code === 'INSUFFICIENT_STOCK', 'Returns error code INSUFFICIENT_STOCK');
    }

    // 3g. Successfully adds active, approved product
    let cartItemId1;
    {
      const res = await fetch(`${baseUrl}/api/v1/cart/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenCust1}`,
        },
        body: JSON.stringify({ product_id: product1.id, quantity: 2 }),
      });
      const data = await res.json();
      assert(res.status === 200, 'POST /cart/items with valid product returns 200 OK');
      assert(data.success === true, 'Indicates success: true');
      assert(data.data.items.length === 1, 'Cart has 1 item');
      assert(data.data.items[0].product_id === product1.id, 'Cart item references correct product_id');
      assert(data.data.items[0].quantity === 2, 'Quantity is 2');
      assert(data.data.items[0].price === 800, 'Uses discount price 800 instead of 1000');
      assert(data.data.items[0].item_total === 1600, 'Item total is 1600 (800 * 2)');
      assert(data.data.subtotal === 2000, 'Subtotal is 2000 (1000 * 2)');
      assert(data.data.discount_total === 400, 'Discount total is 400 (200 * 2)');
      assert(data.data.total_price === 1600, 'Total price is 1600');
      cartItemId1 = data.data.items[0].id;
    }

    // --- 4. Duplicate Prevention & Quantity Increment Test ---
    console.log('\n--- 4. Duplicate Prevention & Quantity Increment ---');
    {
      // Add Product 1 AGAIN with quantity 1
      const res = await fetch(`${baseUrl}/api/v1/cart/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenCust1}`,
        },
        body: JSON.stringify({ product_id: product1.id, quantity: 1 }),
      });
      const data = await res.json();
      assert(res.status === 200, 'POST /cart/items for existing product returns 200');
      assert(data.data.items.length === 1, 'Cart STILL has exactly 1 item (no duplicate row created)');
      assert(data.data.items[0].quantity === 3, 'Quantity updated from 2 to 3 (2 + 1)');
      assert(data.data.total_items === 3, 'total_items updated to 3');
      assert(data.data.total_price === 2400, 'Total price updated to 2400 (800 * 3)');
    }

    // Adding second distinct product (Product 2)
    let cartItemId2;
    {
      const res = await fetch(`${baseUrl}/api/v1/cart/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenCust1}`,
        },
        body: JSON.stringify({ product_id: product2.id, quantity: 2 }),
      });
      const data = await res.json();
      assert(res.status === 200, 'POST /cart/items with second product returns 200');
      assert(data.data.items.length === 2, 'Cart now contains 2 distinct items');
      assert(data.data.total_items === 5, 'Total quantity across products is 5 (3 + 2)');
      // Product 1: 3 * 800 = 2400 (regular 3000)
      // Product 2: 2 * 500 = 1000 (regular 1000)
      assert(data.data.subtotal === 4000, 'Subtotal is 4000 (3000 + 1000)');
      assert(data.data.discount_total === 600, 'Discount total is 600');
      assert(data.data.total_price === 3400, 'Total price is 3400 (4000 - 600)');
      cartItemId2 = data.data.items.find((i) => i.product_id === product2.id).id;
    }

    // Duplicate addition that would exceed stock is blocked
    {
      // Product 1 has stock 15, current in cart is 3. Adding 13 more -> total 16 > 15
      const res = await fetch(`${baseUrl}/api/v1/cart/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenCust1}`,
        },
        body: JSON.stringify({ product_id: product1.id, quantity: 13 }),
      });
      const data = await res.json();
      assert(res.status === 400, 'Adding duplicate product that exceeds stock returns 400');
      assert(data.code === 'INSUFFICIENT_STOCK', 'Returns INSUFFICIENT_STOCK code');
    }

    // --- 5. Cart Inspection & Totals Verification ---
    console.log('\n--- 5. Cart Inspection & Totals Verification ---');
    {
      const res = await fetch(`${baseUrl}/api/v1/cart`, {
        headers: { Authorization: `Bearer ${tokenCust1}` },
      });
      const data = await res.json();
      assert(res.status === 200, 'GET /api/v1/cart returns 200');
      assert(data.data.items.length === 2, 'Contains 2 items');
      assert(data.data.items_count === 2, 'items_count is 2');
      assert(data.data.total_items === 5, 'total_items is 5');
      assert(data.data.total_price === 3400, 'total_price is 3400');

      // Check item details formatting
      const item1 = data.data.items.find((i) => i.product_id === product1.id);
      assert(item1.product.name === 'Wireless Ergonomic Keyboard', 'Item product name matches');
      assert(item1.product.sku === 'CART-TEST-PROD-01', 'Item product SKU matches');
      assert(item1.product.vendor.store_name === 'Cart Approved Store', 'Item product vendor matches');
      assert(item1.is_available === true, 'is_available flag is true for approved active product');
      assert(item1.has_sufficient_stock === true, 'has_sufficient_stock is true');
    }

    // --- 6. Update Cart Item Quantity Tests ---
    console.log('\n--- 6. Update Cart Item Quantity Tests ---');
    {
      // Update quantity of Product 2 from 2 to 4
      const res = await fetch(`${baseUrl}/api/v1/cart/items/${cartItemId2}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenCust1}`,
        },
        body: JSON.stringify({ quantity: 4 }),
      });
      const data = await res.json();
      assert(res.status === 200, 'PUT /api/v1/cart/items/:id returns 200');
      const item2 = data.data.items.find((i) => i.id === cartItemId2);
      assert(item2.quantity === 4, 'Product 2 quantity updated to 4');
      assert(data.data.total_items === 7, 'Total items now 7 (3 + 4)');
      // Product 1: 3 * 800 = 2400
      // Product 2: 4 * 500 = 2000
      assert(data.data.total_price === 4400, 'Total price recomputed to 4400');
    }

    // Quantity update exceeding stock is rejected
    {
      const res = await fetch(`${baseUrl}/api/v1/cart/items/${cartItemId2}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenCust1}`,
        },
        body: JSON.stringify({ quantity: 99 }), // stock is only 10
      });
      const data = await res.json();
      assert(res.status === 400, 'PUT /cart/items/:id with quantity > stock returns 400');
      assert(data.code === 'INSUFFICIENT_STOCK', 'Returns INSUFFICIENT_STOCK error code');
    }

    // Quantity update with 0 or negative is rejected by validation
    {
      const res = await fetch(`${baseUrl}/api/v1/cart/items/${cartItemId2}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenCust1}`,
        },
        body: JSON.stringify({ quantity: 0 }),
      });
      assert(res.status === 400, 'PUT /cart/items/:id with quantity: 0 returns 400 validation error');
    }

    // --- 7. Remove Item from Cart Tests ---
    console.log('\n--- 7. Remove Item from Cart Tests ---');
    {
      const res = await fetch(`${baseUrl}/api/v1/cart/items/${cartItemId2}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenCust1}` },
      });
      const data = await res.json();
      assert(res.status === 200, 'DELETE /api/v1/cart/items/:id returns 200');
      assert(data.data.items.length === 1, 'Cart now has only 1 item left');
      assert(data.data.items[0].product_id === product1.id, 'Remaining item is Product 1');
      assert(data.data.total_price === 2400, 'Total price recomputed to 2400');
    }

    // Removing non-existent item returns 404
    {
      const res = await fetch(`${baseUrl}/api/v1/cart/items/999999`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenCust1}` },
      });
      assert(res.status === 404, 'DELETE /cart/items/999999 returns 404');
    }

    // --- 8. Customer Isolation & Security Tests ---
    console.log('\n--- 8. Customer Cart Isolation & Security ---');
    {
      // Customer 2 views cart: should be empty
      const res2 = await fetch(`${baseUrl}/api/v1/cart`, {
        headers: { Authorization: `Bearer ${tokenCust2}` },
      });
      const data2 = await res2.json();
      assert(data2.data.items.length === 0, 'Customer 2 cart is completely isolated and empty');

      // Customer 2 tries to update Customer 1's cart item: 404
      const resUpdate = await fetch(`${baseUrl}/api/v1/cart/items/${cartItemId1}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenCust2}`,
        },
        body: JSON.stringify({ quantity: 1 }),
      });
      assert(resUpdate.status === 404, 'Customer 2 cannot update Customer 1 cart item (returns 404)');

      // Customer 2 tries to delete Customer 1's cart item: 404
      const resDel = await fetch(`${baseUrl}/api/v1/cart/items/${cartItemId1}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenCust2}` },
      });
      assert(resDel.status === 404, 'Customer 2 cannot delete Customer 1 cart item (returns 404)');

      // Customer 2 adds an item to Customer 2's own cart
      const resAdd = await fetch(`${baseUrl}/api/v1/cart/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenCust2}`,
        },
        body: JSON.stringify({ product_id: product2.id, quantity: 1 }),
      });
      const dataAdd = await resAdd.json();
      assert(dataAdd.data.items.length === 1, 'Customer 2 adds item to Customer 2 cart');

      // Customer 2 clears Customer 2's cart
      await fetch(`${baseUrl}/api/v1/cart`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenCust2}` },
      });

      // Customer 1's cart item is STILL intact!
      const res1Check = await fetch(`${baseUrl}/api/v1/cart`, {
        headers: { Authorization: `Bearer ${tokenCust1}` },
      });
      const data1Check = await res1Check.json();
      assert(data1Check.data.items.length === 1, 'Customer 1 cart item completely unaffected by Customer 2 actions');
      assert(data1Check.data.items[0].id === cartItemId1, 'Customer 1 cart item remains intact');
    }

    // --- 9. Clear Cart Test ---
    console.log('\n--- 9. Clear Entire Cart ---');
    {
      const res = await fetch(`${baseUrl}/api/v1/cart`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenCust1}` },
      });
      const data = await res.json();
      assert(res.status === 200, 'DELETE /api/v1/cart returns 200 OK');
      assert(data.success === true, 'Success is true');
      assert(data.data.items.length === 0, 'Cart items array is empty');
      assert(data.data.total_items === 0, 'Total items is 0');
      assert(data.data.total_price === 0, 'Total price is 0');

      // Subsequent GET confirms cart is empty
      const resVerify = await fetch(`${baseUrl}/api/v1/cart`, {
        headers: { Authorization: `Bearer ${tokenCust1}` },
      });
      const dataVerify = await resVerify.json();
      assert(dataVerify.data.items.length === 0, 'Subsequent GET confirms cart is fully cleared');
    }

    // --- 10. Swagger Docs Integration ---
    console.log('\n--- 10. Swagger Documentation Verification ---');
    {
      const res = await fetch(`${baseUrl}/api-docs.json`);
      const spec = await res.json();
      assert(spec.paths['/api/v1/cart'] !== undefined, 'Swagger spec includes /api/v1/cart');
      assert(spec.paths['/api/v1/cart/items'] !== undefined, 'Swagger spec includes /api/v1/cart/items');
      assert(spec.paths['/api/v1/cart/items/{id}'] !== undefined, 'Swagger spec includes /api/v1/cart/items/{id}');
    }

    // --- 11. Cleanup Test Fixtures ---
    console.log('\n--- 11. Cleaning Up Test Fixtures ---');
    await CartItem.destroy({ where: {} });
    await Cart.destroy({ where: {} });
    await Product.destroy({
      where: {
        sku: [
          'CART-TEST-PROD-01',
          'CART-TEST-PROD-02',
          'CART-TEST-INACTIVE',
          'CART-TEST-UNAPPROVED',
          'CART-TEST-REJ-VENDOR',
          'CART-TEST-LOW-STOCK',
        ],
      },
    });
    await Category.destroy({ where: { slug: 'cart-test-cat' } });
    await Vendor.destroy({ where: { store_slug: ['cart-approved-store', 'cart-rejected-store'] } });
    await User.destroy({
      where: {
        email: [
          'cart_cust1@test.com',
          'cart_cust2@test.com',
          'cart_vendor_appr@test.com',
          'cart_vendor_rej@test.com',
        ],
      },
    });
    console.log('Cleanup completed successfully.');
  } catch (error) {
    console.error('Fatal test error:', error);
    failed++;
  } finally {
    server.close();
    console.log('\n====================================================');
    console.log(` Cart Test Results: ${passed} passed, ${failed} failed`);
    console.log('====================================================');
    process.exit(failed > 0 ? 1 : 0);
  }
}

runCartTests();
