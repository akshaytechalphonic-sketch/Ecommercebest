require('dotenv').config();
const http = require('http');
const app = require('../src/app');
const { sequelize, User, Category } = require('../src/models');
const { hashPassword } = require('../src/utils/password.util');
const { generateAccessToken } = require('../src/utils/token.util');

async function runCategoryTests() {
  console.log('--- Starting Category & Subcategory Module Test Suite ---');
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
    // 0. Cleanup previous test users and categories
    await User.destroy({
      where: {
        email: [
          'cat_test_admin@example.com',
          'cat_test_cust@example.com',
        ],
      },
    });

    await Category.destroy({
      where: {
        slug: [
          'test-electronics',
          'test-smartphones',
          'test-fashion',
          'test-clothing',
          'test-custom-slug',
          'electronics-and-gadgets',
        ],
      },
    });

    // Create test customer
    const customerUser = await User.create({
      name: 'Regular Customer',
      email: 'cat_test_cust@example.com',
      password_hash: await hashPassword('Password@123'),
      phone: '9877000001',
      role: 'customer',
      status: 'active',
      is_verified: true,
    });

    // Create test admin
    const adminUser = await User.create({
      name: 'System Admin',
      email: 'cat_test_admin@example.com',
      password_hash: await hashPassword('Password@123'),
      phone: '9877000002',
      role: 'admin',
      status: 'active',
      is_verified: true,
    });

    const customerToken = generateAccessToken(customerUser);
    const adminToken = generateAccessToken(adminUser);

    console.log('\n--- 1. Category Creation & Admin Security Tests ---');

    // Test 1: POST /api/v1/admin/categories without auth -> 401
    {
      const res = await fetch(`${baseUrl}/api/v1/admin/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test Electronics' }),
      });
      const data = await res.json();
      assert(res.status === 401, 'POST /api/v1/admin/categories without auth returns 401');
    }

    // Test 2: POST /api/v1/admin/categories with customer token -> 403
    {
      const res = await fetch(`${baseUrl}/api/v1/admin/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({ name: 'Test Electronics' }),
      });
      const data = await res.json();
      assert(res.status === 403, 'POST /api/v1/admin/categories with customer token returns 403 Forbidden');
    }

    // Test 3: POST /api/v1/admin/categories with empty name -> 400
    {
      const res = await fetch(`${baseUrl}/api/v1/admin/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ name: '' }),
      });
      const data = await res.json();
      assert(res.status === 400 && data.success === false, 'POST /api/v1/admin/categories with invalid name returns 400');
    }

    // Test 4: POST /api/v1/admin/categories with valid data -> 201
    let parentCategoryId = null;
    let parentCategorySlug = null;
    {
      const res = await fetch(`${baseUrl}/api/v1/admin/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: 'Test Electronics',
          description: 'High-tech electronics and gadgets',
          banner_image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200',
          thumbnail_image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=300',
          status: 'active',
          display_order: 1,
        }),
      });
      const body = await res.json();
      assert(
        res.status === 201 && body.success === true && body.data.name === 'Test Electronics',
        'POST /api/v1/admin/categories creates top-level category successfully',
        JSON.stringify(body)
      );
      assert(body.data.slug.startsWith('test-electronics'), 'Auto-generates slug from name');
      assert(body.data.parent_id === null, 'Top-level category has parent_id: null');
      parentCategoryId = body.data.id;
      parentCategorySlug = body.data.slug;
    }

    // Test 5: POST /api/v1/admin/categories with custom explicit slug -> 201
    let customSlugCategoryId = null;
    {
      const res = await fetch(`${baseUrl}/api/v1/admin/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: 'Test Fashion Hub',
          slug: 'test-custom-slug',
          description: 'Trending clothes and styles',
          status: 'active',
        }),
      });
      const body = await res.json();
      assert(
        res.status === 201 && body.data.slug === 'test-custom-slug',
        'POST /api/v1/admin/categories supports explicit unique slug'
      );
      customSlugCategoryId = body.data.id;
    }

    // Test 6: POST /api/v1/admin/categories with duplicate slug -> 409 Conflict
    {
      const res = await fetch(`${baseUrl}/api/v1/admin/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: 'Another Category',
          slug: 'test-custom-slug',
        }),
      });
      const body = await res.json();
      assert(res.status === 409, 'POST /api/v1/admin/categories with duplicate slug returns 409 Conflict');
    }

    console.log('\n--- 2. Subcategory Creation & Parent Association Tests ---');

    // Test 7: POST /api/v1/admin/categories/:id/subcategories with customer -> 403
    {
      const res = await fetch(`${baseUrl}/api/v1/admin/categories/${parentCategoryId}/subcategories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({ name: 'Smartphones' }),
      });
      assert(res.status === 403, 'POST /api/v1/admin/categories/:id/subcategories requires admin (403 for customer)');
    }

    // Test 8: POST /api/v1/admin/categories/99999/subcategories -> 404 Parent Not Found
    {
      const res = await fetch(`${baseUrl}/api/v1/admin/categories/99999/subcategories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ name: 'Smartphones' }),
      });
      assert(res.status === 404, 'POST subcategories with non-existent parent returns 404');
    }

    // Test 9: POST /api/v1/admin/categories/:id/subcategories valid -> 201
    let subcategoryId = null;
    let subcategorySlug = null;
    {
      const res = await fetch(`${baseUrl}/api/v1/admin/categories/${parentCategoryId}/subcategories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: 'Smartphones & 5G',
          description: 'Latest flagship devices',
          status: 'active',
          display_order: 1,
        }),
      });
      const body = await res.json();
      assert(
        res.status === 201 && body.success === true && body.data.parent_id === parentCategoryId,
        'POST /api/v1/admin/categories/:id/subcategories links subcategory to parent',
        JSON.stringify(body)
      );
      subcategoryId = body.data.id;
      subcategorySlug = body.data.slug;
    }

    console.log('\n--- 3. Public Category Catalog Retrieval Tests ---');

    // Test 10: GET /api/v1/categories (public) -> 200 list with nested subcategories
    {
      const res = await fetch(`${baseUrl}/api/v1/categories`);
      const body = await res.json();
      assert(
        res.status === 200 && Array.isArray(body.data),
        'GET /api/v1/categories returns list of active categories'
      );
      const foundParent = body.data.find((c) => c.id === parentCategoryId);
      assert(
        foundParent && Array.isArray(foundParent.subcategories) && foundParent.subcategories.length > 0,
        'GET /api/v1/categories nests active subcategories under parent category'
      );
    }

    // Test 11: GET /api/v1/categories/:id (by ID) -> 200
    {
      const res = await fetch(`${baseUrl}/api/v1/categories/${parentCategoryId}`);
      const body = await res.json();
      assert(
        res.status === 200 && body.data.id === parentCategoryId,
        'GET /api/v1/categories/:id retrieves category details by ID'
      );
      assert(
        Array.isArray(body.data.subcategories) && body.data.subcategories.length > 0,
        'Includes subcategories array in category details'
      );
    }

    // Test 12: GET /api/v1/categories/:slug (by slug) -> 200
    {
      const res = await fetch(`${baseUrl}/api/v1/categories/${parentCategorySlug}`);
      const body = await res.json();
      assert(
        res.status === 200 && body.data.slug === parentCategorySlug,
        'GET /api/v1/categories/:slug retrieves category details by slug'
      );
    }

    // Test 13: GET /api/v1/categories/999999 -> 404
    {
      const res = await fetch(`${baseUrl}/api/v1/categories/999999`);
      assert(res.status === 404, 'GET /api/v1/categories/999999 returns 404 for unknown category');
    }

    // Test 14: GET /api/v1/categories/:id/subcategories -> 200 list of subcategories
    {
      const res = await fetch(`${baseUrl}/api/v1/categories/${parentCategoryId}/subcategories`);
      const body = await res.json();
      assert(
        res.status === 200 && Array.isArray(body.data) && body.data.length > 0,
        'GET /api/v1/categories/:id/subcategories returns subcategories array'
      );
      assert(
        body.data[0].parent_id === parentCategoryId,
        'Subcategories correctly reference parent ID'
      );
    }

    console.log('\n--- 4. Category Update & Cycle Prevention Tests ---');

    // Test 15: PUT /api/v1/admin/categories/:id with customer -> 403
    {
      const res = await fetch(`${baseUrl}/api/v1/admin/categories/${parentCategoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({ name: 'Hacked Name' }),
      });
      assert(res.status === 403, 'PUT /api/v1/admin/categories/:id requires admin (403 for customer)');
    }

    // Test 16: PUT /api/v1/admin/categories/:id cycle check (parent_id = self id) -> 400
    {
      const res = await fetch(`${baseUrl}/api/v1/admin/categories/${parentCategoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ parent_id: parentCategoryId }),
      });
      const body = await res.json();
      assert(
        res.status === 400 && body.code === 'INVALID_PARENT_ID',
        'PUT /api/v1/admin/categories/:id prevents setting category as its own parent'
      );
    }

    // Test 17: PUT /api/v1/admin/categories/:id update name and description -> 200
    {
      const res = await fetch(`${baseUrl}/api/v1/admin/categories/${parentCategoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: 'Updated Electronics & Gadgets',
          description: 'Updated premium electronics catalog',
          display_order: 5,
        }),
      });
      const body = await res.json();
      assert(
        res.status === 200 && body.data.name === 'Updated Electronics & Gadgets',
        'PUT /api/v1/admin/categories/:id updates category details successfully'
      );
    }

    console.log('\n--- 5. Admin Category Listing & Safe Deactivation Tests ---');

    // Test 18: GET /api/v1/admin/categories -> 200
    {
      const res = await fetch(`${baseUrl}/api/v1/admin/categories`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const body = await res.json();
      assert(
        res.status === 200 && Array.isArray(body.data),
        'GET /api/v1/admin/categories lists all categories for admin'
      );
    }

    // Test 19: DELETE /api/v1/admin/categories/:id?deactivate=true (Safe deactivation) -> 200
    {
      const res = await fetch(`${baseUrl}/api/v1/admin/categories/${parentCategoryId}?deactivate=true`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const body = await res.json();
      assert(
        res.status === 200 && body.data.status === 'inactive',
        'DELETE with ?deactivate=true safely sets category status to inactive'
      );

      // Verify subcategory is also deactivated
      const subRes = await Category.findByPk(subcategoryId);
      assert(
        subRes.status === 'inactive',
        'Safe deactivation cascades inactive status to child subcategories'
      );

      // Verify public listing filters it out
      const pubRes = await fetch(`${baseUrl}/api/v1/categories`);
      const pubBody = await pubRes.json();
      const stillVisible = pubBody.data.some((c) => c.id === parentCategoryId);
      assert(!stillVisible, 'Inactive category is hidden from public GET /api/v1/categories');
    }

    // Test 20: DELETE /api/v1/admin/categories/:id (Permanent hard delete) -> 200
    {
      const res = await fetch(`${baseUrl}/api/v1/admin/categories/${customSlugCategoryId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const body = await res.json();
      assert(
        res.status === 200 && body.data.deleted === true,
        'DELETE /api/v1/admin/categories/:id permanently deletes category'
      );

      const check = await Category.findByPk(customSlugCategoryId);
      assert(check === null, 'Category record removed from database');
    }

    console.log('\n--- Cleanup ---');
    await Category.destroy({
      where: {
        id: [parentCategoryId, subcategoryId],
      },
    });
    await User.destroy({
      where: {
        id: [customerUser.id, adminUser.id],
      },
    });
    console.log('Test records cleaned up.');

  } catch (err) {
    console.error('Unexpected test suite error:', err);
    failed++;
  } finally {
    server.close();
    console.log(`\n================================`);
    console.log(`Category Module Results: ${passed} passed, ${failed} failed`);
    console.log(`================================`);
    if (failed > 0) {
      process.exit(1);
    }
  }
}

runCategoryTests();
