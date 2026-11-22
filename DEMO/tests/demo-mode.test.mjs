import assert from 'node:assert/strict';
import test from 'node:test';
import { CONFIG_DEFAULTS } from '../../shared/config.mjs';
import {
  DEMO_BACKUP_CONFIG_KEY,
  DEMO_INVARIANT_GUARDRAILS,
  DEMO_RELAX_GROUPS,
  allDemoRelaxKeys,
} from '../shared/demo-guardrails.mjs';
import { DEMO_SCENARIOS } from '../shared/demo-scenarios.mjs';
import { assertDemoEnvironment } from '../server/config/demo-env.guard.js';
import { issueDemoSwitchSession } from '../server/services/demo-accounts.service.js';
import {
  applyDemoPolicyGroups,
  restoreDemoPolicyBaseline,
} from '../server/services/demo-policy.service.js';
import { syncDemoTodayPjp } from '../server/services/demo-flow-helpers.service.js';

const LOCAL_URL = 'postgresql://postgres:postgres@localhost:5432/sales_tracking_system';
const REMOTE_URL = 'postgresql://neondb_owner:secret@ep-steep-river.aws.neon.tech:5432/neondb';

function createMemoryConfigDb(initialEntries = {}) {
  const store = new Map(Object.entries(initialEntries));
  return {
    store,
    systemConfig: {
      async findMany({ where }) {
        const keys = where?.key?.in || [...store.keys()];
        return keys.filter((k) => store.has(k)).map((k) => ({ key: k, value: store.get(k) }));
      },
      async findUnique({ where }) {
        return store.has(where.key) ? { key: where.key, value: store.get(where.key) } : null;
      },
      async upsert({ where, update, create }) {
        const val = store.has(where.key) ? update.value : create.value;
        store.set(where.key, val);
        return { key: where.key, value: val };
      },
      async deleteMany({ where }) {
        const existed = store.delete(where.key);
        return { count: existed ? 1 : 0 };
      },
    },
  };
}

test('assertDemoEnvironment blocks production and remote databases while allowing local Postgres', () => {
  assert.throws(
    () => assertDemoEnvironment({ env: { NODE_ENV: 'production' }, databaseUrl: LOCAL_URL }),
    /NODE_ENV=production/
  );
  assert.throws(
    () => assertDemoEnvironment({ env: { NODE_ENV: 'development' }, databaseUrl: REMOTE_URL }),
    /PostgreSQL lokal/
  );
  const ok = assertDemoEnvironment({ env: { NODE_ENV: 'development' }, databaseUrl: LOCAL_URL });
  assert.equal(ok.safe, true);
  assert.equal(ok.target, 'localhost:5432/sales_tracking_system');
});

test('all demo constraint keys and scenarios align with shared CONFIG_DEFAULTS', () => {
  const keys = allDemoRelaxKeys();
  assert.ok(keys.length >= 40);
  for (const key of keys) {
    assert.equal(
      Object.hasOwn(CONFIG_DEFAULTS, key),
      true,
      `Unknown demo policy key not present in CONFIG_DEFAULTS: ${key}`
    );
  }
  assert.equal(Object.keys(DEMO_RELAX_GROUPS).length, 4);
  assert.equal(DEMO_INVARIANT_GUARDRAILS.length, 5);
  assert.ok(DEMO_SCENARIOS.length >= 4);
});

test('applyDemoPolicyGroups snapshots existing SystemConfig and restoreDemoPolicyBaseline restores it', async () => {
  const db = createMemoryConfigDb({
    ATTENDANCE_ENFORCE_GEOFENCE: true,
    MINIMUM_VISIT_DURATION_MINUTES: 10,
  });

  let invalidations = 0;
  const status = await applyDemoPolicyGroups(['geofence', 'schedule'], {
    db,
    onInvalidate: () => {
      invalidations += 1;
    },
  });

  assert.equal(invalidations, 1);
  assert.equal(status.hasBackup, true);
  assert.equal(status.activeGroups.geofence, true);
  assert.equal(status.activeGroups.schedule, true);
  assert.equal(status.activeGroups.evidence, false);
  assert.equal(db.store.get('ATTENDANCE_ENFORCE_GEOFENCE'), false);
  assert.equal(db.store.get('MINIMUM_VISIT_DURATION_MINUTES'), 0);
  assert.equal(db.store.has('ATTENDANCE_REQUIRE_PHOTO'), false);

  const backup = db.store.get(DEMO_BACKUP_CONFIG_KEY);
  assert.equal(backup.values.ATTENDANCE_ENFORCE_GEOFENCE, true);
  assert.equal(backup.values.MINIMUM_VISIT_DURATION_MINUTES, 10);

  const restored = await restoreDemoPolicyBaseline({
    db,
    onInvalidate: () => {
      invalidations += 1;
    },
  });
  assert.equal(restored.restored, true);
  assert.equal(invalidations, 2);
  assert.equal(db.store.get('ATTENDANCE_ENFORCE_GEOFENCE'), true);
  assert.equal(db.store.get('MINIMUM_VISIT_DURATION_MINUTES'), 10);
  assert.equal(db.store.has('PJP_WORKING_DAYS'), false);
  assert.equal(db.store.has(DEMO_BACKUP_CONFIG_KEY), false);
});

test('issueDemoSwitchSession enforces active user guardrail and preserves exact role permissions', async () => {
  await assert.rejects(
    () =>
      issueDemoSwitchSession('missing-id', {
        db: { user: { findFirst: async () => null } },
      }),
    (err) => err.statusCode === 404
  );

  const session = await issueDemoSwitchSession('sales-1', {
    db: {
      user: {
        findFirst: async () => ({
          id: 'sales-1',
          name: 'Budi Sales',
          email: 'budi@example.local',
          role: 'SALES',
          roleCode: 'SALES',
          clusterId: 'cluster-1',
          permissions: { can_submit_order: true },
          tokenVersion: 2,
        }),
      },
    },
    resolveUser: async (u) => ({
      role: u.role,
      roleCode: u.roleCode,
      roleLabel: 'Sales',
      permissions: { can_submit_order: true, can_approve_order: false },
    }),
    readConfig: async (_k, fallback) => fallback,
  });

  assert.equal(session.user.role, 'SALES');
  assert.equal(session.user.permissions.can_approve_order, false);
  assert.equal(typeof session.accessToken, 'string');
  assert.equal(typeof session.refreshToken, 'string');
});

test('syncDemoTodayPjp protects PJPs with active attendance/orders while allowing clean rebuilds', async () => {
  const baseSales = {
    id: 'sales-1',
    name: 'Rizky Sales',
    role: 'SALES',
    supervisorId: 'spv-1',
    clusterId: 'cl-1',
  };

  await assert.rejects(
    () =>
      syncDemoTodayPjp(
        { salesId: 'sales-1', rebuild: true },
        {
          db: {
            user: { findFirst: async () => baseSales },
            pjp: {
              findFirst: async () => ({
                id: 'pjp-busy',
                stops: [
                  { id: 'stop-1', status: 'VISITED', attendances: [{ id: 'a1' }], orders: [] },
                ],
              }),
            },
          },
          policyFor: async () => ({ values: {} }),
        }
      ),
    (err) => err.statusCode === 409
  );

  let deletedStops = 0;
  let deletedPjps = 0;
  const cleanResult = await syncDemoTodayPjp(
    { salesId: 'sales-1', rebuild: true },
    {
      db: {
        user: { findFirst: async () => baseSales },
        pjp: {
          findFirst: async () => ({
            id: 'pjp-clean',
            stops: [{ id: 'stop-1', status: 'PENDING', attendances: [], orders: [] }],
          }),
          async delete() {
            deletedPjps += 1;
          },
        },
        pjpStop: {
          async deleteMany() {
            deletedStops += 1;
          },
        },
      },
      policyFor: async () => ({ values: {} }),
      ensureSales: async () => ({ id: 'pjp-new', stops: [{ id: 's1' }, { id: 's2' }] }),
    }
  );

  assert.equal(deletedStops, 1);
  assert.equal(deletedPjps, 1);
  assert.equal(cleanResult.synced, true);
  assert.equal(cleanResult.stopCount, 2);
});
