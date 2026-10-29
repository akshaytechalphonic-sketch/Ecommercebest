require('dotenv').config();
const http = require('http');
const app = require('../src/app');
const { sequelize, User, Vendor, RefreshToken, Order, OrderItem, Commission, Product } = require('../src/models');
const { hashPassword } = require('../src/utils/password.util');
const { generateAccessToken } = require('../src/utils/token.util');

async function runVendorTests() {
  console.log('--- Starting Vendor / Seller Module Test Suite ---');
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
      console.error(`  [FAIL] ${testName}: ${details}`);
      failed++;
    }
  }

  try {
    // 0. Cleanup previous test records safely
    const testUsers = await User.findAll({
      where: {
        email: [
          'vendor_test_cust@example.com',
          'vendor_test_direct@example.com',
          'vendor_test_admin@example.com',
          'vendor_test_cust2@example.com',
        ],
      },
      attributes: ['id'],
    });
    if (testUsers.length > 0) {
      const userIds = testUsers.map((u) => u.id);
      const vendors = await Vendor.findAll({ where: { user_id: userIds }, attributes: ['id'] });
      if (vendors.length > 0) {
        const vIds = vendors.map((v) => v.id);
        await Commission.destroy({ where: { vendor_id: vIds } });
        await OrderItem.destroy({ where: { vendor_id: vIds } });
        await Product.destroy({ where: { vendor_id: vIds } });
      }
    }
    await User.destroy({
      where: {
        email: [
          'vendor_test_cust@example.com',
          'vendor_test_direct@example.com',
          'vendor_test_admin@example.com',
          'vendor_test_cust2@example.com',
        ],
      },
    });

    // Create test customer
    const customerUser = await User.create({
      name: 'Customer Seller Applicant',
      email: 'vendor_test_cust@example.com',
      password_hash: await hashPassword('Password@123'),
      phone: '9899000001',
      role: 'customer',
      status: 'active',
      is_verified: true,
    });

    // Create second customer
    const customerUser2 = await User.create({
      name: 'Customer Two',
      email: 'vendor_test_cust2@example.com',
      password_hash: await hashPassword('Password@123'),
      phone: '9899000002',
      role: 'customer',
      status: 'active',
      is_verified: true,
    });

    // Create test admin
    const adminUser = await User.create({
      name: 'Super Admin',
      email: 'vendor_test_admin@example.com',
      password_hash: await hashPassword('Password@123'),
      phone: '9899000009',
      role: 'admin',
      status: 'active',
      is_verified: true,
    });

    const customerToken = generateAccessToken(customerUser);
    const customer2Token = generateAccessToken(customerUser2);
    const adminToken = generateAccessToken(adminUser);

    // ----------------------------------------------------
    // 1. POST /api/v1/vendors/register (Authenticated Customer upgrade)
    // ----------------------------------------------------
    const regRes = await fetch(`${baseUrl}/api/v1/vendors/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        store_name: 'Tech Haven Store',
        description: 'Best gadgets and accessories',
        city: 'Mumbai',
        state: 'Maharashtra',
        postal_code: '400001',
        country: 'India',
        tax_id: '27AABCU9603R1ZM',
      }),
    });
    const regData = await regRes.json();
    assert(
      regRes.status === 201 && regData.success === true,
      'POST /vendors/register registers store for authenticated user',
      JSON.stringify(regData)
    );
    assert(
      regData.data.vendor.status === 'pending',
      'Newly registered vendor status defaults to pending',
      regData.data?.vendor?.status
    );
    assert(
      regData.data.vendor.store_slug === 'tech-haven-store',
      'Store slug auto-generated from store_name',
      regData.data?.vendor?.store_slug
    );

    const vendorId = regData.data.vendor.id;

    // Check user role is updated to vendor
    const refreshedCustomer = await User.findByPk(customerUser.id);
    assert(
      refreshedCustomer.role === 'vendor',
      'User role updated to vendor upon application submission',
      refreshedCustomer.role
    );

    // Re-registering with pending store should be rejected with 409
    const dupRes = await fetch(`${baseUrl}/api/v1/vendors/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        store_name: 'Tech Haven Store Duplicate',
      }),
    });
    const dupData = await dupRes.json();
    assert(
      dupRes.status === 409 && dupData.code === 'VENDOR_APPLICATION_PENDING',
      'Reject duplicate vendor registration with 409 VENDOR_APPLICATION_PENDING',
      JSON.stringify(dupData)
    );

    // ----------------------------------------------------
    // 2. POST /api/v1/vendors/register (Direct unauthenticated registration)
    // ----------------------------------------------------
    const directRes = await fetch(`${baseUrl}/api/v1/vendors/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Direct Seller',
        email: 'vendor_test_direct@example.com',
        password: 'Password@123',
        phone: '9899000005',
        store_name: 'Direct Electronics Hub',
        city: 'Delhi',
      }),
    });
    const directData = await directRes.json();
    assert(
      directRes.status === 201 && directData.success === true,
      'POST /vendors/register registers owner and store in one call without prior auth',
      JSON.stringify(directData)
    );
    assert(
      Boolean(directData.data.tokens?.access_token),
      'Direct registration returns JWT tokens for immediate login'
    );
    assert(
      directData.data.user.role === 'vendor',
      'Directly registered user receives vendor role'
    );

    // ----------------------------------------------------
    // 3. GET /api/v1/vendors/me
    // ----------------------------------------------------
    // Without token -> 401
    const noAuthMe = await fetch(`${baseUrl}/api/v1/vendors/me`);
    assert(
      noAuthMe.status === 401,
      'GET /vendors/me rejects unauthorized request with 401'
    );

    // Customer with no vendor profile -> 404
    const noVendorMe = await fetch(`${baseUrl}/api/v1/vendors/me`, {
      headers: { Authorization: `Bearer ${customer2Token}` },
    });
    assert(
      noVendorMe.status === 404,
      'GET /vendors/me returns 404 for user without a vendor store'
    );

    // Valid vendor token -> returns store details
    const meRes = await fetch(`${baseUrl}/api/v1/vendors/me`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const meData = await meRes.json();
    assert(
      meRes.status === 200 && meData.data.store_name === 'Tech Haven Store',
      'GET /vendors/me returns current seller store profile',
      JSON.stringify(meData)
    );
    assert(
      Boolean(meData.data.user && meData.data.user.email),
      'GET /vendors/me includes associated owner profile'
    );

    // ----------------------------------------------------
    // 4. PUT /api/v1/vendors/me
    // ----------------------------------------------------
    const updateRes = await fetch(`${baseUrl}/api/v1/vendors/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        description: 'Updated store description with new arrivals',
        city: 'Pune',
        bank_name: 'HDFC Bank',
        // Attempting to escalate status and commission rate
        status: 'approved',
        commission_rate: 0,
      }),
    });
    const updateData = await updateRes.json();
    assert(
      updateRes.status === 200 && updateData.data.city === 'Pune',
      'PUT /vendors/me updates store details',
      JSON.stringify(updateData)
    );
    assert(
      updateData.data.status === 'pending' && updateData.data.commission_rate === '10.00',
      'PUT /vendors/me ignores attempts by vendor to modify status or commission rate',
      `status: ${updateData.data.status}, rate: ${updateData.data.commission_rate}`
    );

    // ----------------------------------------------------
    // 5. GET /api/v1/vendors/me/status
    // ----------------------------------------------------
    const statusRes = await fetch(`${baseUrl}/api/v1/vendors/me/status`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const statusData = await statusRes.json();
    assert(
      statusRes.status === 200 &&
        statusData.data.status === 'pending' &&
        statusData.data.is_approved === false,
      'GET /vendors/me/status returns current approval status (pending, is_approved=false)',
      JSON.stringify(statusData)
    );

    // ----------------------------------------------------
    // 6. GET /api/v1/admin/vendors (Admin listing)
    // ----------------------------------------------------
    // Customer access rejected
    const custAdminRes = await fetch(`${baseUrl}/api/v1/admin/vendors`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert(
      custAdminRes.status === 403,
      'GET /admin/vendors rejects non-admin with 403 FORBIDDEN'
    );

    // Admin access succeeds
    const adminListRes = await fetch(`${baseUrl}/api/v1/admin/vendors`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminListData = await adminListRes.json();
    assert(
      adminListRes.status === 200 &&
        Array.isArray(adminListData.data.vendors) &&
        adminListData.data.vendors.length >= 2,
      'GET /admin/vendors lists all vendors for admin',
      JSON.stringify(adminListData.data.pagination)
    );
    assert(
      adminListData.data.pagination.total >= 2 &&
        adminListData.data.pagination.page === 1,
      'GET /admin/vendors returns pagination metadata'
    );

    // Filter by status=pending
    const filterRes = await fetch(
      `${baseUrl}/api/v1/admin/vendors?status=pending`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    const filterData = await filterRes.json();
    assert(
      filterRes.status === 200 &&
        filterData.data.vendors.every((v) => v.status === 'pending'),
      'GET /admin/vendors filters correctly by status=pending'
    );

    // ----------------------------------------------------
    // 7. PATCH /api/v1/admin/vendors/:id/status (Admin Approval & Rejection)
    // ----------------------------------------------------
    // Non-admin rejected with 403
    const custPatchRes = await fetch(
      `${baseUrl}/api/v1/admin/vendors/${vendorId}/status`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({ status: 'approved' }),
      }
    );
    assert(
      custPatchRes.status === 403,
      'PATCH /admin/vendors/:id/status rejects non-admin with 403'
    );

    // Rejecting without rejection_reason fails with 400
    const badRejectRes = await fetch(
      `${baseUrl}/api/v1/admin/vendors/${vendorId}/status`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: 'rejected' }),
      }
    );
    assert(
      badRejectRes.status === 400,
      'PATCH /admin/vendors/:id/status requires rejection_reason when status is rejected'
    );

    // Admin approves vendor
    const approveRes = await fetch(
      `${baseUrl}/api/v1/admin/vendors/${vendorId}/status`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          status: 'approved',
          commission_rate: 8.5,
        }),
      }
    );
    const approveData = await approveRes.json();
    assert(
      approveRes.status === 200 && approveData.data.status === 'approved',
      'Admin successfully approves vendor',
      JSON.stringify(approveData)
    );
    assert(
      Boolean(approveData.data.approved_at),
      'Approved vendor record has approved_at timestamp populated'
    );
    assert(
      Number(approveData.data.commission_rate) === 8.5,
      'Admin can update custom vendor commission rate'
    );

    // Vendor re-checks status after admin approval
    const afterApproveStatus = await fetch(
      `${baseUrl}/api/v1/vendors/me/status`,
      {
        headers: { Authorization: `Bearer ${customerToken}` },
      }
    );
    const afterApproveData = await afterApproveStatus.json();
    assert(
      afterApproveData.data.status === 'approved' &&
        afterApproveData.data.is_approved === true,
      'Vendor status endpoint now reflects approved state (is_approved=true)'
    );

    // Admin rejects another vendor with explanation
    const directVendorId = directData.data.vendor.id;
    const rejectRes = await fetch(
      `${baseUrl}/api/v1/admin/vendors/${directVendorId}/status`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          status: 'rejected',
          rejection_reason: 'Incomplete business documents provided.',
        }),
      }
    );
    const rejectData = await rejectRes.json();
    assert(
      rejectRes.status === 200 &&
        rejectData.data.status === 'rejected' &&
        rejectData.data.rejection_reason === 'Incomplete business documents provided.',
      'Admin successfully rejects vendor with rejection_reason stored',
      JSON.stringify(rejectData)
    );

    // Direct seller checks status and sees rejection reason
    const directSellerToken = directData.data.tokens.access_token;
    const directStatusRes = await fetch(
      `${baseUrl}/api/v1/vendors/me/status`,
      {
        headers: { Authorization: `Bearer ${directSellerToken}` },
      }
    );
    const directStatusData = await directStatusRes.json();
    assert(
      directStatusData.data.status === 'rejected' &&
        directStatusData.data.rejection_reason ===
          'Incomplete business documents provided.',
      'Rejected vendor can view admin rejection_reason'
    );

    // ----------------------------------------------------
    // 8. Aliasing check (/api/v1/sellers)
    // ----------------------------------------------------
    const aliasRes = await fetch(`${baseUrl}/api/v1/sellers/me`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert(
      aliasRes.status === 200,
      'GET /api/v1/sellers/me backwards-compatible alias route works properly'
    );

    // ----------------------------------------------------
    // 9. Swagger OpenAPI Spec Verification
    // ----------------------------------------------------
    const swaggerRes = await fetch(`${baseUrl}/api-docs.json`);
    const swaggerSpec = await swaggerRes.json();
    assert(
      Boolean(swaggerSpec.paths['/api/v1/vendors/register']),
      'Swagger spec includes /api/v1/vendors/register'
    );
    assert(
      Boolean(swaggerSpec.paths['/api/v1/vendors/me']),
      'Swagger spec includes /api/v1/vendors/me'
    );
    assert(
      Boolean(swaggerSpec.paths['/api/v1/vendors/me/status']),
      'Swagger spec includes /api/v1/vendors/me/status'
    );
    assert(
      Boolean(swaggerSpec.paths['/api/v1/admin/vendors']),
      'Swagger spec includes /api/v1/admin/vendors'
    );
    assert(
      Boolean(swaggerSpec.paths['/api/v1/admin/vendors/{id}/status']),
      'Swagger spec includes /api/v1/admin/vendors/{id}/status'
    );
  } catch (err) {
    console.error('Test run failed with error:', err);
    failed++;
  } finally {
    server.close();
    console.log('\n========================================');
    console.log(`Vendor Tests Passed: ${passed}`);
    console.log(`Vendor Tests Failed: ${failed}`);
    console.log('========================================\n');
    if (failed > 0) {
      process.exit(1);
    }
  }
}

runVendorTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
