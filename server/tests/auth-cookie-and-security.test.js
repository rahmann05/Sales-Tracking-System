import assert from 'node:assert/strict';
import test from 'node:test';
import bcrypt from 'bcryptjs';
import { parseClientOrigin } from '../src/config/index.js';
import { prisma } from '../src/config/prisma.js';
import { invalidateConfigCache } from '../src/modules/config/services/dynamic-config.service.js';
import { login, logout, readCookie, refresh } from '../src/modules/auth/auth.controller.js';
import { measuredVisitMinutes } from '../../shared/report-semantics.mjs';
import { resolveNotificationTab } from '../../client/src/utils/notificationTab.js';

const createMockRes = () => {
  const cookiesSet = [];
  const cookiesCleared = [];
  const response = {
    statusCode: 200,
    body: null,
    cookiesSet,
    cookiesCleared,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    cookie(name, value, options) {
      cookiesSet.push({ name, value, options });
      return this;
    },
    clearCookie(name, options) {
      cookiesCleared.push({ name, options });
      return this;
    },
  };
  return response;
};

test('parseClientOrigin enforces strict production CORS origin whitelist', () => {
  assert.equal(parseClientOrigin('development', ''), true);
  assert.equal(parseClientOrigin('development', '*'), true);
  assert.equal(parseClientOrigin('production', ''), false);
  assert.equal(parseClientOrigin('production', '*'), false);
  assert.deepEqual(
    parseClientOrigin('production', 'https://app.example.com, https://admin.example.com'),
    ['https://app.example.com', 'https://admin.example.com']
  );
  assert.equal(
    parseClientOrigin('production', ' https://app.example.com '),
    'https://app.example.com'
  );
});

test('readCookie and auth controller set, read, and clear HttpOnly refreshToken cookie', async (t) => {
  assert.equal(readCookie('foo=1; refreshToken=tok%20en; bar=2', 'refreshToken'), 'tok en');
  assert.equal(readCookie('', 'refreshToken'), '');

  const origFindFirst = prisma.user.findFirst;
  const origFindUnique = prisma.user.findUnique;
  const origUpdateMany = prisma.user.updateMany;
  const origSysFindMany = prisma.systemConfig.findMany;
  const origSysFindUnique = prisma.systemConfig.findUnique;

  const passwordHash = bcrypt.hashSync('SecretPass123!', 4);
  const stubUser = {
    id: 'user-auth-1',
    name: 'Tester Admin',
    email: 'tester@example.com',
    password: passwordHash,
    role: 'ADMIN',
    roleCode: null,
    clusterId: null,
    permissions: {},
    tokenVersion: 3,
    deletedAt: null,
  };

  prisma.user.findFirst = async () => stubUser;
  prisma.user.findUnique = async () => stubUser;
  prisma.user.updateMany = async () => ({ count: 1 });
  prisma.systemConfig.findMany = async () => [];
  prisma.systemConfig.findUnique = async () => null;
  invalidateConfigCache();

  t.after(() => {
    prisma.user.findFirst = origFindFirst;
    prisma.user.findUnique = origFindUnique;
    prisma.user.updateMany = origUpdateMany;
    prisma.systemConfig.findMany = origSysFindMany;
    prisma.systemConfig.findUnique = origSysFindUnique;
    invalidateConfigCache();
  });

  const loginRes = createMockRes();
  await login(
    { body: { email: 'tester@example.com', password: 'SecretPass123!' } },
    loginRes,
    (err) => {
      throw err;
    }
  );
  assert.equal(loginRes.statusCode, 200);
  assert.equal(loginRes.cookiesSet.length, 1);
  assert.equal(loginRes.cookiesSet[0].name, 'refreshToken');
  assert.equal(loginRes.cookiesSet[0].options.httpOnly, true);
  assert.equal(loginRes.cookiesSet[0].options.sameSite, 'lax');
  assert.equal(loginRes.cookiesSet[0].options.path, '/api/v1/auth');

  const issuedRefresh = loginRes.cookiesSet[0].value;
  const refreshRes = createMockRes();
  await refresh(
    { body: {}, headers: { cookie: `refreshToken=${encodeURIComponent(issuedRefresh)}` } },
    refreshRes,
    (err) => {
      throw err;
    }
  );
  assert.equal(refreshRes.statusCode, 200);
  assert.ok(refreshRes.body.data.accessToken);

  const logoutRes = createMockRes();
  await logout(
    { user: { id: stubUser.id, tokenVersion: stubUser.tokenVersion } },
    logoutRes,
    (err) => {
      throw err;
    }
  );
  assert.equal(logoutRes.statusCode, 200);
  assert.equal(logoutRes.cookiesCleared.length, 1);
  assert.equal(logoutRes.cookiesCleared[0].name, 'refreshToken');
});

test('measuredVisitMinutes validates ordered IN/OUT pairs and synthetic durations', () => {
  assert.equal(
    measuredVisitMinutes({
      attendances: [
        { type: 'IN', timestamp: '2026-10-08T01:00:00Z' },
        { type: 'OUT', timestamp: '2026-10-08T01:12:30Z' },
      ],
    }),
    12.5
  );
  assert.equal(
    measuredVisitMinutes({
      attendances: [{ type: 'IN' }, { type: 'OUT', durationMinutes: 9 }],
    }),
    9
  );
  assert.equal(
    measuredVisitMinutes({
      attendances: [
        { type: 'IN', timestamp: '2026-10-08T02:00:00Z' },
        { type: 'OUT', timestamp: '2026-10-08T01:00:00Z' },
      ],
    }),
    null
  );
  assert.equal(measuredVisitMinutes({ attendances: [{ type: 'IN' }] }), null);
});

test('resolveNotificationTab maps notification types to role-specific tabs', () => {
  assert.equal(resolveNotificationTab({ type: 'NOO_NEW' }, 'SALES'), 'outlet-registration');
  assert.equal(resolveNotificationTab({ type: 'NOO_NEW' }, 'ADMIN'), 'outlet-approval');
  assert.equal(
    resolveNotificationTab({ type: 'PACKING_READY' }, 'KEPALA_GUDANG'),
    'delivery-packing-list'
  );
  assert.equal(resolveNotificationTab({ title: 'Trip Pengiriman' }, 'SUPIR'), 'driver-trips');
  assert.equal(resolveNotificationTab({ title: 'Trip Pengiriman' }, 'ADMIN'), 'delivery-monitor');
  assert.equal(resolveNotificationTab({ type: 'ORDER_PENDING' }, 'SALES'), 'sales-orders');
  assert.equal(resolveNotificationTab({ type: 'ORDER_PENDING' }, 'SUPERVISOR'), 'spv-approval');
  assert.equal(resolveNotificationTab({ type: 'ORDER_PENDING' }, 'ADMIN'), 'admin-approval');
  assert.equal(resolveNotificationTab({ type: 'UNLOCK_APPROVED' }, 'SALES'), 'sales-visits');
  assert.equal(resolveNotificationTab({ type: 'REROUTE_REQ' }, 'ADMIN'), 'admin-approval');
});
