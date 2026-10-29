require('dotenv').config();
const http = require('http');
const app = require('../src/app');
const { sequelize, User, Address, RefreshToken } = require('../src/models');
const { hashPassword } = require('../src/utils/password.util');
const { generateAccessToken } = require('../src/utils/token.util');

async function runUserAddressTests() {
  console.log('--- Starting User Profile & Address Test Suite ---');
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
    // 0. Clean test users from previous runs
    await User.destroy({
      where: { email: ['profile_test1@example.com', 'profile_test2@example.com'] },
    });

    const user1 = await User.create({
      name: 'User One',
      email: 'profile_test1@example.com',
      password_hash: await hashPassword('Password@123'),
      phone: '9811111111',
      role: 'customer',
      status: 'active',
      is_verified: true,
    });

    const user2 = await User.create({
      name: 'User Two',
      email: 'profile_test2@example.com',
      password_hash: await hashPassword('Password@123'),
      phone: '9822222222',
      role: 'customer',
      status: 'active',
      is_verified: true,
    });

    const token1 = generateAccessToken(user1);
    const token2 = generateAccessToken(user2);

    // 1. GET /api/v1/users/profile
    const resNoToken = await fetch(`${baseUrl}/api/v1/users/profile`);
    assert(resNoToken.status === 401, 'GET /profile without token is rejected (401)');

    const resProfile1 = await fetch(`${baseUrl}/api/v1/users/profile`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    const dataProfile1 = await resProfile1.json();
    assert(
      resProfile1.status === 200 && dataProfile1.data.email === 'profile_test1@example.com',
      'GET /profile with valid token returns user details and addresses array'
    );
    assert(Array.isArray(dataProfile1.data.addresses), 'User profile includes addresses list');

    // 2. PUT /api/v1/users/profile (Update name & avatar)
    const resUpdate1 = await fetch(`${baseUrl}/api/v1/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({
        name: 'User One Updated',
        avatar_url: 'https://images.unsplash.com/photo-user.jpg',
      }),
    });
    const dataUpdate1 = await resUpdate1.json();
    assert(
      resUpdate1.status === 200 && dataUpdate1.data.name === 'User One Updated',
      'PUT /profile updates name and avatar_url'
    );

    // 3. PUT /api/v1/users/profile (Reject duplicate phone)
    const resDupPhone = await fetch(`${baseUrl}/api/v1/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({
        phone: '9822222222', // already used by user2
      }),
    });
    const dataDupPhone = await resDupPhone.json();
    assert(
      resDupPhone.status === 409 && dataDupPhone.code === 'DUPLICATE_PHONE',
      'PUT /profile rejects phone number already belonging to another account'
    );

    // 4. PUT /api/v1/users/change-password
    const resWrongPass = await fetch(`${baseUrl}/api/v1/users/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({
        current_password: 'WrongCurrentPassword',
        new_password: 'NewPassword@2026',
      }),
    });
    const dataWrongPass = await resWrongPass.json();
    assert(
      resWrongPass.status === 400 && dataWrongPass.code === 'INVALID_CURRENT_PASSWORD',
      'PUT /change-password rejects incorrect current password'
    );

    const resChangePass = await fetch(`${baseUrl}/api/v1/users/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({
        current_password: 'Password@123',
        new_password: 'NewPassword@2026',
      }),
    });
    const dataChangePass = await resChangePass.json();
    assert(
      resChangePass.status === 200 && dataChangePass.success === true,
      'PUT /change-password succeeds with valid passwords'
    );

    // Verify login with new password works
    const resLoginNew = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'profile_test1@example.com',
        password: 'NewPassword@2026',
      }),
    });
    const dataLoginNew = await resLoginNew.json();
    assert(resLoginNew.status === 200 && dataLoginNew.success === true, 'Login succeeds with changed password');
    const freshToken1 = dataLoginNew.data.tokens.access_token;

    // 5. POST /api/v1/users/addresses (Create First Address -> auto default)
    const addrPayload1 = {
      recipient_name: 'John Delivery',
      phone: '9811111111',
      address_line1: 'B-102, Green Valley Apartments',
      address_line2: 'Near Central Park',
      city: 'Noida',
      state: 'Uttar Pradesh',
      postal_code: '201301',
      country: 'India',
      type: 'home',
      is_default: false, // will auto become true because it's first
    };
    const resAdd1 = await fetch(`${baseUrl}/api/v1/users/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${freshToken1}`,
      },
      body: JSON.stringify(addrPayload1),
    });
    const dataAdd1 = await resAdd1.json();
    assert(
      resAdd1.status === 201 && dataAdd1.data.is_default === true,
      'POST /addresses creates address and sets is_default=true for user first address'
    );
    const addressId1 = dataAdd1.data.id;

    // 6. POST /api/v1/users/addresses (Create Second Address as Default)
    const addrPayload2 = {
      recipient_name: 'John Office',
      phone: '9811111111',
      address_line1: 'Tech Hub, Sector 62',
      city: 'Noida',
      state: 'Uttar Pradesh',
      postal_code: '201309',
      country: 'India',
      type: 'work',
      is_default: true,
    };
    const resAdd2 = await fetch(`${baseUrl}/api/v1/users/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${freshToken1}`,
      },
      body: JSON.stringify(addrPayload2),
    });
    const dataAdd2 = await resAdd2.json();
    assert(
      resAdd2.status === 201 && dataAdd2.data.is_default === true,
      'POST /addresses creates second address marked as default'
    );
    const addressId2 = dataAdd2.data.id;

    // 7. GET /api/v1/users/addresses (Verify address list and default ordering)
    const resList = await fetch(`${baseUrl}/api/v1/users/addresses`, {
      headers: { Authorization: `Bearer ${freshToken1}` },
    });
    const dataList = await resList.json();
    assert(
      resList.status === 200 && dataList.data.length === 2,
      'GET /addresses returns all user addresses'
    );
    assert(
      dataList.data[0].id === addressId2 && dataList.data[0].is_default === true,
      'First address in list is the active default address'
    );
    assert(
      dataList.data[1].id === addressId1 && dataList.data[1].is_default === false,
      'Previous default address was unset to false'
    );

    // 8. Security Check: User 2 cannot access or delete User 1 address
    const resOtherUser = await fetch(`${baseUrl}/api/v1/users/addresses/${addressId1}`, {
      headers: { Authorization: `Bearer ${token2}` },
    });
    assert(resOtherUser.status === 404, 'User 2 receives 404 trying to access User 1 address');

    // 9. PUT /api/v1/users/addresses/:id (Update address)
    const resUpdateAddr = await fetch(`${baseUrl}/api/v1/users/addresses/${addressId1}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${freshToken1}`,
      },
      body: JSON.stringify({
        address_line1: 'B-102, Green Valley Phase 2',
        city: 'Greater Noida',
      }),
    });
    const dataUpdateAddr = await resUpdateAddr.json();
    assert(
      resUpdateAddr.status === 200 && dataUpdateAddr.data.city === 'Greater Noida',
      'PUT /addresses/:id updates address details successfully'
    );

    // 10. PATCH /api/v1/users/addresses/:id/default (Promote address 1 back to default)
    const resSetDefault = await fetch(`${baseUrl}/api/v1/users/addresses/${addressId1}/default`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${freshToken1}` },
    });
    const dataSetDefault = await resSetDefault.json();
    assert(
      resSetDefault.status === 200 && dataSetDefault.data.is_default === true,
      'PATCH /addresses/:id/default sets address 1 as default'
    );

    // Verify address 2 is no longer default
    const addr2Check = await Address.findByPk(addressId2);
    assert(addr2Check.is_default === false, 'Address 2 is now is_default=false in DB');

    // 11. DELETE /api/v1/users/addresses/:id
    const resDelete = await fetch(`${baseUrl}/api/v1/users/addresses/${addressId1}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${freshToken1}` },
    });
    const dataDelete = await resDelete.json();
    assert(resDelete.status === 200 && dataDelete.success === true, 'DELETE /addresses/:id deletes address');

    // Verify address 2 was promoted to default because address 1 (the default) was deleted
    const addr2AfterDelete = await Address.findByPk(addressId2);
    assert(
      addr2AfterDelete.is_default === true,
      'When default address is deleted, remaining address is promoted to default'
    );

    // 12. Direct endpoint /api/v1/addresses check
    const resDirect = await fetch(`${baseUrl}/api/v1/addresses`, {
      headers: { Authorization: `Bearer ${freshToken1}` },
    });
    const dataDirect = await resDirect.json();
    assert(
      resDirect.status === 200 && Array.isArray(dataDirect.data),
      'GET /api/v1/addresses direct alias endpoint works properly'
    );

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    server.close();
    console.log(`\n========================================`);
    console.log(`User Profile & Address Tests Passed: ${passed}`);
    console.log(`User Profile & Address Tests Failed: ${failed}`);
    console.log(`========================================\n`);
    process.exit(failed > 0 ? 1 : 0);
  }
}

runUserAddressTests();
