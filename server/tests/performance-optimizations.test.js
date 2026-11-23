import assert from 'node:assert/strict';
import test from 'node:test';
import zlib from 'node:zlib';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/config/prisma.js';
import { cacheGetOrFetch, cacheInvalidate } from '../src/utils/cacheHelper.js';
import { compressionMiddleware } from '../src/middlewares/compression.middleware.js';
import {
  getRoleDefinitions,
  invalidateRoleDefinitionsCache,
  roleDefinition,
} from '../src/modules/roles/role-assignment.service.js';
import { invalidateConfigCache } from '../src/modules/config/services/dynamic-config.service.js';
import { invalidatePolicyCache } from '../src/modules/config/services/policy-resolver.service.js';
import { loginUser } from '../src/modules/auth/services/login-user.service.js';
import { outletDirectory } from '../src/modules/outlets/services/outlet-directory.service.js';
import { outletClusterScope } from '../src/utils/team-scope.js';
import { collectPages } from '../../client/src/services/api/collectPages.js';

test('cacheGetOrFetch deduplicates concurrent cold misses via single-flight', async () => {
  const key = `perf-single-flight-${Date.now()}`;
  let calls = 0;
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });

  const fetcher = async () => {
    calls += 1;
    await gate;
    return { ok: true, count: calls };
  };

  const p1 = cacheGetOrFetch(key, fetcher, 60);
  const p2 = cacheGetOrFetch(key, fetcher, 60);
  release();

  const [r1, r2] = await Promise.all([p1, p2]);
  assert.deepEqual(r1, { ok: true, count: 1 });
  assert.deepEqual(r2, { ok: true, count: 1 });
  assert.equal(calls, 1);

  const r3 = await cacheGetOrFetch(key, fetcher, 60);
  assert.equal(r3.count, 1);
  assert.equal(calls, 1);

  cacheInvalidate(key);
});

test('compressionMiddleware gzips large JSON responses and leaves small payloads untouched', async () => {
  const runMiddleware = (headers, body) =>
    new Promise((resolve) => {
      const responseHeaders = {};
      let sentJson = null;
      let endedBuffer = null;
      const res = {
        headersSent: false,
        setHeader(name, value) {
          responseHeaders[name.toLowerCase()] = value;
        },
        getHeader(name) {
          return responseHeaders[name.toLowerCase()];
        },
        json(payload) {
          sentJson = payload;
          resolve({ headers: responseHeaders, sentJson, endedBuffer });
          return res;
        },
        end(buf) {
          endedBuffer = buf;
          resolve({ headers: responseHeaders, sentJson, endedBuffer });
        },
      };
      const req = { method: 'GET', headers };
      compressionMiddleware(req, res, () => {
        res.json(body);
      });
    });

  const small = await runMiddleware({ 'accept-encoding': 'gzip' }, { ok: true });
  assert.equal(small.headers['content-encoding'], undefined);
  assert.deepEqual(small.sentJson, { ok: true });

  const largePayload = {
    rows: Array.from({ length: 40 }, (_, i) => ({
      id: `item-${i}`,
      name: `Outlet Performance Row ${i} Bandung`,
    })),
  };
  const large = await runMiddleware({ 'accept-encoding': 'gzip, deflate' }, largePayload);
  assert.equal(large.headers['content-encoding'], 'gzip');
  assert.ok(Buffer.isBuffer(large.endedBuffer));
  assert.deepEqual(JSON.parse(zlib.gunzipSync(large.endedBuffer).toString('utf8')), largePayload);
});

test('role definitions cache reuses fetched definitions and clears on config invalidation', async (t) => {
  const originalFindUnique = prisma.systemConfig.findUnique;
  let dbCalls = 0;
  let customLabel = 'Custom V1';

  t.after(() => {
    prisma.systemConfig.findUnique = originalFindUnique;
    invalidateRoleDefinitionsCache();
  });

  invalidateRoleDefinitionsCache();
  prisma.systemConfig.findUnique = async ({ where }) => {
    if (where?.key === 'ROLE_DEFINITIONS') {
      dbCalls += 1;
      return {
        value: [
          {
            code: 'PERF_TEST_ROLE',
            name: customLabel,
            baseRole: 'SALES',
            isSystem: false,
            defaultPermissions: {},
          },
        ],
      };
    }
    return null;
  };

  await getRoleDefinitions();
  const second = await roleDefinition('PERF_TEST_ROLE');
  assert.equal(second.name, 'Custom V1');
  assert.equal(dbCalls, 1);

  customLabel = 'Custom V2';
  invalidateConfigCache();
  const refreshed = await roleDefinition('PERF_TEST_ROLE');
  assert.equal(refreshed.name, 'Custom V2');
  assert.equal(dbCalls, 2);
});

test('collectPages fetches known multi-page sets in batches while preserving order and supporting sequential fallback', async () => {
  const requestedPages = [];
  const totalPagesResult = await collectPages(async ({ page }) => {
    requestedPages.push(page);
    return {
      data: [{ id: `row-${page}-a` }, { id: `row-${page}-b` }],
      pagination: { page, totalPages: 5, hasNextPage: page < 5 },
    };
  });

  assert.equal(totalPagesResult.data.length, 10);
  assert.equal(totalPagesResult.data[0].id, 'row-1-a');
  assert.equal(totalPagesResult.data[9].id, 'row-5-b');
  assert.deepEqual(requestedPages, [1, 2, 3, 4, 5]);

  const fallbackResult = await collectPages(async ({ page }) => ({
    data: [{ id: `seq-${page}` }],
    pagination: { page, hasNextPage: page < 3 },
  }));
  assert.deepEqual(
    fallbackResult.data.map((r) => r.id),
    ['seq-1', 'seq-2', 'seq-3']
  );
});

test('loginUser uses indexed findUnique on exact email and resolves policy once without findFirst fallback', async (t) => {
  const originalFindUnique = prisma.user.findUnique;
  const originalFindFirst = prisma.user.findFirst;
  const originalConfigFindUnique = prisma.systemConfig.findUnique;
  const originalConfigFindMany = prisma.systemConfig.findMany;

  let findUniqueCalls = 0;
  let findFirstCalls = 0;
  let configFindManyCalls = 0;

  t.after(() => {
    prisma.user.findUnique = originalFindUnique;
    prisma.user.findFirst = originalFindFirst;
    prisma.systemConfig.findUnique = originalConfigFindUnique;
    prisma.systemConfig.findMany = originalConfigFindMany;
    invalidateConfigCache();
    invalidatePolicyCache();
  });

  invalidateConfigCache();
  invalidatePolicyCache();
  const hashedPassword = bcrypt.hashSync('secret', 4);

  prisma.user.findUnique = async ({ where, select }) => {
    findUniqueCalls += 1;
    assert.equal(where.email, 'admin@sinar.test');
    assert.equal(select.password, true);
    return {
      id: 'user-1',
      name: 'Admin Test',
      email: 'admin@sinar.test',
      password: hashedPassword,
      role: 'ADMIN',
      roleCode: null,
      clusterId: null,
      supervisorId: null,
      permissions: {},
      deletedAt: null,
      tokenVersion: 1,
    };
  };
  prisma.user.findFirst = async () => {
    findFirstCalls += 1;
    throw new Error('findFirst fallback must not run when exact indexed email matches');
  };
  prisma.systemConfig.findUnique = async () => null;
  prisma.systemConfig.findMany = async () => {
    configFindManyCalls += 1;
    return [];
  };

  const result = await loginUser('  Admin@Sinar.Test ', 'secret');
  assert.equal(result.user.id, 'user-1');
  assert.ok(result.accessToken);
  assert.ok(result.refreshToken);
  assert.equal(findUniqueCalls, 1);
  assert.equal(findFirstCalls, 0);
  // 1 query for policyProfiles + 1 query for warmDynamicConfig
  assert.equal(configFindManyCalls, 2);
});

test('outletDirectory avoids read-only $transaction wrapper and outletClusterScope reuses sales supervisorId', async (t) => {
  const originalTransaction = prisma.$transaction;
  const originalFindMany = prisma.outlet.findMany;
  const originalCount = prisma.outlet.count;
  const originalUserFindFirst = prisma.user.findFirst;

  let findManyCalls = 0;
  let countCalls = 0;

  t.after(() => {
    prisma.$transaction = originalTransaction;
    prisma.outlet.findMany = originalFindMany;
    prisma.outlet.count = originalCount;
    prisma.user.findFirst = originalUserFindFirst;
  });

  prisma.$transaction = async () => {
    throw new Error('Read-only outletDirectory must not use prisma.$transaction');
  };
  prisma.user.findFirst = async () => {
    throw new Error('outletClusterScope must reuse existing sales supervisorId without DB query');
  };
  prisma.outlet.findMany = async () => {
    findManyCalls += 1;
    return [{ id: 'outlet-1', name: 'Toko Sinar' }];
  };
  prisma.outlet.count = async () => {
    countCalls += 1;
    return 1;
  };

  const scope = await outletClusterScope({
    id: 'sales-1',
    role: 'SALES',
    supervisorId: 'spv-1',
  });
  assert.deepEqual(scope, {
    deletedAt: null,
    supervisorId: 'spv-1',
    OR: [{ assignedSalesId: 'sales-1' }, { users: { some: { id: 'sales-1' } } }],
  });

  const directory = await outletDirectory(
    { page: 1, limit: 25, status: 'ACTIVE' },
    { id: 'sales-1', role: 'SALES', supervisorId: 'spv-1' }
  );
  assert.equal(directory.data.length, 1);
  assert.equal(directory.pagination.total, 1);
  assert.equal(findManyCalls, 1);
  assert.equal(countCalls, 1);
});
