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
const { generateAccessToken } = require('../src/utils/token.util');

async function runProductTests() {
  console.log('====================================================');
  console.log('   STARTING PRODUCT MANAGEMENT MODULE TEST SUITE    ');
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
    // 0. Cleanup any previous test data
    console.log('\n--- 0. Database Test Fixture Setup & Cleanup ---');
    await Product.destroy({
      where: {
        sku: [
          'TEST-MBP-16-01',
          'TEST-IPHONE-OLD',
          'TEST-DUP-SKU-01',
          'TEST-VENDOR2-ITEM',
        ],
      },
    });

    await Category.destroy({
      where: {
        slug: [
          'test-prod-electronics',
          'test-prod-laptops',
          'test-prod-fashion',
          'test-prod-shoes',
        ],
      },
    });

    const testEmails = [
      'prod_test_admin@example.com',
      'prod_test_cust@example.com',
      'prod_test_pending_vendor@example.com',
      'prod_test_approved_vendor1@example.com',
      'prod_test_approved_vendor2@example.com',
    ];

    const existingUsers = await User.findAll({ where: { email: testEmails } });
    if (existingUsers.length > 0) {
      const userIds = existingUsers.map((u) => u.id);
      await Vendor.destroy({ where: { user_id: userIds } });
      await User.destroy({ where: { id: userIds } });
    }

    // Create Categories & Subcategories
    const parentElectronics = await Category.create({
      name: 'Test Electronics',
      slug: 'test-prod-electronics',
      status: 'active',
    });

    const subLaptops = await Category.create({
      name: 'Test Laptops',
      slug: 'test-prod-laptops',
      parent_id: parentElectronics.id,
      status: 'active',
    });

    const parentFashion = await Category.create({
      name: 'Test Fashion',
      slug: 'test-prod-fashion',
      status: 'active',
    });

    const subShoes = await Category.create({
      name: 'Test Shoes',
      slug: 'test-prod-shoes',
      parent_id: parentFashion.id,
      status: 'active',
    });

    // Create Admin User
    const adminUser = await User.create({
      name: 'Product Test Admin',
      email: 'prod_test_admin@example.com',
      password_hash: await hashPassword('Password@123'),
      phone: '9700000001',
      role: 'admin',
      status: 'active',
      is_verified: true,
    });
    const adminToken = generateAccessToken(adminUser);

    // Create Customer User
    const customerUser = await User.create({
      name: 'Product Test Customer',
      email: 'prod_test_cust@example.com',
      password_hash: await hashPassword('Password@123'),
      phone: '9700000002',
      role: 'customer',
      status: 'active',
      is_verified: true,
    });
    const customerToken = generateAccessToken(customerUser);

    // Create Pending Vendor User
    const pendingVendorUser = await User.create({
      name: 'Pending Vendor User',
      email: 'prod_test_pending_vendor@example.com',
      password_hash: await hashPassword('Password@123'),
      phone: '9700000003',
      role: 'vendor',
      status: 'active',
      is_verified: true,
    });
    await Vendor.create({
      user_id: pendingVendorUser.id,
      store_name: 'Pending Vendor Store',
      store_slug: 'pending-vendor-store',
      status: 'pending',
    });
    const pendingVendorToken = generateAccessToken(pendingVendorUser);

    // Create Approved Vendor 1 User
    const vendor1User = await User.create({
      name: 'Approved Vendor One',
      email: 'prod_test_approved_vendor1@example.com',
      password_hash: await hashPassword('Password@123'),
      phone: '9700000004',
      role: 'vendor',
      status: 'active',
      is_verified: true,
    });
    const vendor1 = await Vendor.create({
      user_id: vendor1User.id,
      store_name: 'Apex Digital Store',
      store_slug: 'apex-digital-store',
      status: 'approved',
    });
    const vendor1Token = generateAccessToken(vendor1User);

    // Create Approved Vendor 2 User
    const vendor2User = await User.create({
      name: 'Approved Vendor Two',
      email: 'prod_test_approved_vendor2@example.com',
      password_hash: await hashPassword('Password@123'),
      phone: '9700000005',
      role: 'vendor',
      status: 'active',
      is_verified: true,
    });
    const vendor2 = await Vendor.create({
      user_id: vendor2User.id,
      store_name: 'Starlight Retail',
      store_slug: 'starlight-retail',
      status: 'approved',
    });
    const vendor2Token = generateAccessToken(vendor2User);

    console.log('Fixture setup completed successfully.');

    // =========================================================================
    // 1. Authorization & Role Security for Product Creation
    // =========================================================================
    console.log('\n--- 1. Security & Vendor Approval Checks ---');

    // 1.1 Unauthenticated creation
    {
      const res = await fetch(`${baseUrl}/api/v1/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Unauthorized Item' }),
      });
      assert(res.status === 401, 'POST /api/v1/products without token returns 401');
    }

    // 1.2 Customer role trying to create product
    {
      const res = await fetch(`${baseUrl}/api/v1/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({
          name: 'Customer Item',
          category_id: parentElectronics.id,
          price: 100,
          sku: 'CUST-SKU-01',
        }),
      });
      assert(res.status === 403, 'POST /api/v1/products with customer token returns 403 Forbidden');
    }

    // 1.3 Vendor with pending store approval trying to create product
    {
      const res = await fetch(`${baseUrl}/api/v1/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${pendingVendorToken}`,
        },
        body: JSON.stringify({
          name: 'Pending Store Product',
          category_id: parentElectronics.id,
          price: 499,
          sku: 'PEND-SKU-01',
        }),
      });
      const data = await res.json();
      assert(
        res.status === 403 && data.code === 'VENDOR_NOT_APPROVED',
        'POST /api/v1/products by unapproved vendor returns 403 VENDOR_NOT_APPROVED',
        JSON.stringify(data)
      );
    }

    // =========================================================================
    // 2. Validation & Hierarchy Constraints
    // =========================================================================
    console.log('\n--- 2. Validation and Category Hierarchy Rules ---');

    // 2.1 Discount price greater than or equal to price
    {
      const res = await fetch(`${baseUrl}/api/v1/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${vendor1Token}`,
        },
        body: JSON.stringify({
          name: 'Invalid Discount Laptop',
          category_id: parentElectronics.id,
          price: 1000,
          discount_price: 1200,
          sku: 'INVALID-DISC-01',
        }),
      });
      const data = await res.json();
      assert(
        res.status === 400 && data.code === 'VALIDATION_ERROR',
        'POST /api/v1/products with discount_price >= price returns 400 VALIDATION_ERROR'
      );
    }

    // 2.2 Invalid subcategory hierarchy (subShoes is under parentFashion, NOT parentElectronics)
    {
      const res = await fetch(`${baseUrl}/api/v1/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${vendor1Token}`,
        },
        body: JSON.stringify({
          name: 'Mismatched Hierarchy Product',
          category_id: parentElectronics.id,
          subcategory_id: subShoes.id,
          price: 1500,
          sku: 'MISMATCH-CAT-01',
        }),
      });
      const data = await res.json();
      assert(
        res.status === 400 && (data.code === 'INVALID_SUBCATEGORY_PARENT' || data.code === 'INVALID_SUBCATEGORY_HIERARCHY'),
        'POST /api/v1/products with mismatched subcategory returns 400'
      );
    }

    // =========================================================================
    // 3. Approved Seller Adding Products
    // =========================================================================
    console.log('\n--- 3. Product Creation by Approved Seller ---');

    let createdProduct1 = null;
    {
      const payload = {
        name: 'Test MacBook Pro 16 M3 Max',
        description: 'Blazing fast Apple Silicon chip with Liquid Retina XDR display.',
        category_id: parentElectronics.id,
        subcategory_id: subLaptops.id,
        images: [
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8',
          'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9',
        ],
        price: 2499.00,
        discount_price: 2199.00,
        sku: 'TEST-MBP-16-01',
        stock: 25,
        status: 'active',
      };

      const res = await fetch(`${baseUrl}/api/v1/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${vendor1Token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      assert(res.status === 201, 'POST /api/v1/products returns 201 Created');
      assert(data.data.sku === 'TEST-MBP-16-01', 'Created product has correct SKU');
      assert(data.data.vendor_id === vendor1.id, 'Product is linked to Vendor 1');
      assert(data.data.approval_status === 'pending', 'Product defaults to pending approval_status');
      assert(Array.isArray(data.data.images) && data.data.images.length === 2, 'Images stored as array');
      assert(data.data.slug.startsWith('test-macbook-pro-16-m3-max'), 'Slug automatically generated');
      createdProduct1 = data.data;
    }

    // 3.2 Duplicate SKU rejection
    {
      const res = await fetch(`${baseUrl}/api/v1/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${vendor1Token}`,
        },
        body: JSON.stringify({
          name: 'Another Laptop Duplicate SKU',
          category_id: parentElectronics.id,
          price: 1999.00,
          sku: 'TEST-MBP-16-01', // same SKU
        }),
      });
      const data = await res.json();
      assert(
        res.status === 409 && data.code === 'DUPLICATE_SKU',
        'POST /api/v1/products with duplicate SKU returns 409 DUPLICATE_SKU'
      );
    }

    // 3.3 Create a second product for Vendor 1 (for testing rejection)
    let createdProduct2 = null;
    {
      const res = await fetch(`${baseUrl}/api/v1/vendor/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${vendor1Token}`,
        },
        body: JSON.stringify({
          name: 'Test Old iPhone Refurbished',
          category_id: parentElectronics.id,
          price: 399.00,
          sku: 'TEST-IPHONE-OLD',
          stock: 10,
        }),
      });
      const data = await res.json();
      assert(res.status === 201, 'POST /api/v1/vendor/products alias route returns 201');
      createdProduct2 = data.data;
    }

    // =========================================================================
    // 4. Seller Viewing & Isolating Products
    // =========================================================================
    console.log('\n--- 4. Seller Catalog Views & Store Isolation ---');

    // 4.1 Vendor 1 views own products
    {
      const res = await fetch(`${baseUrl}/api/v1/products/seller/me`, {
        headers: { Authorization: `Bearer ${vendor1Token}` },
      });
      const data = await res.json();
      assert(res.status === 200, 'GET /api/v1/products/seller/me returns 200');
      assert(data.data.pagination.total >= 2, 'Vendor 1 sees their 2 created products');
    }

    // 4.2 Vendor 1 gets details of own product by ID
    {
      const res = await fetch(`${baseUrl}/api/v1/products/seller/me/${createdProduct1.id}`, {
        headers: { Authorization: `Bearer ${vendor1Token}` },
      });
      const data = await res.json();
      assert(res.status === 200, 'GET /api/v1/products/seller/me/:id returns 200');
      assert(data.data.id === createdProduct1.id, 'Correct product details returned');
      assert(data.data.category && data.data.category.id === parentElectronics.id, 'Includes category relation');
      assert(data.data.subcategory && data.data.subcategory.id === subLaptops.id, 'Includes subcategory relation');
    }

    // 4.3 Vendor 2 lists own products -> should have 0 products initially
    {
      const res = await fetch(`${baseUrl}/api/v1/products/seller/me`, {
        headers: { Authorization: `Bearer ${vendor2Token}` },
      });
      const data = await res.json();
      assert(res.status === 200, 'GET /api/v1/products/seller/me for Vendor 2 returns 200');
      assert(data.data.pagination.total === 0, 'Vendor 2 sees 0 products (cannot see Vendor 1 products)');
    }

    // 4.4 Vendor 2 tries to fetch Vendor 1's product by ID -> 403 Forbidden
    {
      const res = await fetch(`${baseUrl}/api/v1/products/seller/me/${createdProduct1.id}`, {
        headers: { Authorization: `Bearer ${vendor2Token}` },
      });
      const data = await res.json();
      assert(
        res.status === 403 && data.code === 'UNAUTHORIZED_PRODUCT_ACCESS',
        'Vendor 2 accessing Vendor 1 product returns 403 UNAUTHORIZED_PRODUCT_ACCESS'
      );
    }

    // =========================================================================
    // 5. Seller Updating Products
    // =========================================================================
    console.log('\n--- 5. Seller Product Update & Security ---');

    // 5.1 Vendor 2 tries to update Vendor 1's product -> 403 Forbidden
    {
      const res = await fetch(`${baseUrl}/api/v1/products/${createdProduct1.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${vendor2Token}`,
        },
        body: JSON.stringify({ price: 999 }),
      });
      const data = await res.json();
      assert(
        res.status === 403 && data.code === 'UNAUTHORIZED_PRODUCT_ACCESS',
        'PUT /api/v1/products/:id by unauthorized seller returns 403 UNAUTHORIZED_PRODUCT_ACCESS'
      );
    }

    // 5.2 Vendor 1 successfully updates own product
    {
      const res = await fetch(`${baseUrl}/api/v1/products/${createdProduct1.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${vendor1Token}`,
        },
        body: JSON.stringify({
          price: 2399.00,
          discount_price: 2099.00,
          stock: 40,
        }),
      });
      const data = await res.json();
      assert(res.status === 200, 'PUT /api/v1/products/:id by owner returns 200');
      assert(Number(data.data.price) === 2399, 'Product price updated correctly');
      assert(Number(data.data.stock) === 40, 'Stock updated correctly');
    }

    // =========================================================================
    // 6. Admin Listing and Approval/Rejection Workflow
    // =========================================================================
    console.log('\n--- 6. Admin Product Listing & Approval Workflow ---');

    // 6.1 Regular user cannot access admin products
    {
      const res = await fetch(`${baseUrl}/api/v1/admin/products`, {
        headers: { Authorization: `Bearer ${vendor1Token}` },
      });
      assert(res.status === 403, 'GET /api/v1/admin/products with vendor token returns 403');
    }

    // 6.2 Admin lists products with pending status filter
    {
      const res = await fetch(`${baseUrl}/api/v1/admin/products?approval_status=pending`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      assert(res.status === 200, 'GET /api/v1/admin/products returns 200');
      const foundProduct1 = data.data.products.find((p) => p.id === createdProduct1.id);
      assert(Boolean(foundProduct1), 'Admin pending list includes Product 1');
      assert(foundProduct1.vendor && foundProduct1.vendor.store_name === 'Apex Digital Store', 'Includes vendor information');
    }

    // 6.3 Admin attempts to reject without rejection reason -> 400
    {
      const res = await fetch(`${baseUrl}/api/v1/admin/products/${createdProduct2.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ approval_status: 'rejected' }),
      });
      const data = await res.json();
      assert(
        res.status === 400 && data.code === 'VALIDATION_ERROR',
        'PATCH /api/v1/admin/products/:id/status rejection without reason returns 400'
      );
    }

    // 6.4 Admin rejects Product 2 with reason
    {
      const res = await fetch(`${baseUrl}/api/v1/admin/products/${createdProduct2.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          approval_status: 'rejected',
          rejection_reason: 'Refurbished devices not permitted on standard tier.',
        }),
      });
      const data = await res.json();
      assert(res.status === 200, 'PATCH /api/v1/admin/products/:id/status with rejection reason returns 200');
      assert(data.data.approval_status === 'rejected', 'Product 2 status is rejected');
      assert(
        data.data.rejection_reason === 'Refurbished devices not permitted on standard tier.',
        'Rejection reason recorded in database'
      );
    }

    // 6.5 Admin approves Product 1
    {
      const res = await fetch(`${baseUrl}/api/v1/admin/products/${createdProduct1.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ approval_status: 'approved' }),
      });
      const data = await res.json();
      assert(res.status === 200, 'PATCH /api/v1/admin/products/:id/status approval returns 200');
      assert(data.data.approval_status === 'approved', 'Product 1 status is now approved');
      assert(data.data.rejection_reason === null, 'Rejection reason cleared on approval');
    }

    // =========================================================================
    // 7. Public Marketplace Catalog Browsing
    // =========================================================================
    console.log('\n--- 7. Public Marketplace Catalog Browsing ---');

    // 7.1 Public list returns Product 1 (active & approved), but NOT Product 2 (rejected)
    {
      const res = await fetch(`${baseUrl}/api/v1/products?search=Test`);
      const data = await res.json();
      assert(res.status === 200, 'GET /api/v1/products returns 200 for public users');
      const foundApproved = data.data.products.find((p) => p.id === createdProduct1.id);
      const foundRejected = data.data.products.find((p) => p.id === createdProduct2.id);
      assert(Boolean(foundApproved), 'Public catalog includes approved Product 1');
      assert(!foundRejected, 'Public catalog strictly excludes rejected Product 2');
    }

    // 7.2 Public detail by ID or Slug
    {
      const res = await fetch(`${baseUrl}/api/v1/products/${createdProduct1.slug}`);
      const data = await res.json();
      assert(res.status === 200, 'GET /api/v1/products/:slug returns 200 for approved product');
      assert(data.data.name === createdProduct1.name, 'Returns matching product details');
    }

    // 7.3 Public detail for rejected product returns 404
    {
      const res = await fetch(`${baseUrl}/api/v1/products/${createdProduct2.slug}`);
      assert(res.status === 404, 'GET /api/v1/products/:slug for rejected product returns 404');
    }

    // =========================================================================
    // 8. Seller Deactivation vs Permanent Deletion
    // =========================================================================
    console.log('\n--- 8. Seller Deactivate and Permanent Delete ---');

    // 8.1 Vendor 2 tries to delete Vendor 1's product -> 403
    {
      const res = await fetch(`${baseUrl}/api/v1/products/${createdProduct1.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${vendor2Token}` },
      });
      const data = await res.json();
      assert(
        res.status === 403 && data.code === 'UNAUTHORIZED_PRODUCT_ACCESS',
        'DELETE /api/v1/products/:id by unauthorized vendor returns 403 UNAUTHORIZED_PRODUCT_ACCESS'
      );
    }

    // 8.2 Vendor 1 safely deactivates Product 1 (?deactivate=true)
    {
      const res = await fetch(`${baseUrl}/api/v1/products/${createdProduct1.id}?deactivate=true`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${vendor1Token}` },
      });
      const data = await res.json();
      assert(res.status === 200, 'DELETE /api/v1/products/:id?deactivate=true returns 200');
      assert(data.data.deactivated === true, 'Response confirms deactivation');

      // Check in DB
      const dbProd = await Product.findByPk(createdProduct1.id);
      assert(dbProd.status === 'inactive', 'Database status changed to inactive');

      // Verify product is now hidden from public catalog
      const pubRes = await fetch(`${baseUrl}/api/v1/products/${createdProduct1.slug}`);
      assert(pubRes.status === 404, 'Deactivated product is no longer visible on public endpoint');
    }

    // 8.3 Vendor 1 permanently deletes Product 2
    {
      const res = await fetch(`${baseUrl}/api/v1/products/${createdProduct2.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${vendor1Token}` },
      });
      const data = await res.json();
      assert(res.status === 200, 'DELETE /api/v1/products/:id permanently removes product');

      // Verify hard delete from DB
      const dbProd = await Product.findByPk(createdProduct2.id);
      assert(dbProd === null, 'Product 2 permanently deleted from database');
    }

    // =========================================================================
    // 9. Teardown
    // =========================================================================
    console.log('\n--- 9. Cleaning Up Test Fixtures ---');
    await Product.destroy({ where: { id: createdProduct1.id } });
    await Category.destroy({
      where: {
        id: [parentElectronics.id, subLaptops.id, parentFashion.id, subShoes.id],
      },
    });
    await Vendor.destroy({ where: { id: [vendor1.id, vendor2.id] } });
    await User.destroy({
      where: {
        email: testEmails,
      },
    });
    console.log('Cleanup completed.');

  } catch (err) {
    console.error('Fatal error in product test suite:', err);
    failed++;
  } finally {
    server.close();
    console.log('\n====================================================');
    console.log(` Product Test Results: ${passed} passed, ${failed} failed`);
    console.log('====================================================');
    if (failed > 0) {
      process.exit(1);
    }
  }
}

runProductTests();
