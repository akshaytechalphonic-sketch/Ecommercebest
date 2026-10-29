require('dotenv').config();
const http = require('http');
const app = require('../src/app');
const { sequelize, User, Banner, Setting, Category } = require('../src/models');
const { hashPassword } = require('../src/utils/password.util');
const { generateAccessToken } = require('../src/utils/token.util');

async function runBannerAndSettingTests() {
  console.log('=== Starting Banners & Dynamic Logo / Settings Module Test Suite ===\n');
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
    // 0. Cleanup previous test data
    await User.destroy({
      where: {
        email: ['banner_test_admin@example.com', 'banner_test_cust@example.com'],
      },
    });

    await Banner.destroy({
      where: {
        title: [
          'Test Diwali Mega Sale',
          'Test Flash Electronics',
          'Test Sidebar Promo',
          'Test Future Banner',
          'Test Category Electronics Hero',
        ],
      },
    });

    await Category.destroy({
      where: {
        slug: ['banner-test-elec-cat'],
      },
    });

    // Create Test Category for Category Banners
    const testCategory = await Category.create({
      name: 'Banner Test Electronics',
      slug: 'banner-test-elec-cat',
      description: 'Test category for banner targeting',
      status: 'active',
    });

    // Create Admin User
    const adminUser = await User.create({
      name: 'Banner Test Admin',
      email: 'banner_test_admin@example.com',
      password_hash: await hashPassword('Admin@123456'),
      role: 'admin',
      is_active: true,
      email_verified: true,
    });
    const adminToken = generateAccessToken(adminUser);

    // Create Customer User
    const customerUser = await User.create({
      name: 'Banner Test Customer',
      email: 'banner_test_cust@example.com',
      password_hash: await hashPassword('Customer@123456'),
      role: 'customer',
      is_active: true,
      email_verified: true,
    });
    const customerToken = generateAccessToken(customerUser);

    console.log('\n--- 1. Dynamic Logo & Store Branding Tests ---');

    // Test 1.1: Public GET /api/v1/settings/branding returns default branding
    const resBrandingDefault = await fetch(`${baseUrl}/api/v1/settings/branding`);
    const bodyBrandingDefault = await resBrandingDefault.json();
    assert(
      resBrandingDefault.status === 200 && bodyBrandingDefault.success === true,
      'GET /api/v1/settings/branding returns 200 OK',
      JSON.stringify(bodyBrandingDefault)
    );
    assert(
      bodyBrandingDefault.data && typeof bodyBrandingDefault.data.site_name === 'string',
      'GET /api/v1/settings/branding has site_name and branding properties',
      JSON.stringify(bodyBrandingDefault.data)
    );

    // Test 1.2: Customer cannot update branding (403 Forbidden)
    const resCustUpdateBranding = await fetch(`${baseUrl}/api/v1/admin/settings/branding`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        site_name: 'Hacked Store',
      }),
    });
    assert(
      resCustUpdateBranding.status === 403,
      'Customer cannot update branding (403 Forbidden)'
    );

    // Test 1.3: Admin updates dynamic logo and branding
    const dynamicLogoUrl = 'https://multivendor.com/assets/dynamic-logo.svg';
    const dynamicDarkLogoUrl = 'https://multivendor.com/assets/dynamic-logo-dark.svg';
    const dynamicFaviconUrl = 'https://multivendor.com/assets/dynamic-favicon.ico';

    const resAdminUpdateBranding = await fetch(`${baseUrl}/api/v1/admin/settings/branding`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        site_name: 'Bada Vyapaar Marketplace',
        site_tagline: 'Leading Hyperlocal Multivendor Portal',
        site_logo: dynamicLogoUrl,
        site_dark_logo: dynamicDarkLogoUrl,
        site_favicon: dynamicFaviconUrl,
        contact_email: 'hello@badavyapaar.com',
        contact_phone: '+91 99999 88888',
      }),
    });
    const bodyAdminUpdateBranding = await resAdminUpdateBranding.json();
    assert(
      resAdminUpdateBranding.status === 200 && bodyAdminUpdateBranding.success === true,
      'Admin PUT /api/v1/admin/settings/branding returns 200 OK',
      JSON.stringify(bodyAdminUpdateBranding)
    );
    assert(
      bodyAdminUpdateBranding.data.site_logo === dynamicLogoUrl &&
        bodyAdminUpdateBranding.data.site_dark_logo === dynamicDarkLogoUrl,
      'Updated branding contains new dynamic logo and dark logo URLs',
      JSON.stringify(bodyAdminUpdateBranding.data)
    );

    // Test 1.4: Public GET /api/v1/settings/branding returns the newly saved dynamic logo!
    const resBrandingUpdated = await fetch(`${baseUrl}/api/v1/settings/branding`);
    const bodyBrandingUpdated = await resBrandingUpdated.json();
    assert(
      bodyBrandingUpdated.data.site_logo === dynamicLogoUrl &&
        bodyBrandingUpdated.data.site_name === 'Bada Vyapaar Marketplace',
      'Public GET /api/v1/settings/branding reflects updated dynamic logo immediately',
      JSON.stringify(bodyBrandingUpdated.data)
    );

    console.log('\n--- 2. Promotional Banners Module Tests ---');

    // Test 2.1: Admin creates banner validation failure (missing required title/image)
    const resCreateInvalid = await fetch(`${baseUrl}/api/v1/admin/banners`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        description: 'Missing title and image',
      }),
    });
    const bodyCreateInvalid = await resCreateInvalid.json();
    assert(
      resCreateInvalid.status === 400 && bodyCreateInvalid.success === false,
      'Creating banner with missing fields returns 400 Validation Error'
    );

    // Test 2.2: Admin creates valid Home Hero banner (category_id: null)
    const resCreateBanner1 = await fetch(`${baseUrl}/api/v1/admin/banners`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Test Diwali Mega Sale',
        subtitle: 'Up to 70% Off on Top Categories',
        description: 'Huge discounts on fashion, electronics, and home essentials',
        image_url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1400',
        mobile_image_url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600',
        link_url: '/category/electronics',
        banner_type: 'home_hero',
        category_id: null,
        position: 1,
        is_active: true,
      }),
    });
    const bodyCreateBanner1 = await resCreateBanner1.json();
    assert(
      resCreateBanner1.status === 201 && bodyCreateBanner1.success === true,
      'Admin POST /api/v1/admin/banners creates homepage hero banner (201 Created)',
      JSON.stringify(bodyCreateBanner1)
    );
    const banner1Id = bodyCreateBanner1.data.id;

    // Test 2.3: Admin creates Category-Specific banner
    const resCreateCatBanner = await fetch(`${baseUrl}/api/v1/admin/banners`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Test Category Electronics Hero',
        subtitle: 'Best Smartphones & Laptops at Unbeatable Prices',
        image_url: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1400',
        link_url: `/category/${testCategory.slug}`,
        banner_type: 'home_hero',
        category_id: testCategory.id,
        position: 1,
        is_active: true,
      }),
    });
    const bodyCreateCatBanner = await resCreateCatBanner.json();
    assert(
      resCreateCatBanner.status === 201 && bodyCreateCatBanner.data.category_id == testCategory.id,
      'Admin creates category-specific banner successfully',
      JSON.stringify(bodyCreateCatBanner.data)
    );
    const catBannerId = bodyCreateCatBanner.data.id;

    // Test 2.4: Admin creates second banner (sidebar type)
    const resCreateBanner2 = await fetch(`${baseUrl}/api/v1/admin/banners`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Test Sidebar Promo',
        subtitle: 'Exclusive Credit Card Cashback',
        image_url: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=400',
        link_url: '/deals/cashback',
        banner_type: 'sidebar',
        position: 2,
        is_active: true,
      }),
    });
    const bodyCreateBanner2 = await resCreateBanner2.json();
    assert(
      resCreateBanner2.status === 201,
      'Admin creates second promotional banner with type sidebar'
    );
    const banner2Id = bodyCreateBanner2.data.id;

    // Test 2.5: Public GET /api/v1/banners returns active banners
    const resPublicBanners = await fetch(`${baseUrl}/api/v1/banners`);
    const bodyPublicBanners = await resPublicBanners.json();
    assert(
      resPublicBanners.status === 200 && Array.isArray(bodyPublicBanners.data),
      'Public GET /api/v1/banners returns active banners array'
    );
    const foundBanner1 = bodyPublicBanners.data.find((b) => b.id == banner1Id);
    assert(
      !!foundBanner1 && foundBanner1.title === 'Test Diwali Mega Sale',
      'Public banner list includes created hero banner'
    );

    // Test 2.6: Query category-specific banner GET /api/v1/banners?category_id=...
    const resCatBanners = await fetch(`${baseUrl}/api/v1/banners?category_id=${testCategory.id}`);
    const bodyCatBanners = await resCatBanners.json();
    assert(
      resCatBanners.status === 200 &&
        bodyCatBanners.data.length > 0 &&
        bodyCatBanners.data[0].id == catBannerId &&
        bodyCatBanners.data[0].category_id == testCategory.id,
      'Public GET /api/v1/banners?category_id=ID returns category-specific banners dynamically',
      JSON.stringify(bodyCatBanners.data)
    );

    // Test 2.7: Query homepage-only banners with category_id=null
    const resHomeOnly = await fetch(`${baseUrl}/api/v1/banners?category_id=null`);
    const bodyHomeOnly = await resHomeOnly.json();
    assert(
      bodyHomeOnly.data.every((b) => b.category_id === null),
      'Public GET /api/v1/banners?category_id=null strictly filters homepage banners'
    );

    // Test 2.8: Filter public banners by banner_type=home_hero
    const resFilteredBanners = await fetch(`${baseUrl}/api/v1/banners?banner_type=home_hero`);
    const bodyFilteredBanners = await resFilteredBanners.json();
    assert(
      bodyFilteredBanners.data.every((b) => b.banner_type === 'home_hero'),
      'Public banner list properly filters by banner_type query param'
    );

    // Test 2.9: Track banner click POST /api/v1/banners/:id/click
    const resClick = await fetch(`${baseUrl}/api/v1/banners/${banner1Id}/click`, {
      method: 'POST',
    });
    const bodyClick = await resClick.json();
    assert(
      resClick.status === 200 && bodyClick.data.click_count >= 1,
      'POST /api/v1/banners/:id/click increments click count atomically',
      JSON.stringify(bodyClick)
    );

    // Test 2.10: Admin GET /api/v1/admin/banners returns paginated list with stats & category count
    const resAdminBanners = await fetch(`${baseUrl}/api/v1/admin/banners`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    const bodyAdminBanners = await resAdminBanners.json();
    assert(
      resAdminBanners.status === 200 &&
        bodyAdminBanners.data.stats &&
        bodyAdminBanners.data.stats.category_banners >= 1,
      'Admin GET /api/v1/admin/banners includes category_banners counter in stats',
      JSON.stringify(bodyAdminBanners.data.stats)
    );

    // Test 2.11: Admin updates banner status to inactive (PATCH /api/v1/admin/banners/:id/status)
    const resDeactivate = await fetch(`${baseUrl}/api/v1/admin/banners/${banner1Id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ is_active: false }),
    });
    assert(resDeactivate.status === 200, 'Admin can toggle banner status to inactive');

    // Test 2.12: Deactivated banner should not appear in public active banners list
    const resPublicAfterDeactivate = await fetch(`${baseUrl}/api/v1/banners`);
    const bodyPublicAfterDeactivate = await resPublicAfterDeactivate.json();
    const foundDeactivated = bodyPublicAfterDeactivate.data.find((b) => b.id == banner1Id);
    assert(
      !foundDeactivated,
      'Deactivated banner is excluded from public customer banner feed'
    );

    // Test 2.13: Admin updates banner content (PUT /api/v1/admin/banners/:id)
    const resUpdateBanner = await fetch(`${baseUrl}/api/v1/admin/banners/${banner1Id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Test Diwali Mega Sale (Updated)',
        is_active: true,
      }),
    });
    const bodyUpdateBanner = await resUpdateBanner.json();
    assert(
      resUpdateBanner.status === 200 &&
        bodyUpdateBanner.data.title === 'Test Diwali Mega Sale (Updated)' &&
        bodyUpdateBanner.data.is_active === true,
      'Admin can update banner details and reactivate it'
    );

    // Test 2.14: Admin deletes banner (DELETE /api/v1/admin/banners/:id)
    const resDeleteBanner = await fetch(`${baseUrl}/api/v1/admin/banners/${banner2Id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    assert(resDeleteBanner.status === 200, 'Admin can delete a promotional banner');

    const resCheckDeleted = await fetch(`${baseUrl}/api/v1/banners/${banner2Id}`);
    assert(resCheckDeleted.status === 404, 'Deleted banner returns 404 Not Found');

    console.log(`\n========================================`);
    console.log(`Tests Completed! Passed: ${passed}, Failed: ${failed}`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test run error:', err);
    process.exit(1);
  } finally {
    server.close();
  }
}

runBannerAndSettingTests();
