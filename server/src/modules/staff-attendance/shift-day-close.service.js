import { prisma } from '../../config/prisma.js';
import { getDynamicConfig } from '../config/config.service.js';
import { withUserTransaction } from '../../utils/user-transaction.js';
import { shiftDateKey, shiftSchedule } from '../../../../shared/shift-policy.mjs';

export const AUTO_DAY_CLOSE = 'AUTO_DAY_CLOSE';

const openShift = (row) => !row.checkOutAt && row.checklist?.state !== 'FINISHED';

/**
 * Decide whether an unfinished shift belongs to a previous work day and may no longer
 * stay active. A shift whose scheduled end (including an overnight end) is still ahead
 * is kept, so night shifts are not cut at midnight.
 */
export function isStaleShift(row, now = Date.now(), cutoff = '00:00') {
  if (row.kind !== 'SHIFT' || !openShift(row)) return false;
  if (!(row.dateKey < shiftDateKey(now, cutoff))) return false;
  return shiftSchedule(row.dateKey, row.policySnapshot?.values || {}).end <= now;
}

/**
 * Close a stale shift WITHOUT inventing a check-out time: checkOutAt stays empty and the
 * record is marked as "tidak checkout" so reports never treat it as a normal finish.
 */
export async function closeStaleShiftRow(db, row, now = Date.now()) {
  const mode = row.policySnapshot?.values?.SHIFT_ATTENDANCE_MODE || 'IN_OUT';
  const requiresOut = mode === 'IN_OUT' && row.checklist?.startKind !== 'BUSINESS_START';
  const updated = await db.staffActivity.updateMany({
    where: { id: row.id, checkOutAt: null },
    data: {
      checklist: {
        ...row.checklist,
        state: 'FINISHED',
        finishedAt: new Date(now).toISOString(),
        source: AUTO_DAY_CLOSE,
        noCheckout: requiresOut,
      },
    },
  });
  if (!updated.count) return null;
  if (requiresOut) {
    const person = await db.user.findUnique({
      where: { id: row.userId },
      select: { supervisorId: true },
    });
    await db.operationalException.upsert({
      where: { dedupeKey: `UNCLOSED_SHIFT:${row.id}` },
      update: {},
      create: {
        dedupeKey: `UNCLOSED_SHIFT:${row.id}`,
        kind: 'UNCLOSED_SHIFT',
        entityId: row.id,
        userId: row.userId,
        supervisorId: person?.supervisorId,
        details: { source: AUTO_DAY_CLOSE, shiftDate: row.dateKey },
      },
    });
  }
  return row.id;
}

async function closeRows(userId, now) {
  const cutoff = await getDynamicConfig('SHIFT_DAY_CUTOFF_TIME', '00:00');
  const candidates = await prisma.staffActivity.findMany({
    where: { kind: 'SHIFT', checkOutAt: null, ...(userId ? { userId } : {}) },
  });
  const stale = candidates.filter((row) => isStaleShift(row, now, cutoff));
  const closed = [];
  for (const row of stale)
    closed.push(
      ...(await withUserTransaction(row.userId, async (tx) => {
        // Re-read under the user lock so a concurrent check-out is never overwritten.
        const current = await tx.staffActivity.findUnique({ where: { id: row.id } });
        if (!current || !isStaleShift(current, now, cutoff)) return [];
        const id = await closeStaleShiftRow(tx, current, now);
        return id ? [id] : [];
      }))
    );
  return closed;
}

/** Close the user's shifts left open on an earlier work day. Safe to call on every request. */
export const closeStaleShiftsForUser = (userId, now = Date.now()) => closeRows(userId, now);
/** Scheduler pass for everyone, so reports stay correct even if nobody opens the app. */
export const closeAllStaleShifts = (now = Date.now()) => closeRows(null, now);
