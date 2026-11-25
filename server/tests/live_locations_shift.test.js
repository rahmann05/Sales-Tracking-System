import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/config/prisma.js';
import { invalidateConfigCache } from '../src/modules/config/services/dynamic-config.service.js';
import { getLiveSalesLocations } from '../src/modules/users/services/get-live-sales-locations.service.js';
import { shiftDateKey } from '../../shared/shift-policy.mjs';

const sales = (id) => ({
  id,
  name: `Sales ${id}`,
  email: `${id}@x.test`,
  role: 'SALES',
  supervisorId: 'spv',
  clusterId: null,
  cluster: null,
  salesLivePosition: null,
  pjps: [],
  attendances: [],
});

function mock(t, model, method, fn) {
  const original = model[method];
  model[method] = fn;
  t.after(() => {
    model[method] = original;
    invalidateConfigCache();
  });
}

test('Posisi terkini lists only sales with an unfinished shift today', async (t) => {
  invalidateConfigCache();
  mock(t, prisma.systemConfig, 'findMany', async () => []);
  mock(t, prisma.user, 'findMany', async () => [sales('a'), sales('b'), sales('c')]);
  const today = shiftDateKey(Date.now());
  mock(t, prisma.staffActivity, 'findMany', async (query) => {
    assert.equal(query.where.kind, 'SHIFT');
    assert.equal(query.where.dateKey, today);
    return [
      { userId: 'a', checklist: { startKind: 'CHECK_IN' } },
      { userId: 'b', checklist: { state: 'FINISHED' } },
    ];
  });
  mock(t, prisma.staffActivity, 'findFirst', async () => null);
  const rows = await getLiveSalesLocations({ id: 'spv', role: 'SUPERVISOR' });
  assert.deepEqual(
    rows.map((row) => row.salesId),
    ['a']
  );
});
