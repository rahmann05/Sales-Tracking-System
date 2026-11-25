import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isStaleShift,
  closeStaleShiftRow,
} from '../src/modules/staff-attendance/shift-day-close.service.js';
import { attendanceNoCheckout, attendanceStatus } from '../../shared/staff-attendance-report.mjs';

const values = {
  SHIFT_ATTENDANCE_MODE: 'IN_OUT',
  SHIFT_START_TIME: '08:00',
  SHIFT_END_TIME: '17:00',
};
const forgotten = {
  id: 'shift-1',
  userId: 'sales-1',
  kind: 'SHIFT',
  dateKey: '2026-11-25',
  checkInAt: '2026-11-25T00:15:00.000Z',
  checkOutAt: null,
  lateMinutes: 0,
  checklist: { startKind: 'CHECK_IN' },
  policySnapshot: { values },
};
// 2026-11-26 00:47 WIB, the day after the forgotten shift.
const nextDay = Date.parse('2026-11-25T17:47:00Z');

test('a shift left open on an earlier WIB day is stale; today and overnight shifts are not', () => {
  assert.equal(isStaleShift(forgotten, nextDay), true);
  assert.equal(isStaleShift(forgotten, Date.parse('2026-11-25T10:00:00Z')), false);
  assert.equal(isStaleShift({ ...forgotten, checkOutAt: new Date() }, nextDay), false);
  assert.equal(isStaleShift({ ...forgotten, checklist: { state: 'FINISHED' } }, nextDay), false);
  const night = {
    ...forgotten,
    policySnapshot: { values: { ...values, SHIFT_START_TIME: '22:00', SHIFT_END_TIME: '06:00' } },
  };
  assert.equal(isStaleShift(night, nextDay), false);
  assert.equal(isStaleShift(night, Date.parse('2026-11-25T23:30:00Z')), true);
});

test('auto-close keeps check-out empty, marks "tidak checkout" and raises one exception', async () => {
  const calls = { update: [], upsert: [] };
  const db = {
    staffActivity: {
      updateMany: async (args) => (calls.update.push(args), { count: 1 }),
    },
    user: { findUnique: async () => ({ supervisorId: 'spv-1' }) },
    operationalException: { upsert: async (args) => calls.upsert.push(args) },
  };
  assert.equal(await closeStaleShiftRow(db, forgotten, nextDay), 'shift-1');
  const { data, where } = calls.update[0];
  assert.deepEqual(where, { id: 'shift-1', checkOutAt: null });
  assert.equal('checkOutAt' in data, false);
  assert.equal(data.checklist.state, 'FINISHED');
  assert.equal(data.checklist.source, 'AUTO_DAY_CLOSE');
  assert.equal(data.checklist.noCheckout, true);
  assert.equal(calls.upsert[0].where.dedupeKey, 'UNCLOSED_SHIFT:shift-1');
  assert.equal(calls.upsert[0].create.supervisorId, 'spv-1');

  const closed = { ...forgotten, checklist: data.checklist };
  assert.equal(attendanceNoCheckout(closed), true);
  assert.match(attendanceStatus(closed), /^Tidak checkout · /);
  assert.equal(attendanceNoCheckout({ ...closed, checkOutAt: new Date() }), false);
});

test('auto-close is skipped when a check-out happened concurrently and for non-attendance shifts', async () => {
  const db = {
    staffActivity: { updateMany: async () => ({ count: 0 }) },
    user: { findUnique: async () => assert.fail('no exception without a closure') },
    operationalException: { upsert: async () => assert.fail('no exception without a closure') },
  };
  assert.equal(await closeStaleShiftRow(db, forgotten, nextDay), null);
  const flags = [];
  const optional = {
    staffActivity: { updateMany: async (a) => (flags.push(a), { count: 1 }) },
    user: { findUnique: async () => assert.fail('optional mode needs no exception') },
    operationalException: { upsert: async () => assert.fail('optional mode needs no exception') },
  };
  const row = {
    ...forgotten,
    policySnapshot: { values: { ...values, SHIFT_ATTENDANCE_MODE: 'OPTIONAL' } },
  };
  await closeStaleShiftRow(optional, row, nextDay);
  assert.equal(flags[0].data.checklist.noCheckout, false);
  assert.equal(attendanceNoCheckout({ ...row, checklist: flags[0].data.checklist }), false);
});
