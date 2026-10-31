require('dotenv').config();
const http = require('http');
const app = require('../src/app');
const {
  sequelize,
  User,
  Banner,
  Category,
  HeaderMenu,
  HeaderMenuItem,
} = require('../src/models');
const { generateAccessToken } = require('../src/utils/token.util');
const { hashPassword } = require('../src/utils/password.util');

async function runHeaderMenuTests() {
  console.log('=== Starting Header Menu & Navigation Management Test Suite ===\n');

  await sequelize.authenticate();
  await sequelize.sync();
  console.log('Database connected and synchronized.\n');

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
      console.error(`  [FAIL] ${testName}: ${details}`);
      failed++;
    }
  }

  try {
    // 0. Clean previous test users
    await User.destroy({
      where: { email: ['menu_admin@example.com', 'menu_customer@example.com'] },
    });

    const hashedPassword = await hashPassword('Password@123');

    const adminUser = await User.create({
      name: 'Menu Admin',
      email: 'menu_admin@example.com',
      password_hash: hashedPassword,
      role: 'admin',
      is_active: true,
      email_verified: true,
    });

    const customerUser = await User.create({
      name: 'Menu Customer',
      email: 'menu_customer@example.com',
      password_hash: hashedPassword,
      role: 'customer',
      is_active: true,
      email_verified: true,
    });

    const adminToken = generateAccessToken(adminUser);
    const customerToken = generateAccessToken(customerUser);

    // Setup a test category
    let [testCategory] = await Category.findOrCreate({
      where: { slug: 'menu-test-category' },
      defaults: {
        name: 'Menu Test Category',
        slug: 'menu-test-category',
        status: 'active',
      },
    });

    // Setup a test banner
    let [testBanner] = await Banner.findOrCreate({
      where: { title: 'Menu Test Promo Banner' },
      defaults: {
        title: 'Menu Test Promo Banner',
        subtitle: 'Up to 50% Off',
        image_url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef',
        link_url: '/category/home-and-living',
        banner_type: 'home_hero',
        position: 1,
        is_active: true,
      },
    });

    // Clean up any previous test menus & items
    const oldMenus = await HeaderMenu.findAll({
      where: { slug: ['home-living-test', 'fashion-trends-test', 'mega-sale-test', 'home-decor-living'] },
    });
    if (oldMenus.length) {
      const oldMenuIds = oldMenus.map((m) => m.id);
      await HeaderMenuItem.update({ parent_id: null }, { where: { parent_menu_id: oldMenuIds } });
      await HeaderMenuItem.destroy({ where: { parent_menu_id: oldMenuIds } });
      await HeaderMenu.destroy({ where: { id: oldMenuIds } });
    }

    // -------------------------------------------------------------------------
    // TEST 1: Security - Unauthorized Access
    // -------------------------------------------------------------------------
    console.log('--- 1. Security & Role Authorization Tests ---');
    const unauthRes = await fetch(`${baseUrl}/api/v1/admin/header-menus`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Unauthorized Menu' }),
    });
    const unauthData = await unauthRes.json();
    assert(
      unauthRes.status === 401 && !unauthData.success,
      'POST /api/v1/admin/header-menus rejects request without token (401)'
    );

    const forbiddenRes = await fetch(`${baseUrl}/api/v1/admin/header-menus`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({ name: 'Customer Menu' }),
    });
    const forbiddenData = await forbiddenRes.json();
    assert(
      forbiddenRes.status === 403 && !forbiddenData.success,
      'POST /api/v1/admin/header-menus rejects customer user (403 Forbidden)'
    );

    // -------------------------------------------------------------------------
    // TEST 2: Admin - Create Dynamic Header Menus
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Header Menu CRUD & Banner Association Tests ---');
    const createMenuRes1 = await fetch(`${baseUrl}/api/v1/admin/header-menus`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Home & Living',
        slug: 'home-living-test',
        url: '/category/home-living',
        icon: 'https://example.com/icons/home.svg',
        image: 'https://example.com/images/home.jpg',
        status: 'active',
        display_order: 1,
        banner_id: testBanner.id,
        category_id: testCategory.id,
      }),
    });
    const createMenuData1 = await createMenuRes1.json();
    assert(
      createMenuRes1.status === 201 && createMenuData1.success && createMenuData1.data?.id,
      'POST /api/v1/admin/header-menus creates menu with banner & category (201)',
      JSON.stringify(createMenuData1)
    );
    const menu1Id = createMenuData1.data?.id;

    // Create a second menu
    const createMenuRes2 = await fetch(`${baseUrl}/api/v1/admin/header-menus`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Fashion Trends',
        slug: 'fashion-trends-test',
        url: '/category/fashion',
        status: 'active',
        display_order: 2,
      }),
    });
    const createMenuData2 = await createMenuRes2.json();
    assert(
      createMenuRes2.status === 201 && createMenuData2.data?.slug === 'fashion-trends-test',
      'POST /api/v1/admin/header-menus creates second menu with custom slug'
    );
    const menu2Id = createMenuData2.data?.id;

    // Test duplicate slug validation
    const duplicateRes = await fetch(`${baseUrl}/api/v1/admin/header-menus`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Duplicate Fashion',
        slug: 'fashion-trends-test',
      }),
    });
    assert(
      duplicateRes.status === 409,
      'POST /api/v1/admin/header-menus rejects duplicate slug with 409 Conflict'
    );

    // -------------------------------------------------------------------------
    // TEST 3: Admin - Get All Menus & Individual Menu
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Retrieve Header Menus Tests ---');
    const getAllRes = await fetch(`${baseUrl}/api/v1/admin/header-menus`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const getAllData = await getAllRes.json();
    assert(
      getAllRes.status === 200 && Array.isArray(getAllData.data) && getAllData.data.some((m) => m.id === menu1Id),
      'GET /api/v1/admin/header-menus returns all menus with items array'
    );

    const getByIdRes = await fetch(`${baseUrl}/api/v1/admin/header-menus/${menu1Id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const getByIdData = await getByIdRes.json();
    assert(
      getByIdRes.status === 200 &&
        getByIdData.data?.id === menu1Id &&
        getByIdData.data?.banner?.id === testBanner.id,
      'GET /api/v1/admin/header-menus/:id returns menu with associated banner object'
    );

    // -------------------------------------------------------------------------
    // TEST 4: Admin - Update Header Menu & Toggle Status
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Update Header Menu & Status Tests ---');
    const updateRes = await fetch(`${baseUrl}/api/v1/admin/header-menus/${menu1Id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Home, Decor & Living',
        url: '/category/home-decor-living',
      }),
    });
    const updateData = await updateRes.json();
    assert(
      updateRes.status === 200 && updateData.data?.name === 'Home, Decor & Living',
      'PUT /api/v1/admin/header-menus/:id updates menu details'
    );

    const statusToggleRes = await fetch(`${baseUrl}/api/v1/admin/header-menus/${menu2Id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'inactive' }),
    });
    const statusToggleData = await statusToggleRes.json();
    assert(
      statusToggleRes.status === 200 && statusToggleData.data?.status === 'inactive',
      'PATCH /api/v1/admin/header-menus/:id/status updates status to inactive'
    );

    // -------------------------------------------------------------------------
    // TEST 5: Admin - Reorder Menus
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Menu Reordering Tests ---');
    const reorderRes = await fetch(`${baseUrl}/api/v1/admin/header-menus/reorder`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        items: [
          { id: menu1Id, display_order: 10 },
          { id: menu2Id, display_order: 5 },
        ],
      }),
    });
    const reorderData = await reorderRes.json();
    assert(
      reorderRes.status === 200 && reorderData.success,
      'PATCH /api/v1/admin/header-menus/reorder successfully updates display orders'
    );

    // -------------------------------------------------------------------------
    // TEST 6: Submenu Management & Multi-Level Nesting
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Multi-Level Submenu Items & Banner Association Tests ---');
    // Level 1: "Bed & Bath" under Home menu
    const createSubmenuRes1 = await fetch(`${baseUrl}/api/v1/admin/header-menus/${menu1Id}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Bed & Bath',
        slug: 'bed-bath',
        parent_id: null,
        redirect_url: '/category/bed-bath',
        display_order: 1,
        banner_id: testBanner.id,
      }),
    });
    const createSubmenuData1 = await createSubmenuRes1.json();
    assert(
      createSubmenuRes1.status === 201 && createSubmenuData1.data?.id,
      'POST /api/v1/admin/header-menus/:id/items creates Level-1 submenu (Bed & Bath)'
    );
    const bedBathId = createSubmenuData1.data?.id;

    // Level 1: "Decor" under Home menu
    const createSubmenuRes2 = await fetch(`${baseUrl}/api/v1/admin/header-menus/${menu1Id}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Decor',
        slug: 'decor',
        parent_id: null,
        redirect_url: '/category/decor',
        display_order: 2,
      }),
    });
    const createSubmenuData2 = await createSubmenuRes2.json();
    const decorId = createSubmenuData2.data?.id;

    // Level 2: "Bedsheets" under "Bed & Bath"
    const createChildRes1 = await fetch(`${baseUrl}/api/v1/admin/header-menus/${menu1Id}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Bedsheets',
        slug: 'bedsheets',
        parent_id: bedBathId,
        redirect_url: '/category/bedsheets',
        display_order: 1,
      }),
    });
    const createChildData1 = await createChildRes1.json();
    assert(
      createChildRes1.status === 201 && createChildData1.data?.parent_id === bedBathId,
      'POST /api/v1/admin/header-menus/:id/items creates Level-2 child item (Bedsheets under Bed & Bath)'
    );
    const bedsheetsId = createChildData1.data?.id;

    // Level 2: "Blankets & Quilts" under "Bed & Bath"
    await fetch(`${baseUrl}/api/v1/admin/header-menus/${menu1Id}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Blankets & Quilts',
        slug: 'blankets-quilts',
        parent_id: bedBathId,
        redirect_url: '/category/blankets-quilts',
        display_order: 2,
      }),
    });

    // Level 2: "Wall Decor" under "Decor"
    await fetch(`${baseUrl}/api/v1/admin/header-menus/${menu1Id}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Wall Decor',
        slug: 'wall-decor',
        parent_id: decorId,
        redirect_url: '/category/wall-decor',
        display_order: 1,
      }),
    });

    // Verify GET /api/v1/admin/header-menus/:id/items returns nested tree
    const getItemsRes = await fetch(`${baseUrl}/api/v1/admin/header-menus/${menu1Id}/items`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const getItemsData = await getItemsRes.json();
    const bedBathItem = getItemsData.data?.find((i) => i.id === bedBathId);
    assert(
      getItemsRes.status === 200 &&
        Array.isArray(getItemsData.data) &&
        bedBathItem &&
        bedBathItem.children?.some((c) => c.name === 'Bedsheets'),
      'GET /api/v1/admin/header-menus/:id/items returns multi-level nested children tree'
    );

    // -------------------------------------------------------------------------
    // TEST 7: Update and Delete Submenu Item
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Submenu Item Modification Tests ---');
    const updateItemRes = await fetch(`${baseUrl}/api/v1/admin/header-menu-items/${bedsheetsId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Luxury Bedsheets',
        display_order: 5,
      }),
    });
    const updateItemData = await updateItemRes.json();
    assert(
      updateItemRes.status === 200 && updateItemData.data?.name === 'Luxury Bedsheets',
      'PUT /api/v1/admin/header-menu-items/:itemId updates submenu item name'
    );

    // Delete single child item
    const deleteItemRes = await fetch(`${baseUrl}/api/v1/admin/header-menu-items/${bedsheetsId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      deleteItemRes.status === 200,
      'DELETE /api/v1/admin/header-menu-items/:itemId deletes item successfully'
    );

    // -------------------------------------------------------------------------
    // TEST 8: Public Storefront API
    // -------------------------------------------------------------------------
    console.log('\n--- 8. Public Storefront Navigation API Tests ---');
    const storefrontRes = await fetch(`${baseUrl}/api/v1/storefront/header-menu`);
    const storefrontData = await storefrontRes.json();
    assert(
      storefrontRes.status === 200 && storefrontData.success && Array.isArray(storefrontData.data),
      'GET /api/v1/storefront/header-menu works publicly without authentication (200)'
    );

    const storefrontHome = storefrontData.data?.find((m) => m.id === menu1Id);
    const storefrontInactive = storefrontData.data?.find((m) => m.id === menu2Id);
    assert(
      storefrontHome &&
        storefrontHome.status === 'active' &&
        storefrontHome.banner?.title === testBanner.title &&
        Array.isArray(storefrontHome.items) &&
        !storefrontInactive,
      'GET /api/v1/storefront/header-menu filters out inactive menus and returns active banners & items'
    );

    // -------------------------------------------------------------------------
    // TEST 9: Delete Header Menu & Cascade Cleanup
    // -------------------------------------------------------------------------
    console.log('\n--- 9. Delete Header Menu & Cascade Cleanup Tests ---');
    const deleteMenuRes = await fetch(`${baseUrl}/api/v1/admin/header-menus/${menu1Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const deleteMenuData = await deleteMenuRes.json();
    assert(
      deleteMenuRes.status === 200 && deleteMenuData.success,
      'DELETE /api/v1/admin/header-menus/:id deletes menu and its submenus'
    );

    // Clean up second menu
    await fetch(`${baseUrl}/api/v1/admin/header-menus/${menu2Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    // Cleanup test users and banner
    await User.destroy({ where: { email: ['menu_admin@example.com', 'menu_customer@example.com'] } });
    await Banner.destroy({ where: { title: 'Menu Test Promo Banner' } });
    await Category.destroy({ where: { slug: 'menu-test-category' } });

  } catch (err) {
    console.error('Test Suite encountered an unexpected error:', err);
    failed++;
  } finally {
    server.close();
  }

  console.log('\n==================================================');
  console.log(`Header Menu Test Suite Completed: ${passed} Passed, ${failed} Failed`);
  console.log('==================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runHeaderMenuTests();
