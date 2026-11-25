import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/config/prisma.js';
import { invalidateConfigCache } from '../src/modules/config/services/dynamic-config.service.js';
import { getDailyCallReport } from '../src/modules/daily-calls/services/get-daily-call-report.service.js';

function mockMethod(t, model, method, implementation) {
  const original = model[method];
  model[method] = implementation;
  t.after(() => {
    model[method] = original;
    invalidateConfigCache();
  });
}

test('getDailyCallReport suppresses positive attendance reason on EC visits and keeps Non-EC reasons', async (t) => {
  const sales = { id: 's-ec', name: 'Dadan Ramdani', cluster: { name: 'GT Bandung Selatan & Kopo' } };
  const inTime = new Date('2026-10-06T01:15:00Z');
  const outTime = new Date('2026-10-06T01:33:00Z');
  const pjp = {
    id: 'pjp-ec',
    user: sales,
    date: new Date('2026-10-05T17:00:00Z'),
    stops: [
      {
        id: 'stop-ec',
        sequence: 1,
        status: 'VISITED',
        outlet: { id: 'o-1', name: 'Toko Apep', outletCode: 'BFI2306662', latitude: -6.9, longitude: 107.6, type: 'GENERAL_TRADE' },
        attendances: [
          { type: 'IN', timestamp: inTime, latitude: -6.9, longitude: 107 },
          {
            type: 'OUT',
            timestamp: outTime,
            reason: 'Order diterima pelanggan',
            durationMinutes: 18,
            orderAmount: 318000,
            skuSold: 2,
          },
        ],
        orders: [{ id: 'ord-1', status: 'APPROVED', totalValue: 318000, items: [{ productId: 'p1' }, { productId: 'p2' }] }],
      },
      {
        id: 'stop-nonec',
        sequence: 2,
        status: 'VISITED',
        outlet: { id: 'o-2', name: 'Toko Budi', outletCode: 'BFI2306663', latitude: -6.91, longitude: 107.61, type: 'GENERAL_TRADE' },
        attendances: [
          { type: 'IN', timestamp: outTime, latitude: -6.91, longitude: 107.61 },
          {
            type: 'OUT',
            timestamp: new Date('2026-10-06T01:51:00Z'),
            reason: 'Tindak lanjut stok toko',
            durationMinutes: 18,
            orderAmount: 0,
            skuSold: 0,
          },
        ],
        orders: [],
      },
    ],
  };

  mockMethod(t, prisma.systemConfig, 'findMany', async () => []);
  invalidateConfigCache();
  mockMethod(t, prisma.pjp, 'findMany', async () => [pjp]);
  mockMethod(t, prisma.offPjpAttendance, 'findMany', async () => []);

  const report = await getDailyCallReport({ date: '2026-10-06' });
  const ecRow = report.rows.find((r) => r.id === 'stop-ec');
  const nonEcRow = report.rows.find((r) => r.id === 'stop-nonec');

  assert.equal(ecRow.effectiveCall, 'Y');
  assert.equal(ecRow.reason, '');
  assert.equal(nonEcRow.effectiveCall, 'N');
  assert.equal(nonEcRow.reason, 'Tindak lanjut stok toko');
});
