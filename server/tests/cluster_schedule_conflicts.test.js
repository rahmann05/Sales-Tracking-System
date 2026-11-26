import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clusterScheduleConflicts } from '../../shared/cluster-schedule-conflicts.mjs';
import { CONFIG_DEFAULTS } from '../../shared/config.mjs';

const stop = (outletId, userId, date, name = userId) => ({
  outletId,
  outletName: 'Toko ' + outletId,
  pjp: {
    id: outletId + date + userId,
    code: 'PJP-' + date,
    date: date + 'T00:00:00+07:00',
    userId,
    user: { name },
  },
});

test('a move is clean when every future date already belongs to the new owner', () => {
  assert.deepEqual(
    clusterScheduleConflicts({
      destinationSalesId: 'cahya',
      stops: [stop('o1', 'cahya', '2026-12-01'), stop('o1', 'cahya', '2026-12-08')],
    }),
    []
  );
});

test('future PJP and weekly templates of another Sales collide, with their dates', () => {
  const result = clusterScheduleConflicts({
    destinationSalesId: 'cahya',
    stops: [stop('o1', 'yuli', '2026-12-01', 'Yulianti')],
    templates: [
      {
        outletId: 'o1',
        outletName: 'Toko o1',
        userId: 'yuli',
        salesName: 'Yulianti',
        dayOfWeek: 2,
        weekType: 'ALL',
      },
    ],
  });
  assert.deepEqual(result.map((c) => c.kind).sort(), [
    'OTHER_SALES_SCHEDULED',
    'TEMPLATE_OTHER_SALES',
  ]);
  assert.equal(result.find((c) => c.kind === 'OTHER_SALES_SCHEDULED').date, '2026-12-01');
});

test('the same outlet booked for two Sales on one date is double booking, and unassigning collides too', () => {
  const stops = [stop('o1', 'cahya', '2026-12-01'), stop('o1', 'yuli', '2026-12-01')];
  const result = clusterScheduleConflicts({ destinationSalesId: 'cahya', stops });
  assert.ok(result.some((c) => c.kind === 'DOUBLE_BOOKED'));
  assert.equal(
    clusterScheduleConflicts({
      destinationSalesId: null,
      stops: [stop('o2', 'cahya', '2026-12-02')],
    }).length,
    1
  );
});

test('scheduling conflicts block cluster moves by default and the rule is editable', () => {
  assert.equal(CONFIG_DEFAULTS.CLUSTER_ALLOW_SCHEDULE_CONFLICT, false);
});
