require('dotenv').config();
const http = require('http');
const app = require('../src/app');
const { sequelize, User, RefreshToken, PasswordResetToken, Order, OrderItem, Commission } = require('../src/models');

async function runTestSuite() {
  console.log('--- Starting Authentication Test Suite ---');
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
    // 0. Clean test users from previous runs safely
    const testUsers = await User.findAll({
      where: { email: ['testuser@example.com', 'blockeduser@example.com', 'admin_attempt@example.com'] },
      attributes: ['id'],
    });
    if (testUsers.length > 0) {
      const userIds = testUsers.map((u) => u.id);
      const orders = await Order.findAll({ where: { user_id: userIds }, attributes: ['id'] });
      if (orders.length > 0) {
        const orderIds = orders.map((o) => o.id);
        await Commission.destroy({ where: { order_id: orderIds } });
        await OrderItem.destroy({ where: { order_id: orderIds } });
        await Order.destroy({ where: { id: orderIds } });
      }
    }
    await User.destroy({ where: { email: ['testuser@example.com', 'blockeduser@example.com', 'admin_attempt@example.com'] } });

    // 1. Verify GET /, GET /api/health, and Swagger Docs
    const resRoot = await fetch(`${baseUrl}/`);
    const dataRoot = await resRoot.json();
    assert(resRoot.status === 200 && dataRoot.success === true, 'GET / returns 200 and running message');

    const resHealth = await fetch(`${baseUrl}/api/health`);
    const dataHealth = await resHealth.json();
    assert(resHealth.status === 200 && dataHealth.message === 'API is healthy', 'GET /api/health returns healthy');

    const resSwaggerJson = await fetch(`${baseUrl}/api-docs.json`);
    const dataSwaggerJson = await resSwaggerJson.json();
    assert(resSwaggerJson.status === 200 && dataSwaggerJson.openapi === '3.0.0', 'GET /api-docs.json returns valid OpenAPI 3.0 specification');
    assert(Boolean(dataSwaggerJson.paths['/api/v1/auth/register']), 'Swagger spec includes /api/v1/auth/register');
    assert(Boolean(dataSwaggerJson.paths['/api/v1/auth/login']), 'Swagger spec includes /api/v1/auth/login');
    assert(Boolean(dataSwaggerJson.paths['/api/v1/auth/me']), 'Swagger spec includes /api/v1/auth/me');

    const resSwaggerUi = await fetch(`${baseUrl}/api-docs/`);
    assert(resSwaggerUi.status === 200, 'GET /api-docs/ returns 200 Swagger UI HTML page');

    // 2. Customer Registration
    const regPayload = {
      name: 'Test Customer',
      email: 'testuser@example.com',
      password: 'Password@123',
      phone: '9876543210',
    };
    const resReg = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(regPayload),
    });
    const dataReg = await resReg.json();
    assert(resReg.status === 201 && dataReg.success === true, 'POST /register creates customer', JSON.stringify(dataReg));
    assert(dataReg.data.user.role === 'customer', 'Registered user role defaults to customer');
    assert(dataReg.data.user.password_hash === undefined, 'Password hash is NOT exposed in registration response');
    assert(Boolean(dataReg.data.tokens.access_token && dataReg.data.tokens.refresh_token), 'Tokens returned on registration');

    const initialAccessToken = dataReg.data.tokens.access_token;
    let currentRefreshToken = dataReg.data.tokens.refresh_token;

    // 3. Prevent Privilege Escalation via Registration
    const privPayload = {
      name: 'Hacker Admin',
      email: 'admin_attempt@example.com',
      password: 'Password@123',
      phone: '9876543299',
      role: 'admin', // attempting privilege escalation
    };
    const resPriv = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(privPayload),
    });
    const dataPriv = await resPriv.json();
    assert(resPriv.status === 201 && dataPriv.data.user.role === 'customer', 'Public registration cannot create admin/vendor (forces customer role)');

    // 4. Duplicate Email Rejection
    const resDupEmail = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(regPayload),
    });
    const dataDupEmail = await resDupEmail.json();
    assert(resDupEmail.status === 409 && dataDupEmail.code === 'DUPLICATE_EMAIL', 'Reject duplicate email with 409 DUPLICATE_EMAIL');

    // 5. Duplicate Phone Rejection
    const resDupPhone = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Another User',
        email: 'another@example.com',
        password: 'Password@123',
        phone: '9876543210',
      }),
    });
    const dataDupPhone = await resDupPhone.json();
    assert(resDupPhone.status === 409 && dataDupPhone.code === 'DUPLICATE_PHONE', 'Reject duplicate phone with 409 DUPLICATE_PHONE');

    // 6. Validation Failure (Invalid email & short password)
    const resInvalid = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'A',
        email: 'invalid-email',
        password: '123',
      }),
    });
    const dataInvalid = await resInvalid.json();
    assert(resInvalid.status === 400 && dataInvalid.code === 'VALIDATION_ERROR' && dataInvalid.errors.length > 0, 'Zod validation error structure is standard');

    // 7. Login with Email
    const resLoginEmail = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'testuser@example.com',
        password: 'Password@123',
      }),
    });
    const dataLoginEmail = await resLoginEmail.json();
    assert(resLoginEmail.status === 200 && dataLoginEmail.success === true, 'POST /login with email succeeds');
    assert(dataLoginEmail.data.user.password_hash === undefined, 'Password hash is NOT exposed in login response');

    // 8. Login with Phone
    const resLoginPhone = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: '9876543210',
        password: 'Password@123',
      }),
    });
    const dataLoginPhone = await resLoginPhone.json();
    assert(resLoginPhone.status === 200 && dataLoginPhone.success === true, 'POST /login with phone succeeds');

    // 9. Login with Invalid Credentials (Account enumeration prevention)
    const resBadLogin = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'nonexistent@example.com',
        password: 'WrongPassword',
      }),
    });
    const dataBadLogin = await resBadLogin.json();
    assert(resBadLogin.status === 401 && dataBadLogin.message === 'Invalid email/phone or password', 'Generic error on bad login to prevent account enumeration');

    // 10. Reject Blocked or Inactive Users
    const blockedUser = await User.create({
      name: 'Blocked User',
      email: 'blockeduser@example.com',
      password_hash: await require('../src/utils/password.util').hashPassword('Password@123'),
      role: 'customer',
      status: 'blocked',
      is_verified: true,
    });
    const resBlockedLogin = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'blockeduser@example.com',
        password: 'Password@123',
      }),
    });
    const dataBlockedLogin = await resBlockedLogin.json();
    assert(resBlockedLogin.status === 403 && dataBlockedLogin.code === 'ACCOUNT_INACTIVE', 'Reject blocked user on login with 403');

    // 11. GET /me with Valid Token
    const resMeValid = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${initialAccessToken}` },
    });
    const dataMeValid = await resMeValid.json();
    assert(resMeValid.status === 200 && dataMeValid.data.email === 'testuser@example.com', 'GET /me returns user profile with valid token');

    // 12. GET /me with Missing Token
    const resMeMissing = await fetch(`${baseUrl}/api/v1/auth/me`);
    const dataMeMissing = await resMeMissing.json();
    assert(resMeMissing.status === 401 && dataMeMissing.code === 'UNAUTHORIZED', 'GET /me returns 401 for missing Authorization header');

    // 13. GET /me with Invalid Token
    const resMeInvalid = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Authorization: 'Bearer invalid.jwt.token' },
    });
    const dataMeInvalid = await resMeInvalid.json();
    assert(resMeInvalid.status === 401 && dataMeInvalid.code === 'INVALID_TOKEN', 'GET /me returns 401 for malformed token');

    // 14. Refresh Token Rotation
    const resRefresh = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: currentRefreshToken }),
    });
    const dataRefresh = await resRefresh.json();
    assert(resRefresh.status === 200 && dataRefresh.success === true, 'POST /refresh rotates tokens');
    assert(Boolean(dataRefresh.data.access_token && dataRefresh.data.refresh_token), 'New tokens received');

    const rotatedRefreshToken = currentRefreshToken;
    currentRefreshToken = dataRefresh.data.refresh_token;

    // 15. Refresh Token Reuse Detection
    const resReuse = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: rotatedRefreshToken }),
    });
    const dataReuse = await resReuse.json();
    assert(resReuse.status === 401 && dataReuse.code === 'TOKEN_REUSE_DETECTED', 'Reusing old rotated refresh token triggers reuse detection');

    // 16. Logout & Session Revocation
    // Let's do fresh login to get active refresh token
    const resLoginFresh = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'testuser@example.com', password: 'Password@123' }),
    });
    const dataLoginFresh = await resLoginFresh.json();
    const logoutRefreshToken = dataLoginFresh.data.tokens.refresh_token;

    const resLogout = await fetch(`${baseUrl}/api/v1/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: logoutRefreshToken }),
    });
    const dataLogout = await resLogout.json();
    assert(resLogout.status === 200 && dataLogout.success === true, 'POST /logout revokes token session');

    const resRefreshRevoked = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: logoutRefreshToken }),
    });
    const dataRefreshRevoked = await resRefreshRevoked.json();
    assert(resRefreshRevoked.status === 401, 'Using revoked token after logout is rejected with 401');

    // 17. Forgot Password (Generic response prevents enumeration)
    const resForgot = await fetch(`${baseUrl}/api/v1/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'testuser@example.com' }),
    });
    const dataForgot = await resForgot.json();
    assert(resForgot.status === 200 && dataForgot.success === true, 'POST /forgot-password returns success');
    const resetToken = dataForgot.data?.reset_token;
    assert(Boolean(resetToken), 'Debug reset token returned in dev mode for testing');

    // Forgot password with non-existing email returns same message
    const resForgotNonExist = await fetch(`${baseUrl}/api/v1/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nobody@example.com' }),
    });
    const dataForgotNonExist = await resForgotNonExist.json();
    assert(dataForgotNonExist.message === dataForgot.message, 'Forgot-password returns identical generic message for unknown email');

    // 18. Reset Password with Valid Token
    const resReset = await fetch(`${baseUrl}/api/v1/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: resetToken,
        new_password: 'NewPassword@2026',
      }),
    });
    const dataReset = await resReset.json();
    assert(resReset.status === 200 && dataReset.success === true, 'POST /reset-password successfully resets password');

    // 19. Verify Login with New Password
    const resLoginNewPass = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'testuser@example.com',
        password: 'NewPassword@2026',
      }),
    });
    const dataLoginNewPass = await resLoginNewPass.json();
    assert(resLoginNewPass.status === 200 && dataLoginNewPass.success === true, 'Login succeeds with new password');

    // 20. Token Single-Use Rejection (Cannot reuse same reset token)
    const resReuseReset = await fetch(`${baseUrl}/api/v1/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: resetToken,
        new_password: 'AnotherPassword@123',
      }),
    });
    const dataReuseReset = await resReuseReset.json();
    assert(resReuseReset.status === 400 && dataReuseReset.code === 'INVALID_RESET_TOKEN', 'Reset token cannot be used more than once (single-use enforced)');

    // 21. Expired Reset Token Rejection
    const expiredTokenRaw = 'expiredtoken1234567890123456789012';
    const { hashToken } = require('../src/utils/token.util');
    const userForExpired = await User.findOne({ where: { email: 'testuser@example.com' } });
    await PasswordResetToken.create({
      user_id: userForExpired.id,
      token_hash: hashToken(expiredTokenRaw),
      expires_at: new Date(Date.now() - 10000), // in the past
      is_used: false,
    });
    const resExpiredReset = await fetch(`${baseUrl}/api/v1/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: expiredTokenRaw,
        new_password: 'AnotherPassword@123',
      }),
    });
    const dataExpiredReset = await resExpiredReset.json();
    assert(resExpiredReset.status === 400 && dataExpiredReset.code === 'EXPIRED_RESET_TOKEN', 'Expired reset token is rejected with 400 EXPIRED_RESET_TOKEN');

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    server.close();
    console.log(`\n========================================`);
    console.log(`Tests Passed: ${passed}`);
    console.log(`Tests Failed: ${failed}`);
    console.log(`========================================\n`);
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTestSuite();
