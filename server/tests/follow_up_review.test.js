import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/config/prisma.js';
import {
  completeFollowUp,
  reviewFollowUp,
} from '../src/modules/staff-attendance/follow-up.service.js';
import { paginateAttention } from '../../shared/attention-queue.mjs';
import { useDefaultPolicy } from './helpers/config-fixture.js';

useDefaultPolicy();

const VALID_PHOTO =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const ON_SITE_EVIDENCE = {
  photoUrl: VALID_PHOTO,
  latitude: -6.9,
  longitude: 107.6,
};

function fixture(t) {
  const record = {
    id: 'task',
    userId: 'spv',
    kind: 'VISIT',
    activityKey: 'stop-1',
    followUp: { status: 'OPEN', ownerId: 'sales', dueDate: '2026-10-01', history: [] },
  };
  const people = [
    { id: 'sales', role: 'SALES', supervisorId: 'spv', email: 'sales@test.local' },
    { id: 'spv', role: 'SUPERVISOR', email: 'spv@test.local' },
    { id: 'admin', role: 'ADMIN', email: 'admin@test.local' },
    { id: 'other', role: 'ADMIN', email: 'other@test.local' },
  ];
  const original = prisma.$transaction;
  prisma.$transaction = async (work) =>
    work({
      $executeRaw: async () => {},
      systemConfig: { findMany: async () => [] },
      notification: { createMany: async () => ({ count: 1 }) },
      outletUnlockRequest: { findMany: async () => [] },
      pjpStop: {
        findUnique: async () => ({
          id: 'stop-1',
          outlet: {
            id: 'outlet-1',
            name: 'Toko Test',
            latitude: -6.9,
            longitude: 107.6,
            radiusMeters: 50,
          },
        }),
      },
      user: {
        findFirst: async () => people[0],
        findMany: async () => people,
        findUnique: async ({ where }) => people.find((p) => p.id === where.id) || people[0],
      },
      staffActivity: {
        findFirst: async () => record,
        update: async ({ data }) => {
          record.followUp = data.followUp;
          return structuredClone(record);
        },
      },
    });
  t.after(() => {
    prisma.$transaction = original;
  });
  return record;
}

test('sending evidence does not complete a task until a different reviewer accepts', async (t) => {
  const record = fixture(t);
  const result = await completeFollowUp('task', { id: 'sales', role: 'SALES' }, {
    note: 'Hasil lengkap',
    evidence: 'Referensi komunikasi',
    ...ON_SITE_EVIDENCE,
  });
  assert.equal(result.followUp.status, 'SUBMITTED');
  assert.equal(result.followUp.completedAt, undefined);
  assert.equal(result.followUp.submission.photoUrl, VALID_PHOTO);
  assert.equal(result.followUp.submission.deviationMeters, 0);
  assert.equal(result.followUp.submission.targetOutletId, 'outlet-1');
  const done = await reviewFollowUp(
    'task',
    { id: 'spv', role: 'SUPERVISOR' },
    { decision: 'ACCEPT', note: 'Bukti diperiksa', submissionId: result.followUp.submission.id }
  );
  assert.equal(done.followUp.status, 'DONE');
  assert.equal(done.followUp.completedBy, 'spv');
  assert.equal(record.followUp.history.length, 2);
});

test('submission requires camera photo, GPS, on-site radius, and matching PIC', async (t) => {
  fixture(t);
  await assert.rejects(
    () =>
      completeFollowUp('task', { id: 'sales', role: 'SALES' }, {
        note: 'Hasil',
        latitude: -6.9,
        longitude: 107.6,
      }),
    (e) => e.statusCode === 422
  );
  await assert.rejects(
    () =>
      completeFollowUp('task', { id: 'sales', role: 'SALES' }, {
        note: 'Hasil',
        photoUrl: VALID_PHOTO,
      }),
    (e) => e.statusCode === 422
  );
  await assert.rejects(
    () =>
      completeFollowUp('task', { id: 'sales', role: 'SALES' }, {
        note: 'Hasil',
        photoUrl: VALID_PHOTO,
        latitude: -6.91,
        longitude: 107.61,
      }),
    (e) => e.statusCode === 422 && /luar radius/i.test(e.message)
  );
  await assert.rejects(
    () =>
      completeFollowUp('task', { id: 'spv', role: 'SUPERVISOR' }, {
        note: 'Hasil',
        evidence: 'Bukti',
        ...ON_SITE_EVIDENCE,
      }),
    (e) => e.statusCode === 403
  );
});

test('review returns preserve earlier evidence and reject decisions for stale submissions', async (t) => {
  fixture(t);
  const first = await completeFollowUp('task', { id: 'sales', role: 'SALES' }, {
    note: 'Hasil awal',
    evidence: 'Bukti awal',
    ...ON_SITE_EVIDENCE,
  });
  const returned = await reviewFollowUp(
    'task',
    { id: 'spv', role: 'SUPERVISOR' },
    { decision: 'RETURN', note: 'Lengkapi tanggal', submissionId: first.followUp.submission.id }
  );
  assert.equal(returned.followUp.status, 'OPEN');
  assert.equal(returned.followUp.submission.evidence, 'Bukti awal');
  const second = await completeFollowUp('task', { id: 'sales', role: 'SALES' }, {
    note: 'Hasil baru',
    evidence: 'Bukti baru',
    ...ON_SITE_EVIDENCE,
  });
  assert.notEqual(first.followUp.submission.id, second.followUp.submission.id);
  await assert.rejects(
    () =>
      reviewFollowUp(
        'task',
        { id: 'spv', role: 'SUPERVISOR' },
        { decision: 'ACCEPT', note: 'Stale', submissionId: first.followUp.submission.id }
      ),
    (e) => e.statusCode === 409
  );
});

test('even an Admin cannot approve their own result and a review requires a reason', async (t) => {
  const record = fixture(t);
  record.followUp.ownerId = 'admin';
  const result = await completeFollowUp('task', { id: 'admin', role: 'ADMIN' }, {
    note: 'Hasil',
    evidence: 'Bukti',
    ...ON_SITE_EVIDENCE,
  });
  await assert.rejects(
    () =>
      reviewFollowUp(
        'task',
        { id: 'admin', role: 'ADMIN' },
        { decision: 'ACCEPT', note: 'Self', submissionId: result.followUp.submission.id }
      ),
    (e) => e.statusCode === 403
  );
  await assert.rejects(
    () =>
      reviewFollowUp(
        'task',
        { id: 'other', role: 'ADMIN' },
        { decision: 'RETURN', note: ' ', submissionId: result.followUp.submission.id }
      ),
    (e) => e.statusCode === 400
  );
});

test('a second decision cannot overwrite an accepted review', async (t) => {
  fixture(t);
  const result = await completeFollowUp('task', { id: 'sales', role: 'SALES' }, {
    note: 'Hasil',
    evidence: 'Bukti',
    ...ON_SITE_EVIDENCE,
  });
  const request = {
    decision: 'ACCEPT',
    note: 'Diperiksa',
    submissionId: result.followUp.submission.id,
  };
  await reviewFollowUp('task', { id: 'spv', role: 'SUPERVISOR' }, request);
  await assert.rejects(
    () => reviewFollowUp('task', { id: 'spv', role: 'SUPERVISOR' }, request),
    (e) => e.statusCode === 409
  );
});

test('submitted tasks remain visible in the review queue without showing as unfinished sales work', () => {
  const result = paginateAttention(
    [
      {
        key: 'task',
        category: 'VISIT',
        status: 'SUBMITTED',
        dueDate: '2026-10-01',
        since: '2026-10-01',
        ownerId: 'sales',
      },
    ],
    { filter: 'REVIEW' },
    Date.parse('2026-10-08T10:00:00Z')
  );
  assert.equal(result.total, 1);
  assert.equal(result.summary.awaitingReview, 1);
  assert.equal(result.summary.overdue, 0);
});
