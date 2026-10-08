// Disposable local fixtures exercise real SQL scope, including transfers and inactive users.
import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { prisma } from '../src/config/prisma.js';
import { captureReportAssignment } from '../src/modules/reports/services/report-assignment.service.js';
import { getWeeklyReport } from '../src/modules/reports/services/get-weekly-report.service.js';
import { getMtdReport } from '../src/modules/reports/services/get-mtd-report.service.js';
import { getDailyCallReport } from '../src/modules/daily-calls/services/get-daily-call-report.service.js';
import { invalidateConfigCache } from '../src/modules/config/services/dynamic-config.service.js';

assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.DATABASE_URL).hostname), 'Local database only');
const key = `report-history-${randomUUID()}`;
const users = [], clusters = [], outlets = [], plans = [], offVisits = [];
let count = 0;
const check = (actual, expected) => { assert.deepEqual(actual, expected); count++; };
const originalConfig = prisma.systemConfig.findMany;
// Deterministic report parameters; no operational setting is modified.
prisma.systemConfig.findMany = async () => [];
invalidateConfigCache();
const user = async role => {
  const result = await prisma.user.create({ data: { name: `${key}-${role}`, email: `${randomUUID()}@example.invalid`, password: 'fixture', role } });
  users.push(result.id); return result;
};
const identity = id => prisma.user.findUnique({ where: { id }, include: { cluster: true } });
const plan = async (sales, outletId, day, legacy = false) => {
  const result = await prisma.pjp.create({ data: {
    userId: sales.id, date: new Date(`${day}T00:00:00+07:00`), type: 'SALES',
    ...(!legacy ? captureReportAssignment(sales, 'PJP_PLAN', new Date(`${day}T00:00:00+07:00`)) : {}),
    stops: { create: { outletId, sequence: 1, status: 'VISITED' } },
  } });
  plans.push(result.id); return result;
};
try {
  const oldSpv = await user('SUPERVISOR'), newSpv = await user('SUPERVISOR'), sales = await user('SALES');
  for (const [index, spv] of [oldSpv, newSpv].entries()) {
    const cluster = await prisma.cluster.create({ data: { name: `${key}-cluster-${index}`, region: index ? 'Jakarta' : 'Bandung', supervisorId: spv.id } });
    clusters.push(cluster.id);
    const outlet = await prisma.outlet.create({ data: { name: `${key}-outlet-${index}`, address: 'Alamat pengujian', clusterId: cluster.id, latitude: -6.9, longitude: 107.6 } });
    outlets.push(outlet.id);
  }
  await prisma.user.update({ where: { id: sales.id }, data: { supervisorId: oldSpv.id, clusterId: clusters[0] } });
  const oldIdentity = await identity(sales.id);
  const oldPlan = await plan(oldIdentity, outlets[0], '2026-09-08');
  await plan(oldIdentity, outlets[0], '2026-08-04');
  const off = await prisma.offPjpAttendance.create({ data: {
    userId: sales.id, ...captureReportAssignment(oldIdentity, 'OFF_PJP_SUBMISSION', new Date('2026-09-08T03:00:00Z')),
    outletName: 'Luar PJP', address: 'Alamat pengujian', reason: 'Kunjungan pengujian', latitude: -6.9, longitude: 107.6,
    status: 'APPROVED', createdAt: new Date('2026-09-08T03:00:00Z'),
  } });
  offVisits.push(off.id);
  await prisma.user.update({ where: { id: sales.id }, data: { name: `${key}-renamed`, supervisorId: newSpv.id, clusterId: clusters[1] } });
  const newIdentity = await identity(sales.id);
  await plan(newIdentity, outlets[1], '2026-09-09');
  await plan(newIdentity, outlets[1], '2026-09-10', true);
  const scope = supervisorId => ({ supervisorId, userId: sales.id });
  const oldWeekly = await getWeeklyReport({ ...scope(oldSpv.id), startDate: '2026-09-07' });
  check(oldWeekly.summary.totalPlanCalls, 1);
  check(oldWeekly.summary.totalActualCalls, 2);
  check(oldWeekly.salesmen.length, 1);
  check(oldWeekly.salesmen[0].salesmanName, oldIdentity.name);
  check(oldWeekly.salesmen[0].clusterName, oldIdentity.cluster.name);
  check(oldWeekly.basis.legacyAssignmentRecords, 0);
  const newWeekly = await getWeeklyReport({ ...scope(newSpv.id), startDate: '2026-09-07' });
  check(newWeekly.summary.totalPlanCalls, 2);
  check(newWeekly.summary.totalOffPjpCalls, 0);
  check(newWeekly.salesmen[0].salesmanName, newIdentity.name);
  check(newWeekly.basis.legacyAssignmentRecords, 1);
  const oldMtd = await getMtdReport({ ...scope(oldSpv.id), month: 9, year: 2026 });
  check(oldMtd.summary.totalMtdPlanCalls, 1);
  check(oldMtd.summary.totalMtdActualCalls, 2);
  check(oldMtd.basis.capturedAssignmentRecords, 3); // September plan/off visit + August comparison plan.
  const newMtd = await getMtdReport({ ...scope(newSpv.id), month: 9, year: 2026 });
  check(newMtd.summary.totalMtdPlanCalls, 2);
  check(newMtd.basis.capturedAssignmentRecords, 1);
  const oldDaily = await getDailyCallReport({ ...scope(oldSpv.id), date: '2026-09-08' });
  check(oldDaily.summary.totalPlanCalls, 1);
  check(oldDaily.summary.totalActualCalls, 2);
  check(oldDaily.rows.every(row => row.assignmentHistorical), true);
  check(oldDaily.rows.every(row => row.salesmanName === oldIdentity.name), true);
  check(oldDaily.rows.every(row => row.clusterName === oldIdentity.cluster.name), true);
  const newDaily = await getDailyCallReport({ ...scope(newSpv.id), date: '2026-09-08' });
  check(newDaily.rows.length, 0);
  const combined = await getWeeklyReport({ userId: sales.id, startDate: '2026-09-07' });
  check(combined.summary.totalPlanCalls, 3);
  check(combined.salesmen[0].clusterName, 'Beberapa penugasan pada periode');
  check(combined.salesmen[0].assignments.length, 3); // Old, new captured, and legacy current assignment.
  await prisma.user.update({ where: { id: sales.id }, data: { deletedAt: new Date(), role: 'SUPIR' } });
  const inactive = await getWeeklyReport({ ...scope(oldSpv.id), startDate: '2026-09-07' });
  check(inactive.summary.totalPlanCalls, 1);
  check(inactive.salesmen[0].salesmanName, oldIdentity.name);
  const inactiveOwn = await getMtdReport({ userId: sales.id, month: 9, year: 2026 });
  check(inactiveOwn.summary.totalMtdPlanCalls, 3);
  check(inactiveOwn.salesmen.length, 1);
  const saved = await prisma.pjp.findUnique({ where: { id: oldPlan.id } });
  check(saved.reportSupervisorId, oldSpv.id);
  check(saved.reportingContext.name, oldIdentity.name);
  check(saved.reportingContext.clusterName, oldIdentity.cluster.name);
  console.log(`Report assignment integration passed: ${count} checks (historical scope, transfer isolation, inactive participants, mixed assignments, legacy disclosure, daily/weekly/MTD).`);
} finally {
  prisma.systemConfig.findMany = originalConfig; invalidateConfigCache();
  await prisma.offPjpAttendance.deleteMany({ where: { id: { in: offVisits } } });
  await prisma.pjp.deleteMany({ where: { id: { in: plans } } });
  await prisma.user.updateMany({ where: { id: { in: users } }, data: { clusterId: null, supervisorId: null } });
  await prisma.outlet.deleteMany({ where: { id: { in: outlets } } });
  await prisma.cluster.deleteMany({ where: { id: { in: clusters } } });
  await prisma.user.deleteMany({ where: { id: { in: users } } });
  await prisma.$disconnect();
}
