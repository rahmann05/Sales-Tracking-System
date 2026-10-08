import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Prisma } from '@prisma/client';
import { captureReportAssignment, reportScopeWhere, reportIdentity, mergeReportSales, assignmentReportBasis } from '../src/modules/reports/services/report-assignment.service.js';
import { reportSalesOptions, dailyCallCsv } from '../../shared/report-semantics.mjs';
import { prisma } from '../src/config/prisma.js';
import { invalidateConfigCache } from '../src/modules/config/services/dynamic-config.service.js';
import { getWeeklyReport } from '../src/modules/reports/services/get-weekly-report.service.js';
import { getMtdReport } from '../src/modules/reports/services/get-mtd-report.service.js';
import { getDailyCallReport } from '../src/modules/daily-calls/services/get-daily-call-report.service.js';

const sales = { id: 'sales', name: 'Nama lama', supervisorId: 'spv-lama', clusterId: 'wilayah-lama', cluster: { id: 'wilayah-lama', name: 'Wilayah lama', region: 'Bandung' } };
const record = () => ({ userId: sales.id, date: new Date('2026-10-06'), ...captureReportAssignment(sales, 'PJP_PLAN', new Date('2026-10-06')) });

test('captured identity and indexed scope survive changes to the sales master', () => {
  const captured = record();
  captured.user = { ...sales, name: 'Nama baru', supervisorId: 'spv-baru', cluster: { id: 'baru', name: 'Wilayah baru' } };
  const identity = reportIdentity(captured);
  assert.equal(identity.name, 'Nama lama');
  assert.equal(identity.supervisorId, 'spv-lama');
  assert.equal(identity.cluster.name, 'Wilayah lama');
  assert.equal(captured.reportSupervisorId, 'spv-lama');
  assert.equal(captured.reportClusterId, 'wilayah-lama');
  assert.equal(identity.historical, true);
});

test('SPV report scope cannot use current membership for a record that has a snapshot', () => {
  const where = reportScopeWhere({ supervisorId: 'spv-lama', clusterId: 'wilayah-lama', userId: 'sales' });
  assert.equal(where.userId, 'sales');
  assert.equal(where.OR[0].reportSupervisorId, 'spv-lama');
  assert.equal(where.OR[0].reportClusterId, 'wilayah-lama');
  assert.equal(where.OR[0].reportingContext.not, Prisma.DbNull);
  assert.equal(where.OR[1].reportingContext.equals, Prisma.DbNull);
  assert.deepEqual(where.OR[1].user, { supervisorId: 'spv-lama', clusterId: 'wilayah-lama' });
  assert.deepEqual(reportScopeWhere({ userId: 'sales' }), { userId: 'sales' });
});

test('historical participants remain in reports without active roster membership', () => {
  const rows = mergeReportSales([], { rawRecords: [record()] });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].name, 'Nama lama');
  assert.equal(rows[0].assignments[0].historical, true);
});

test('multiple assignments in one period are disclosed rather than labeled as one territory', () => {
  const moved = { ...sales, name: 'Nama baru', supervisorId: 'spv-baru', clusterId: 'wilayah-baru', cluster: { id: 'wilayah-baru', name: 'Wilayah baru', region: 'Jakarta' } };
  const newer = { userId: sales.id, date: new Date('2026-10-07'), ...captureReportAssignment(moved, 'PJP_PLAN') };
  const rows = mergeReportSales([moved], { rawRecords: [newer, record()] });
  assert.equal(rows[0].name, 'Nama baru');
  assert.equal(rows[0].cluster.name, 'Beberapa penugasan pada periode');
  assert.equal(rows[0].cluster.region, 'Beberapa wilayah pada periode');
  assert.equal(rows[0].assignments.length, 2);
});

test('legacy membership is counted as unverified without creating snapshots during reporting', () => {
  const legacy = { userId: sales.id, user: sales, createdAt: new Date('2026-10-06') };
  const dataset = { rawRecords: [record(), legacy] };
  const basis = assignmentReportBasis(dataset);
  assert.equal(basis.capturedAssignmentRecords, 1);
  assert.equal(basis.legacyAssignmentRecords, 1);
  assert.equal(reportIdentity(legacy).historical, false);
  mergeReportSales([], dataset);
  assert.equal(legacy.reportingContext, undefined);
});

test('report filters include historical-only sales and preserve an empty selected identity', () => {
  const options = reportSalesOptions([], [{ salesmanId: 'former', salesmanName: 'Sales lama', clusterName: 'Wilayah lama' }], 'selected');
  assert.equal(options.find(row => row.id === 'former').historicalOnly, true);
  assert.ok(options.find(row => row.id === 'selected'));
  const csv = dailyCallCsv({ basis: { generatedAt: '2026-10-08', note: 'Konteks saat rencana dibuat' }, rows: [{ salesmanName: '=CMD()', clusterName: 'Wilayah lama', assignmentHistorical: true }] });
  assert.match(csv, /"'=CMD\(\)"/);
  assert.match(csv, /Tersimpan/);
  assert.match(csv, /Konteks saat rencana dibuat/);
});

test('daily, weekly and MTD retain captured participants outside the active roster', async t => {
  const replace = (model, method, implementation) => {
    const original = model[method]; model[method] = implementation;
    t.after(() => { model[method] = original; invalidateConfigCache(); });
  };
  const historical = {
    ...record(), date: new Date('2026-10-05T17:00:00Z'),
    user: { ...sales, name: 'Nama setelah transfer', deletedAt: new Date(), role: 'SUPIR' },
    stops: [{ id: 'stop', sequence: 1, status: 'VISITED', outlet: { name: 'Toko', latitude: -6, longitude: 107 },
      attendances: [{ type: 'IN', timestamp: new Date('2026-10-06T02:00:00Z') }, { type: 'OUT', timestamp: new Date('2026-10-06T02:10:00Z'), durationMinutes: 10 }],
      orders: [{ status: 'APPROVED', totalValue: 100, items: [{ productId: 'p' }], customerSnapshot: { channel: 'GENERAL_TRADE' } }] }],
  };
  const off = { userId: sales.id, user: historical.user, ...captureReportAssignment(sales, 'OFF_PJP_SUBMISSION'),
    createdAt: new Date('2026-10-06T03:00:00Z'), status: 'APPROVED', outletName: 'Luar PJP', reason: 'Kunjungan', latitude: -6, longitude: 107 };
  replace(prisma.systemConfig, 'findMany', async () => []); invalidateConfigCache();
  replace(prisma.user, 'findMany', async query => {
    assert.equal(query.where.deletedAt, null);
    assert.equal(query.where.supervisorId, 'spv-lama');
    return []; // Current active membership no longer contains the participant.
  });
  const scoped = (query, row, dateField) => {
    assert.equal(query.where.userId, sales.id);
    assert.equal(query.where.OR[0].reportSupervisorId, 'spv-lama');
    assert.equal(query.where.OR[1].reportingContext.equals, Prisma.DbNull);
    const range = query.where[dateField], date = row[dateField];
    return date >= range.gte && date <= range.lte ? [row] : [];
  };
  replace(prisma.pjp, 'findMany', async query => scoped(query, historical, 'date'));
  replace(prisma.offPjpAttendance, 'findMany', async query => scoped(query, off, 'createdAt'));
  const scope = { userId: sales.id, supervisorId: 'spv-lama' };
  const weekly = await getWeeklyReport({ ...scope, startDate: '2026-10-05' });
  assert.equal(weekly.summary.totalActualCalls, 2);
  assert.equal(weekly.summary.totalOrderAmount, 100);
  assert.equal(weekly.salesmen[0].salesmanName, sales.name);
  assert.equal(weekly.salesmen[0].clusterName, sales.cluster.name);
  assert.equal(weekly.basis.capturedAssignmentRecords, 2);
  const mtd = await getMtdReport({ ...scope, month: 10, year: 2026 });
  assert.equal(mtd.summary.totalMtdActualCalls, 2);
  assert.equal(mtd.summary.mtdActualAmount, 100);
  assert.equal(mtd.salesmen[0].salesmanName, sales.name);
  const daily = await getDailyCallReport({ ...scope, date: '2026-10-06' });
  assert.equal(daily.summary.totalActualCalls, 2);
  assert.equal(daily.summary.totalOrderAmount, 100);
  assert.equal(daily.rows.every(row => row.assignmentHistorical), true);
  assert.equal(daily.rows.every(row => row.salesmanName === sales.name), true);
  assert.equal(daily.rows.every(row => row.clusterName === sales.cluster.name), true);
  assert.equal(daily.basis.legacyAssignmentRecords, 0);
});
