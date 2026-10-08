import { test } from 'node:test';
import assert from 'node:assert/strict';
import { orderChannelAmounts, mtdCsv, reportBasis } from '../../shared/report-semantics.mjs';
import { visitSalesResult } from '../../shared/visit-metrics.mjs';
import { prisma } from '../src/config/prisma.js';
import { invalidateConfigCache } from '../src/modules/config/services/dynamic-config.service.js';
import { getMtdReport } from '../src/modules/reports/services/get-mtd-report.service.js';

test('order channel uses each historical snapshot even after customer classification changes', () => {
  const stop = { status: 'VISITED', outlet: { channel: 'MODERN_TRADE' }, orders: [
    { status: 'APPROVED', totalValue: 100, customerSnapshot: { subChannel: 'WARUNG' } },
    { status: 'APPROVED', totalValue: 200, customerSnapshot: { subChannel: 'GROSIR' } },
    { status: 'REJECTED', totalValue: 500, customerSnapshot: { channel: 'MODERN_TRADE' } },
    { status: 'APPROVED', deletedAt: new Date(), totalValue: 600 },
  ] };
  const contributions = orderChannelAmounts(stop, visitSalesResult(stop));
  assert.deepEqual(contributions, [
    { channelKey: 'RETAIL', amount: 100, historical: true },
    { channelKey: 'SEMI_WHOLESALE', amount: 200, historical: true },
  ]);
  stop.outlet.subChannel = 'GROSIR';
  stop.outlet.channel = 'GENERAL_TRADE';
  assert.deepEqual(orderChannelAmounts(stop, visitSalesResult(stop)), contributions);
});

test('legacy and approved manual revenue remain unclassified without historical evidence', () => {
  const stop = { status: 'VISITED', outlet: { channel: 'MODERN_TRADE' }, orders: [{ status: 'APPROVED', totalValue: 75 }] };
  assert.deepEqual(orderChannelAmounts(stop, visitSalesResult(stop)), [{ channelKey: 'UNCLASSIFIED', amount: 75, historical: false }]);
  const manual = { attendances: [{ type: 'OUT', orderAmount: 25, manualSalesMode: 'REQUIRE_APPROVAL', isManualSalesApproved: true }] };
  assert.deepEqual(orderChannelAmounts(manual, visitSalesResult(manual)), [{ channelKey: 'UNCLASSIFIED', amount: 25, historical: false }]);
  assert.deepEqual(orderChannelAmounts(stop, { effective: false }), []);
});

test('MTD channel totals reconcile, retain snapshot revenue and disclose current-master visit counts', async t => {
  const replace = (model, method, implementation) => {
    const original = model[method]; model[method] = implementation;
    t.after(() => { model[method] = original; invalidateConfigCache(); });
  };
  replace(prisma.systemConfig, 'findMany', async () => []); invalidateConfigCache();
  replace(prisma.user, 'findMany', async () => [{ id: 'sales', name: 'Sales', cluster: null }]);
  replace(prisma.offPjpAttendance, 'findMany', async () => []);
  const stop = { status: 'VISITED', outlet: { channel: 'MODERN_TRADE' }, orders: [
    { status: 'APPROVED', totalValue: 100, customerSnapshot: { channel: 'GENERAL_TRADE' } },
    { status: 'APPROVED', totalValue: 50 },
  ] };
  replace(prisma.pjp, 'findMany', async args => args.where.date.gte.getTime() === new Date('2026-09-30T17:00:00Z').getTime()
    ? [{ userId: 'sales', date: new Date('2026-10-06T00:00:00Z'), stops: [stop] }] : []);
  const report = await getMtdReport({ month: 10, year: 2026 });
  const channel = key => report.channelBreakdown.find(row => row.channelKey === key);
  assert.equal(report.summary.mtdActualAmount, 150);
  assert.equal(report.channelBreakdown.reduce((sum, row) => sum + row.mtdOmzet, 0), 150);
  assert.equal(channel('RETAIL').mtdOmzet, 100);
  assert.equal(channel('MODERN_TRADE').mtdOmzet, 0);
  assert.equal(channel('MODERN_TRADE').mtdVisits, 1);
  assert.equal(channel('UNCLASSIFIED').mtdOmzet, 50);
  assert.equal(report.basis.unverifiedChannelAmount, 50);
  assert.equal(report.basis.organization, 'CAPTURED_ASSIGNMENT_WITH_LEGACY_FALLBACK');
  assert.equal(report.basis.legacyAssignmentRecords, 1);
  assert.equal(report.basis.target, 'EXPLICIT_SALES_PERIOD');
  assert.equal(report.salesmen[0].monthlyTarget,null);
  assert.equal(report.summary.overallAchievementRate,'—');
  assert.match(report.basis.channelNote, /pelanggan saat ini/);
});

test('MTD export identifies period and default target, carries limitations and neutralizes formulas', () => {
  const basis = reportBasis('2026-10-08T02:00:00Z');
  const csv = mtdCsv({ basis, period: { month: 10, year: 2026 }, salesmen: [
    { salesmanName: '=CMD()', clusterName: 'A,"B"', monthlyTarget: 100, mtdActualAmount: 100, mtdToLmaRate: '100%' },
  ] });
  assert.match(csv, /Target periode bulanan/);
  assert.match(csv, /"'=CMD\(\)"/);
  assert.match(csv, /"A,""B"""/);
  assert.match(csv, /"10","2026","2026-10-08T02:00:00Z"/);
  assert.ok(csv.includes(basis.note));
  assert.doesNotMatch(csv, /Growth|Pertumbuhan/);
});
