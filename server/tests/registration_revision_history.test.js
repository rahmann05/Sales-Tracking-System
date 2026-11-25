import assert from 'node:assert/strict';
import test from 'node:test';
import { prisma } from '../src/config/prisma.js';
import { normalizeRevisionHistory } from '../src/modules/customer-registrations/services/customer-registrations.helpers.js';
import { getRegistrationById } from '../src/modules/customer-registrations/services/get-registration-by-id.service.js';

test('normalizeRevisionHistory normalizes legacy seeded SUBMITTED entry into canonical shape', () => {
  const input = [
    {
      action: 'SUBMITTED',
      actorId: 'sales-1',
      actorName: 'Cahya Pratama',
      at: '2026-11-22T07:00:00.000Z',
      note: 'Pengajuan pelanggan baru Belfoods Bandung Raya.',
    },
  ];

  const normalized = normalizeRevisionHistory(input);
  assert.equal(normalized.length, 1);
  assert.deepEqual(normalized[0].actor, {
    id: 'sales-1',
    name: 'Cahya Pratama',
    role: null,
  });
  assert.equal(normalized[0].reason, 'Pengajuan pelanggan baru Belfoods Bandung Raya.');
  assert.equal(normalized[0].rejectionNote, null);
  assert.deepEqual(normalized[0].before, {});
  assert.deepEqual(normalized[0].after, {});
});

test('normalizeRevisionHistory preserves canonical revision entry fields', () => {
  const canonical = {
    requestId: 'req-rev-1',
    actor: { id: 'sales-2', name: 'Dadan Ramdani', role: 'SALES' },
    at: '2026-11-24T09:15:00.000Z',
    reason: 'Perbaikan alamat dan NIK',
    rejectionNote: 'Alamat belum mencantumkan RT/RW',
    before: { address: 'Jl. Kopo 10' },
    after: { address: 'Jl. Kopo 10 RT 02 RW 04' },
  };

  const normalized = normalizeRevisionHistory([canonical]);
  assert.equal(normalized.length, 1);
  assert.deepEqual(normalized[0], canonical);
});

test('normalizeRevisionHistory handles non-array, null, and malformed entries without throwing', () => {
  assert.deepEqual(normalizeRevisionHistory(null), []);
  assert.deepEqual(normalizeRevisionHistory(undefined), []);
  assert.deepEqual(normalizeRevisionHistory('invalid'), []);

  const normalized = normalizeRevisionHistory([null, 'bad', {}]);
  assert.equal(normalized.length, 1);
  assert.deepEqual(normalized[0].actor, {
    id: null,
    name: 'Pengguna tidak diketahui',
    role: null,
  });
  assert.equal(normalized[0].reason, 'Revisi pengajuan');
  assert.equal(normalized[0].rejectionNote, null);
  assert.deepEqual(normalized[0].before, {});
  assert.deepEqual(normalized[0].after, {});
});

test('getRegistrationById normalizes legacy revisionHistory entries from database rows', async (t) => {
  const origFindUnique = prisma.customerRegistration.findUnique;
  prisma.customerRegistration.findUnique = async () => ({
    id: 'reg-legacy-1',
    salesmanId: 'sales-1',
    name: 'Toko Contoh',
    revisionHistory: [
      {
        action: 'SUBMITTED',
        actorId: 'sales-1',
        actorName: 'Cahya Pratama',
        at: '2026-11-22T07:00:00.000Z',
        note: 'Pengajuan awal',
      },
    ],
  });
  t.after(() => {
    prisma.customerRegistration.findUnique = origFindUnique;
  });

  const result = await getRegistrationById('reg-legacy-1', { id: 'admin-1', role: 'ADMIN' });
  assert.equal(result.revisionHistory.length, 1);
  assert.equal(result.revisionHistory[0].actor.name, 'Cahya Pratama');
  assert.equal(result.revisionHistory[0].reason, 'Pengajuan awal');
  assert.deepEqual(result.revisionHistory[0].before, {});
  assert.deepEqual(result.revisionHistory[0].after, {});
});
