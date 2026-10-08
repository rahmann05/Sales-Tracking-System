import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { prisma } from '../src/config/prisma.js';
import { createOffPjpAttendance } from '../src/modules/absensi/services/create-off-pjp-attendance.service.js';
import { validateOffPjpAttendance } from '../src/modules/absensi/services/validate-off-pjp-attendance.service.js';
import { reportClosedOutlet } from '../src/modules/route-changes/services/report-closed-outlet.service.js';
import { decideRoute } from '../src/modules/route-changes/services/route-decision.service.js';
import { requestOutletUnlock } from '../src/modules/outlets/services/request-outlet-unlock.service.js';
import { handleUnlockRequest } from '../src/modules/outlets/services/handle-unlock-request.service.js';
import { invalidateConfigCache } from '../src/modules/config/services/dynamic-config.service.js';
import { httpServer } from '../src/app.js';
import { config } from '../src/config/index.js';
import jwt from 'jsonwebtoken';
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(process.env.DATABASE_URL).hostname), 'Local database only');
const prefix = `atomic-exceptions-${randomUUID()}`, userIds = [], outlets = [], keys = [];
let cluster, plan, checks = 0, failNotifications = false, insertions = 0;
const originalTransaction = prisma.$transaction, originalConfig = prisma.systemConfig.findMany;
const check = (value, expected) => { assert.deepEqual(value, expected); checks++; };
const rejects = async (work, status) => { await assert.rejects(work, status ? error => error.statusCode === status : /Injected notification failure/); checks++; };
// Failure occurs AFTER an actual notification insert inside an actual SQL transaction.
// Both the domain writes and even earlier notification inserts must disappear.
prisma.$transaction = (work, options) => originalTransaction.call(prisma, tx => work(new Proxy(tx, { get(target, key) {
  if (key !== 'notification') return target[key];
  return new Proxy(target.notification, { get(model, method) {
    if (!['create', 'createMany'].includes(method)) return model[method];
    return async args => { const result = await model[method](args); insertions++; if (failNotifications) throw new Error('Injected notification failure'); return result; };
  } });
} })), options);
prisma.systemConfig.findMany = async () => [
  { key: 'OFF_PJP_ENABLED', value: true }, { key: 'ATTENDANCE_ALLOW_MANUAL_SALES', value: true },
  { key: 'MANUAL_SALES_REPORT_MODE', value: 'NOTES_ONLY' }, { key: 'REROUTE_REQUIRE_ADMIN_APPROVAL', value: false },
];
invalidateConfigCache();
try {
  const makeUser = async role => { const user = await prisma.user.create({ data: { name: prefix, email: `${randomUUID()}@example.invalid`, password: 'fixture', role } }); userIds.push(user.id); return user; };
  const admin = await makeUser('ADMIN'), spv = await makeUser('SUPERVISOR'), sales = await makeUser('SALES');
  cluster = await prisma.cluster.create({ data: { name: prefix, region: 'Fixture', supervisorId: spv.id, assignedSalesId: sales.id } });
  await prisma.user.update({ where: { id: sales.id }, data: { supervisorId: spv.id, clusterId: cluster.id } });
  for (let i = 0; i < 4; i++) outlets.push(await prisma.outlet.create({ data: { name: `${prefix}-${i}`, address: 'Alamat fixture', clusterId: cluster.id, latitude: -6.9, longitude: 107.6 } }));
  plan = await prisma.pjp.create({ data: { userId: sales.id, date: new Date(), type: 'SALES', stops: { create: outlets.slice(0, 2).map((outlet, i) => ({ outletId: outlet.id, sequence: i + 1 })) } }, include: { stops: true } });
  const requestId = randomUUID(), input = { requestId, outletName: prefix, address: 'Alamat pengujian', reason: 'Kunjungan luar PJP', latitude: -6.9, longitude: 107.6,
    visitOutcome: { purpose: 'COLLECTION', reference: 'NOTA-FIXTURE', result: 'PROMISED', promiseDate: '2099-01-01', note: 'Janji eksternal' } };
  const key = `_OFF_PJP_REQUEST:${sales.id}:${requestId}`; keys.push(key);
  failNotifications = true; await rejects(() => createOffPjpAttendance(sales.id, input));
  check(await prisma.offPjpAttendance.count({ where: { userId: sales.id } }), 0);
  check(await prisma.notification.count({ where: { userId: spv.id } }), 0);
  check(await prisma.systemConfig.findUnique({ where: { key } }), null);
  failNotifications = false; const off = await createOffPjpAttendance(sales.id, input);
  check((await createOffPjpAttendance(sales.id, input)).id, off.id);
  check(await prisma.offPjpAttendance.count({ where: { userId: sales.id } }), 1);
  check(await prisma.notification.count({ where: { userId: spv.id, type: 'OFF_PJP_SUBMITTED' } }), 1);
  await rejects(() => createOffPjpAttendance(sales.id, { ...input, reason: 'Isi pengajuan berbeda' }), 409);
  const secondId = randomUUID(); keys.push(`_OFF_PJP_REQUEST:${sales.id}:${secondId}`);
  const raced = await Promise.all([createOffPjpAttendance(sales.id, { ...input, requestId: secondId }), createOffPjpAttendance(sales.id, { ...input, requestId: secondId })]);
  check(raced[0].id, raced[1].id); check(await prisma.offPjpAttendance.count({ where: { userId: sales.id } }), 2);

  failNotifications = true; await rejects(() => validateOffPjpAttendance(off.id, spv.id, true));
  check((await prisma.offPjpAttendance.findUnique({ where: { id: off.id } })).status, 'PENDING');
  check(await prisma.staffActivity.count({ where: { userId: sales.id, kind: 'COLLECTION_FOLLOW_UP' } }), 0);
  check(await prisma.notification.count({ where: { userId: sales.id, type: 'OFF_PJP_VALIDATED' } }), 0);
  failNotifications = false; await validateOffPjpAttendance(off.id, spv.id, true);
  check(await prisma.staffActivity.count({ where: { userId: sales.id, kind: 'COLLECTION_FOLLOW_UP' } }), 1);
  await rejects(() => validateOffPjpAttendance(off.id, spv.id, true), 409);
  check(await prisma.notification.count({ where: { userId: sales.id, type: 'OFF_PJP_VALIDATED' } }), 1);
  // Replaying the request returns the current record, including a decision made meanwhile.
  check((await createOffPjpAttendance(sales.id, input)).status, 'APPROVED');
  check(await prisma.staffActivity.count({ where: { userId: sales.id, kind: 'COLLECTION_FOLLOW_UP' } }), 1);

  const stop = plan.stops[0];
  failNotifications = true; await rejects(() => reportClosedOutlet(sales.id, stop.id, 'Toko tutup'));
  check((await prisma.pjpStop.findUnique({ where: { id: stop.id } })).status, 'PENDING');
  check(await prisma.routeChangeRequest.count({ where: { reportedBy: sales.id } }), 0);
  failNotifications = false; const change = await reportClosedOutlet(sales.id, stop.id, 'Toko tutup');
  await rejects(() => reportClosedOutlet(sales.id, stop.id, 'Toko tutup'), 409);
  check(await prisma.routeChangeRequest.count({ where: { reportedBy: sales.id } }), 1);
  failNotifications = true; await rejects(() => decideRoute(spv.id, change.id, 'REROUTE', outlets[2].id));
  check((await prisma.routeChangeRequest.findUnique({ where: { id: change.id } })).status, 'PENDING_APPROVAL');
  check((await prisma.pjpStop.findUnique({ where: { id: stop.id } })).status, 'CLOSED_REPORTED');
  check(await prisma.pjpStop.count({ where: { pjpId: plan.id } }), 2);
  check(await prisma.notification.count({ where: { userId: sales.id, type: 'ROUTE_CHANGE_DECIDED' } }), 0);
  failNotifications = false; const rerouted = await decideRoute(spv.id, change.id, 'REROUTE', outlets[2].id);
  check(rerouted.routeChangeRequest.status, 'APPROVED'); check(await prisma.pjpStop.count({ where: { pjpId: plan.id } }), 3);
  await rejects(() => decideRoute(spv.id, change.id, 'REROUTE', outlets[2].id), 409);
  check(await prisma.notification.count({ where: { userId: sales.id, type: 'ROUTE_CHANGE_DECIDED' } }), 1);

  failNotifications = true; await rejects(() => requestOutletUnlock(outlets[0].id, sales.id, 'Pengecualian absensi fixture'));
  check(await prisma.outletUnlockRequest.count({ where: { requestedBy: sales.id } }), 0);
  check(await prisma.notification.count({ where: { type: 'UNLOCK_REQUEST', payload: { path: ['salesId'], equals: sales.id } } }), 0);
  failNotifications = false; const unlock = await requestOutletUnlock(outlets[0].id, sales.id, 'Pengecualian absensi fixture');
  await rejects(() => requestOutletUnlock(outlets[0].id, sales.id, 'Pengecualian absensi fixture'), 409);
  check(await prisma.outletUnlockRequest.count({ where: { requestedBy: sales.id } }), 1);
  failNotifications = true; await rejects(() => handleUnlockRequest(unlock.id, admin.id, true));
  const unchanged = await prisma.outletUnlockRequest.findUnique({ where: { id: unlock.id } }); check(unchanged.status, 'PENDING_APPROVAL'); check(unchanged.expiresAt, null);
  check(await prisma.notification.count({ where: { userId: sales.id, type: 'UNLOCK_APPROVED' } }), 0);
  failNotifications = false; await handleUnlockRequest(unlock.id, admin.id, true);
  await rejects(() => handleUnlockRequest(unlock.id, admin.id, true), 409);
  check(await prisma.notification.count({ where: { userId: sales.id, type: 'UNLOCK_APPROVED' } }), 1);
  check(insertions >= 12, true);
  await new Promise(resolve => httpServer.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${httpServer.address().port}/api/v1`;
  const headers = { Authorization: `Bearer ${jwt.sign({ id: sales.id, role: sales.role }, config.jwtSecret, { expiresIn: '5m' })}`, 'Content-Type': 'application/json' };
  const httpId = randomUUID(); keys.push(`_OFF_PJP_REQUEST:${sales.id}:${httpId}`);
  const httpInput = { ...input, requestId: httpId };
  const before = await prisma.offPjpAttendance.count({ where: { userId: sales.id } });
  const lost = await fetch(`${base}/absensi/off-pjp`, { method: 'POST', headers, body: JSON.stringify(httpInput) }); check(lost.status, 201);
  await lost.arrayBuffer(); // Model a caller that never retained the first successful result.
  const retry = await fetch(`${base}/absensi/off-pjp`, { method: 'POST', headers, body: JSON.stringify(httpInput) }); check(retry.status, 201);
  const replay = (await retry.json()).data; check(replay.userId, sales.id);
  check(await prisma.offPjpAttendance.count({ where: { userId: sales.id } }), before + 1);
  const mismatch = await fetch(`${base}/absensi/off-pjp`, { method: 'POST', headers, body: JSON.stringify({ ...httpInput, address: 'Alamat berbeda' }) }); check(mismatch.status, 409);
  check((await fetch(`${base}/config/_OFF_PJP_REQUEST:${sales.id}:${httpId}`, { headers })).status, 403);
  console.log(`Exception atomicity integration passed: ${checks} checks; six real-SQL rollback paths, safe retries, concurrent off-PJP deduplication and no duplicate follow-ups/notifications.`);
} finally {
  if (httpServer.listening) await new Promise(resolve => httpServer.close(resolve));
  prisma.$transaction = originalTransaction; prisma.systemConfig.findMany = originalConfig; invalidateConfigCache();
  await prisma.notification.deleteMany({ where: { OR: [{ userId: { in: userIds } }, ...userIds.map(id => ({ payload: { path: ['salesId'], equals: id } }))] } });
  await prisma.systemConfig.deleteMany({ where: { key: { in: keys } } });
  await prisma.staffActivity.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.offPjpAttendance.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.outletUnlockRequest.deleteMany({ where: { requestedBy: { in: userIds } } });
  await prisma.routeChangeRequest.deleteMany({ where: { reportedBy: { in: userIds } } });
  if (plan) await prisma.pjp.delete({ where: { id: plan.id } });
  await prisma.outlet.deleteMany({ where: { id: { in: outlets.map(outlet => outlet.id) } } });
  await prisma.user.updateMany({ where: { id: { in: userIds } }, data: { clusterId: null } });
  if (cluster) await prisma.cluster.delete({ where: { id: cluster.id } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } }); await prisma.$disconnect();
}
