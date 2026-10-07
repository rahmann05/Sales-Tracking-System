import { test } from 'node:test';
import assert from 'node:assert/strict';
import { visitState, summarizeVisits, visitSalesResult, wibDayRange, wibDateKey } from '../../shared/visit-metrics.mjs';
import { CONFIG_DEFAULTS } from '../../shared/config.mjs';
import { validateConfigMap, validateConfigRelations } from '../src/modules/config/services/validate-config.service.js';
import { checkOutSchema } from '../src/modules/absensi/absensi.schema.js';
import { prisma } from '../src/config/prisma.js';
import { invalidateConfigCache } from '../src/modules/config/services/dynamic-config.service.js';
import { resolveSalesResult } from '../src/modules/absensi/services/resolve-sales-result.service.js';
import { getWeeklyReport } from '../src/modules/reports/services/get-weekly-report.service.js';
import { getMtdReport } from '../src/modules/reports/services/get-mtd-report.service.js';
import { getDailyCallReport } from '../src/modules/daily-calls/services/get-daily-call-report.service.js';

function mockMethod(t, model, method, implementation) {
  const original = model[method];
  model[method] = implementation;
  t.after(() => { model[method] = original; invalidateConfigCache(); });
}

test('PJP counts distinguish checkout, open order, closed shop, and pending visit', () => {
  const stops = [{ status: 'VISITED' }, { status: 'ORDERED' }, { status: 'PENDING' }, { status: 'CLOSED_REPORTED' }, { status: 'SKIPPED', attendances: [{ type: 'IN' }] }];
  assert.deepEqual(summarizeVisits(stops), { total: 5, completed: 1, inProgress: 1, pending: 1, exceptions: 2, remaining: 2, resolved: 3, notCheckedIn: 2 });
  assert.equal(visitState({ status: 'PENDING', attendances: [{ type: 'OUT' }] }), 'COMPLETED');
});

test('order lines override manual totals without double counting SKU, only APPROVED counts', () => {
  const result = visitSalesResult({ attendances: [{ type: 'IN' }, { type: 'OUT', orderAmount: 999, skuSold: 9 }], orders: [
    { totalValue: 100, status: 'APPROVED', items: [{ productId: 'a' }, { productId: 'b' }] },
    { totalValue: 200, status: 'PENDING_APPROVAL', items: [{ productId: 'a' }] },
    { totalValue: 500, status: 'REJECTED', items: [{ productId: 'c' }] },
  ] });
  assert.equal(result.orderAmount, 100);
  assert.equal(result.skuSold, 2);
  assert.equal(result.effective, true);
});

test('rejected order cannot revive manual revenue or effective call', () => {
  const result = visitSalesResult({ attendances: [{ type: 'OUT', orderAmount: 200, skuSold: 2, isEffectiveCall: true }], orders: [{ status: 'REJECTED', totalValue: 200 }] });
  assert.equal(result.orderAmount, 0);
  assert.equal(result.skuSold, 0);
  assert.equal(result.effective, false);
});

test('WIB midnight does not depend on server timezone', () => {
  assert.equal(wibDateKey('2026-10-05T17:00:00Z'), '2026-10-06');
  const range = wibDayRange('2026-10-06');
  assert.equal(range.gte.toISOString(), '2026-10-05T17:00:00.000Z');
  assert.equal(range.lte.toISOString(), '2026-10-06T16:59:59.999Z');
});

test('admin values preserve zero and false, reject invalid bounds and relationships', () => {
  assert.deepEqual(validateConfigMap({ TAX_RATE_PERCENT: 0, SALES_ALLOW_PRODUCT_CREATE: false }), { TAX_RATE_PERCENT: 0, SALES_ALLOW_PRODUCT_CREATE: false });
  assert.throws(() => validateConfigMap({ MINIMUM_VISIT_DURATION_MINUTES: -1 }));
  assert.throws(() => validateConfigMap({ SALES_ALLOW_PRODUCT_CREATE: 'yes' }));
  assert.throws(() => validateConfigRelations({ ...CONFIG_DEFAULTS, VALIDATION_DISTANCE_WARNING: 700, VALIDATION_DISTANCE_SUSPECT: 500 }));
});

test('checkout sales fields are optional and reject negative/invalid values', () => {
  const input = { params: { pjpStopId: '123e4567-e89b-42d3-a456-426614174000' }, body: { latitude: -6, longitude: 107 } };
  assert.equal(checkOutSchema.safeParse(input).success, true);
  assert.equal(checkOutSchema.safeParse({ ...input, body: { ...input.body, orderAmount: -1 } }).success, false);
  assert.equal(checkOutSchema.safeParse({ ...input, body: { ...input.body, skuSold: 1.5 } }).success, false);
});

test('manual-sales policy is enforced in service and product IDs are deduplicated', async t => {
  mockMethod(t, prisma.systemConfig, 'findMany', async () => [{ key: 'ATTENDANCE_ALLOW_MANUAL_SALES', value: false }]);
  invalidateConfigCache();
  await assert.rejects(resolveSalesResult({ orderAmount: 1 }), { statusCode: 403 });
  assert.equal((await resolveSalesResult({})).skuSold, 0);
  mockMethod(t, prisma.systemConfig, 'findMany', async () => []);
  mockMethod(t, prisma.product, 'findMany', async () => [{ id: 'a', sku: 'A', name: 'Produk A' }]);
  invalidateConfigCache();
  const result = await resolveSalesResult({ productIds: ['a', 'a'] });
  assert.equal(result.skuSold, 1);
  assert.equal(result.salesProducts[0].sku, 'A');
  await assert.rejects(resolveSalesResult({ productIds: ['a', 'missing'] }));
});

test('daily, weekly, and MTD agree on attendance and approved off-PJP sales', async t => {
  const sales = { id: 'sales', name: 'Sales Test', cluster: { name: 'Cluster' } };
  const stop = { id: 'stop', sequence: 1, status: 'VISITED', outlet: { name: 'Outlet', latitude: -6, longitude: 107, type: 'RETAIL' }, attendances: [
    { type: 'IN', timestamp: new Date('2026-10-06T02:00:00Z'), latitude: -6, longitude: 107 },
    { type: 'OUT', timestamp: new Date('2026-10-06T02:10:00Z'), orderAmount: 120, skuSold: 2, durationMinutes: 10 },
  ], orders: [{ status: 'APPROVED', totalValue: 120, items: [{ productId: 'p1' }, { productId: 'p2' }] }] };
  const pjp = { id: 'pjp', user: sales, date: new Date('2026-10-05T17:00:00Z'), stops: [stop] };
  const off = { id: 'off', user: sales, status: 'APPROVED', createdAt: new Date('2026-10-06T03:00:00Z'), outletName: 'Extra', orderAmount: 30, skuSold: 1, manualSalesMode: 'REQUIRE_APPROVAL', isManualSalesApproved: true };
  const inRange = (date, range) => date >= range.gte && date <= range.lte;
  mockMethod(t, prisma.systemConfig, 'findMany', async () => []);
  invalidateConfigCache();
  mockMethod(t, prisma.user, 'findMany', async () => [sales]);
  mockMethod(t, prisma.pjp, 'findMany', async args => inRange(pjp.date, args.where.date) ? [pjp] : []);
  mockMethod(t, prisma.offPjpAttendance, 'findMany', async args => inRange(off.createdAt, args.where.createdAt) ? [off] : []);
  const daily = await getDailyCallReport({ date: '2026-10-06' });
  const weekly = await getWeeklyReport({ startDate: '2026-10-05' });
  const mtd = await getMtdReport({ month: '10', year: '2026' });
  assert.equal(daily.summary.totalOrderAmount, 150);
  assert.equal(weekly.summary.totalOrderAmount, 150);
  assert.equal(mtd.summary.mtdActualAmount, 150);
  assert.equal(daily.summary.totalSkuSold, 3);
  assert.equal(weekly.summary.totalSkuSold, 3);
  assert.equal(mtd.summary.totalMtdSkuSold, 3);
  assert.equal(weekly.period.startDate, '2026-10-05');
  assert.equal(daily.summary.callComplianceRate, '100%');
  assert.equal(weekly.summary.callComplianceRate, '100%');
  assert.equal(mtd.summary.mtdCallComplianceRate, '100%');
  assert.equal(mtd.channelBreakdown.reduce((sum, channel) => sum + channel.mtdOmzet, 0), 150);
});
