import { test } from 'node:test';
import assert from 'node:assert/strict';
import { syncHealth, mapNotification } from '../../shared/monitoring.mjs';
import { createSchedulerMonitor, nextDailyPjp } from '../src/utils/scheduler-health.js';
import { notifyFollowUp } from '../src/modules/staff-attendance/follow-up-notification.service.js';

test('monitoring distinguishes offline, failed, never loaded and expired data', () => {
  const now = Date.now(), state = { lastSuccessAt: new Date(now - 150001).toISOString() };
  assert.equal(syncHealth(state, now), 'STALE');
  assert.equal(syncHealth({ lastSuccessAt: new Date(now).toISOString() }, now), 'CURRENT');
  assert.equal(syncHealth({}, now), 'WAITING');
  assert.equal(syncHealth({ ...state, error: 'Order unavailable' }, now), 'ERROR');
  assert.equal(syncHealth({ ...state, error: 'Error' }, now, false), 'OFFLINE');
});
test('server notification mapping preserves ownership, read state, type and WIB time', () => {
  const item = mapNotification({ id: 'n', userId: 'recipient', isRead: true, type: 'ORDER_REVIEW_ASSIGNED', createdAt: '2026-10-08T00:00:00Z' });
  assert.equal(item.read, true); assert.equal(item.userId, 'recipient'); assert.equal(item.source, 'SERVER'); assert.match(item.timestamp, /07[.:]00.*WIB/);
});
test('scheduler failure remains visible until a successful retry and late execution is detected', async () => {
  let now = 1000; const monitor = createSchedulerMonitor(() => now);
  monitor.register('job', 'Job', 2000, 500);
  assert.equal(monitor.snapshot()[0].status, 'WAITING');
  now = 2501; assert.equal(monitor.snapshot()[0].status, 'OVERDUE');
  await assert.rejects(() => monitor.run('job', async () => { throw new Error('private database error'); }, t => t + 1000));
  assert.equal(monitor.snapshot()[0].status, 'FAILED');
  assert.doesNotMatch(JSON.stringify(monitor.snapshot()), /private database error/);
  now = 3000; await monitor.run('job', async () => 'done', t => t + 1000);
  assert.equal(monitor.snapshot()[0].status, 'OK'); assert.equal(monitor.snapshot()[0].lastFailedAt, null); assert.equal(monitor.snapshot()[0].lastSuccessAt, 3000);
});
test('scheduler prevents overlapping work and identifies a stalled running job', async () => {
  let now = 1000, finish; const monitor = createSchedulerMonitor(() => now); monitor.register('job', 'Job', 2000, 100);
  const pending = monitor.run('job', () => new Promise(resolve => { finish = resolve; }), t => t + 1000);
  assert.equal(monitor.snapshot()[0].status, 'RUNNING');
  let duplicate = false; await monitor.run('job', async () => { duplicate = true; }, t => t + 1000); assert.equal(duplicate, false);
  now += 20 * 60000 + 1; assert.equal(monitor.snapshot()[0].status, 'STALLED'); finish(); await pending;
  assert.equal(monitor.snapshot()[0].status, 'OK');
});
test('daily PJP schedule uses 03:00 WIB independently of server timezone', () => {
  assert.equal(new Date(nextDailyPjp(Date.parse('2026-10-08T19:00:00Z'))).toISOString(), '2026-10-08T20:00:00.000Z');
  assert.equal(new Date(nextDailyPjp(Date.parse('2026-10-08T20:00:00Z'))).toISOString(), '2026-10-09T20:00:00.000Z');
});
test('follow-up review notification uses the current supervisor and falls back to Admin when unassigned', async () => {
  let supervisorId = 'spv', delivered = [];
  const db = { user: { findFirst: async ({ where }) => where.id === 'sales' ? { id: 'sales', supervisorId } : { id: 'spv' }, findMany: async () => [{ id: 'admin' }] }, notification: { createMany: async ({ data }) => { delivered = data; } } };
  const record = { id: 'activity', outletName: 'Toko', followUp: { ownerId: 'sales', dueDate: '2026-10-09' } };
  await notifyFollowUp(db, record, 'SUBMITTED', 'sales'); assert.deepEqual(delivered.map(n => n.userId), ['spv']);
  supervisorId = null; await notifyFollowUp(db, record, 'SUBMITTED', 'sales'); assert.deepEqual(delivered.map(n => n.userId), ['admin']);
  await notifyFollowUp(db, record, 'RETURNED', 'spv'); assert.deepEqual(delivered.map(n => n.userId), ['sales']);
  assert.equal(delivered[0].type, 'FOLLOW_UP_RETURNED'); assert.equal(delivered[0].payload.staffActivityId, 'activity');
});
import {useDefaultPolicy} from './helpers/config-fixture.js';
useDefaultPolicy();
