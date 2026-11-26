import test from 'node:test';
import assert from 'node:assert/strict';
import {
  planDates,
  ruleDue,
  buildPlanCalendar,
  validPlanDate,
  ruleSalesAt,
  pickDefaultSupervisorId,
  buildClusterDraftRules,
  selectFallbackClusterOutlets,
} from '../../shared/pjp-planning.mjs';
import { parseSpreadsheetCsv } from '../../client/src/services/spreadsheetImportService.js';
import { mapSalesPjpStops } from '../../client/src/context/hooks/mapSalesPjpStops.js';
import { isPjpProtectedFromCancel } from '../src/modules/pjp/services/cancel-published-plan.service.js';
const sales = [
  { id: 'a', name: 'Sales A', supervisorId: 's' },
  { id: 'b', name: 'Sales B', supervisorId: 's' },
];
const outlets = [
  {
    id: 'o',
    name: 'Outlet',
    itineraryCode: 'F2',
    cluster: { supervisorId: 's', assignedSalesId: 'a' },
  },
];
const rule = { userId: 'a', outletId: 'o', intervalWeeks: 2, anchorDate: '2026-10-05' };
const plan = { startsOn: '2026-10-01', endsOn: '2026-11-01', rules: [rule] };
test('temporary substitution keeps original cadence, covers inclusive dates and returns to primary', () => {
  const r = {
    ...rule,
    intervalWeeks: 1,
    substitute: {
      userId: 'b',
      startsOn: '2026-10-12',
      endsOn: '2026-10-19',
      reason: 'Sales utama cuti',
    },
  };
  const result = buildPlanCalendar({ ...plan, rules: [r] }, sales, outlets, undefined, {
    PJP_ALLOW_TEMPORARY_SUBSTITUTION: true,
  });
  assert.deepEqual(
    result.problems.filter((p) => p.code.startsWith('SUBSTITUTE')),
    []
  );
  assert.equal(ruleSalesAt(r, '2026-10-05'), 'a');
  assert.equal(ruleSalesAt(r, '2026-10-12'), 'b');
  assert.equal(ruleSalesAt(r, '2026-10-19'), 'b');
  assert.equal(ruleSalesAt(r, '2026-10-26'), 'a');
  assert.deepEqual(
    result.days.filter((d) => d.outletIds.length).map((d) => [d.date, d.userId]),
    [
      ['2026-10-05', 'a'],
      ['2026-10-12', 'b'],
      ['2026-10-19', 'b'],
      ['2026-10-26', 'a'],
    ]
  );
  assert.equal(
    result.days.find((d) => d.date === '2026-10-12' && d.userId === 'a').outletIds.length,
    0
  );
});
test('temporary substitute rejects disabled policy, foreign team, invalid period and missing reason', () => {
  const r = {
    ...rule,
    substitute: { userId: 'foreign', startsOn: '2026-09-01', endsOn: '2026-10-19', reason: '' },
  };
  const result = buildPlanCalendar({ ...plan, rules: [r] }, sales, outlets, undefined, {
    PJP_REQUIRE_REASON: true,
  });
  for (const code of [
    'SUBSTITUTION_DISABLED',
    'SUBSTITUTE_UNAVAILABLE',
    'SUBSTITUTE_PERIOD',
    'SUBSTITUTE_REASON',
  ])
    assert.ok(result.problems.some((p) => p.code === code));
  const empty = {
    ...rule,
    substitute: {
      userId: 'b',
      startsOn: '2026-10-06',
      endsOn: '2026-10-10',
      reason: 'Cuti sementara',
    },
  };
  assert.ok(
    buildPlanCalendar({ ...plan, rules: [empty] }, sales, outlets, undefined, {
      PJP_ALLOW_TEMPORARY_SUBSTITUTION: true,
    }).warnings.some((w) => w.code === 'SUBSTITUTE_NOT_DUE')
  );
});
test('frequency repeats across months and years from a fixed anchor', () => {
  assert.equal(ruleDue(rule, '2026-10-05'), true);
  assert.equal(ruleDue(rule, '2026-10-12'), false);
  assert.equal(ruleDue(rule, '2026-10-19'), true);
  assert.equal(ruleDue(rule, '2026-11-02'), true);
  assert.equal(
    ruleDue({ ...rule, intervalWeeks: 4, anchorDate: '2026-12-21' }, '2027-01-18'),
    true
  );
  assert.equal(ruleDue(rule, '2026-09-21'), false);
});
test('dates reject impossible dates, inverted and excessive periods', () => {
  assert.equal(validPlanDate('2026-02-30'), false);
  assert.equal(validPlanDate('2028-02-29'), true);
  assert.throws(() => planDates('2026-11-01', '2026-10-01'));
  assert.throws(() => planDates('2026-01-01', '2026-04-01'));
  assert.equal(planDates('2026-10-01', '2026-10-01').length, 1);
});
test('calendar distinguishes not due from no rules and reports uncovered outlets', () => {
  const r = buildPlanCalendar(plan, sales, [
    ...outlets,
    { id: 'other', name: 'Other', cluster: { supervisorId: 's' } },
  ]);
  assert.equal(r.summary.visits, 2);
  assert.equal(r.days.find((d) => d.userId === 'a' && d.date === '2026-10-12').state, 'NOT_DUE');
  assert.equal(r.days.find((d) => d.userId === 'b').state, 'UNPLANNED');
  assert.equal(r.uncovered.length, 1);
});
test('conflicts are detected on real dates, including different intervals', () => {
  const r = buildPlanCalendar(
    {
      ...plan,
      rules: [rule, { ...rule, userId: 'b', intervalWeeks: 1, reason: 'Kunjungan pengganti' }],
    },
    sales,
    outlets
  );
  assert.ok(r.problems.some((p) => p.code === 'DUPLICATE_VISIT' && p.date === '2026-10-05'));
});
test('moved, missing and non-working assignments block publication instead of disappearing', () => {
  const r = buildPlanCalendar(
    {
      ...plan,
      rules: [rule, { ...rule, outletId: 'missing' }, { ...rule, anchorDate: '2026-10-04' }],
    },
    sales,
    [{ ...outlets[0], cluster: { supervisorId: 'other' } }]
  );
  assert.ok(r.problems.some((p) => p.code === 'TEAM_MISMATCH'));
  assert.ok(r.problems.some((p) => p.code === 'OUTLET_UNAVAILABLE'));
  assert.ok(r.problems.some((p) => p.code === 'NON_WORKING_DAY'));
});
test('substitution and frequency changes require a business reason', () => {
  const r = buildPlanCalendar(
    { ...plan, rules: [{ ...rule, userId: 'b', intervalWeeks: 4 }] },
    sales,
    outlets,
    undefined,
    { PJP_REQUIRE_REASON: true }
  );
  assert.ok(r.problems.some((p) => p.code === 'OWNER_REASON'));
  assert.ok(r.problems.some((p) => p.code === 'FREQUENCY_REASON'));
  // Default: no reason is requested.
  const relaxed = buildPlanCalendar(
    { ...plan, rules: [{ ...rule, userId: 'b', intervalWeeks: 4 }] },
    sales,
    outlets
  );
  assert.ok(!relaxed.problems.some((p) => ['OWNER_REASON', 'FREQUENCY_REASON'].includes(p.code)));
});
test('CSV headers can be reordered and quoted fields preserve embedded commas', () => {
  const rows = parseSpreadsheetCsv(
    '\uFEFFOutletCode,CustomerName,ClusterName,Area,Address,Lng,Lat,Frequency\nO-1,"Toko, Jaya",Wilayah,Bandung,Alamat,107.6,-6.9,F4'
  );
  assert.equal(rows[0].customerName, 'Toko, Jaya');
  assert.equal(rows[0].latitude, -6.9);
  assert.equal(rows[0].callFrequency, 'F4');
});
test('blank CSV frequency preserves existing interval and invalid coordinates fail early', () => {
  const header = 'ClusterName,OutletCode,CustomerName,Address,Area,Lat,Lng,Frequency\n';
  assert.equal(
    parseSpreadsheetCsv(header + 'Wilayah,O-1,Toko,Alamat,Bandung,-6.9,107.6,')[0].callFrequency,
    undefined
  );
  assert.throws(
    () => parseSpreadsheetCsv(header + 'Wilayah,O-1,Toko,Alamat,Bandung,,107.6,F1'),
    /koordinat/
  );
});
test('Sales sees published interval and outlet territory rather than a guessed legacy frequency', () => {
  const stop = {
    id: 'stop',
    outletId: 'o',
    outlet: {
      id: 'o',
      name: 'Outlet',
      itineraryCode: 'F4',
      cluster: { name: 'Wilayah kedua', supervisor: { name: 'SPV' } },
    },
  };
  const route = {
    weekType: 'ALL',
    user: { cluster: { name: 'Utama' } },
    reportingContext: { planning: { rules: [{ outletId: 'o', intervalWeeks: 2 }] } },
    stops: [stop],
  };
  const mapped = mapSalesPjpStops(route, { name: 'Sales' });
  assert.equal(mapped[0].callFrequency, 'F2');
  assert.equal(mapped[0].clusterName, 'Wilayah kedua');
  assert.equal(mapped[0].supervisorName, 'SPV');
  assert.equal(
    mapSalesPjpStops({ weekType: 'ALL', stops: [{ ...stop, outlet: { name: 'Legacy' } }] }, {})[0]
      .callFrequency,
    null
  );
});
test('pickDefaultSupervisorId selects SPV team automatically for Admin and own id for Supervisor', () => {
  const spvs = [
    { id: 'spv-empty', name: 'SPV Kosong' },
    { id: 'spv-active', name: 'SPV Aktif' },
  ];
  const teamSales = [{ id: 's1', supervisorId: 'spv-active' }];
  assert.equal(
    pickDefaultSupervisorId({ role: 'ADMIN', id: 'adm' }, spvs, teamSales),
    'spv-active'
  );
  assert.equal(pickDefaultSupervisorId({ role: 'ADMIN', id: 'adm' }, spvs, []), 'spv-empty');
  assert.equal(
    pickDefaultSupervisorId({ role: 'SUPERVISOR', id: 'spv-self' }, spvs, teamSales),
    'spv-self'
  );
});
test('buildClusterDraftRules pulls outlets from assignedClusters respecting route order and weekdays', () => {
  const person = {
    id: 'sales-1',
    supervisorId: 'spv-1',
    clusterId: null,
    assignedClusters: [
      {
        id: 'c-selasa',
        name: 'Cahya - Selasa',
        routes: [{ outletOrder: ['o2', 'o1'] }],
      },
    ],
  };
  const teamOutlets = [
    {
      id: 'o1',
      clusterId: 'c-selasa',
      itineraryCode: 'F2',
      cluster: { id: 'c-selasa', name: 'Cahya - Selasa', assignedSalesId: 'sales-1' },
    },
    {
      id: 'o2',
      clusterId: 'c-selasa',
      itineraryCode: 'F4',
      cluster: { id: 'c-selasa', name: 'Cahya - Selasa', assignedSalesId: 'sales-1' },
    },
    {
      id: 'o3',
      clusterId: 'c-other',
      itineraryCode: 'F1',
      cluster: { id: 'c-other', name: 'Lainnya', assignedSalesId: 'sales-2' },
    },
  ];
  const draftRules = buildClusterDraftRules({
    person,
    shops: teamOutlets,
    existingOutletIds: [],
    startsOn: '2026-11-23', // Senin
    workingDays: [1, 2, 3, 4, 5, 6],
    allowedIntervals: [1, 2, 4],
    defaultInterval: 1,
  });
  assert.deepEqual(
    draftRules.map((r) => [r.outletId, r.anchorDate, r.intervalWeeks]),
    [
      ['o2', '2026-11-24', 4],
      ['o1', '2026-11-24', 2],
    ]
  );
});
test('selectFallbackClusterOutlets resolves multi-cluster assignedSalesId outlets even without user.clusterId', () => {
  const clusters = [
    {
      id: 'c-senin',
      name: 'Cahya - Senin',
      region: 'Bandung',
      routes: [{ outletOrder: ['o2', 'o1'] }],
      outlets: [{ id: 'o1' }, { id: 'o2' }],
    },
    {
      id: 'c-selasa',
      name: 'Cahya - Selasa',
      region: 'Bandung',
      routes: [],
      outlets: [{ id: 'o3' }],
    },
  ];
  const monday = selectFallbackClusterOutlets(clusters, null, '2026-11-23');
  assert.equal(monday.primaryCluster.id, 'c-senin');
  assert.deepEqual(monday.outletIds, ['o2', 'o1']);
  const tuesday = selectFallbackClusterOutlets(clusters, 'c-senin', '2026-11-24');
  assert.equal(tuesday.primaryCluster.id, 'c-selasa');
  assert.deepEqual(tuesday.outletIds, ['o3']);
  const nonWeekday = selectFallbackClusterOutlets(
    [
      {
        id: 'c-gen',
        name: 'Bandung Timur',
        region: 'Bandung',
        routes: [{ outletOrder: ['o10'] }],
        outlets: [{ id: 'o10' }, { id: 'o11' }],
      },
    ],
    null,
    '2026-11-24'
  );
  assert.deepEqual(nonWeekday.outletIds, ['o10', 'o11']);
});
test('buildClusterDraftRules strictly scopes to clusterId when specified and never falls back to other clusters', () => {
  const person = {
    id: 'sales-1',
    supervisorId: 'spv-1',
    clusterId: null,
    assignedClusters: [
      {
        id: 'c-senin',
        name: 'Cahya - Senin',
        routes: [{ outletOrder: ['o1'] }],
      },
      {
        id: 'c-selasa',
        name: 'Cahya - Selasa',
        routes: [{ outletOrder: ['o3', 'o2'] }],
      },
    ],
  };
  const teamOutlets = [
    {
      id: 'o1',
      clusterId: 'c-senin',
      itineraryCode: 'F1',
      cluster: { id: 'c-senin', name: 'Cahya - Senin', assignedSalesId: 'sales-1' },
    },
    {
      id: 'o2',
      clusterId: 'c-selasa',
      itineraryCode: 'F2',
      cluster: { id: 'c-selasa', name: 'Cahya - Selasa', assignedSalesId: 'sales-1' },
    },
    {
      id: 'o3',
      clusterId: 'c-selasa',
      itineraryCode: 'F4',
      cluster: { id: 'c-selasa', name: 'Cahya - Selasa', assignedSalesId: 'sales-1' },
    },
  ];
  const scoped = buildClusterDraftRules({
    person,
    shops: teamOutlets,
    clusterId: 'c-selasa',
    existingOutletIds: [],
    startsOn: '2026-11-23',
    workingDays: [1, 2, 3, 4, 5, 6],
    allowedIntervals: [1, 2, 4],
    defaultInterval: 1,
  });
  assert.deepEqual(
    scoped.map((r) => [r.outletId, r.anchorDate, r.intervalWeeks]),
    [
      ['o3', '2026-11-24', 4],
      ['o2', '2026-11-24', 2],
    ]
  );
  const emptyCluster = buildClusterDraftRules({
    person,
    shops: teamOutlets,
    clusterId: 'c-kosong',
    existingOutletIds: [],
    startsOn: '2026-11-23',
    workingDays: [1, 2, 3, 4, 5, 6],
    allowedIntervals: [1, 2, 4],
    defaultInterval: 1,
  });
  assert.deepEqual(emptyCluster, []);
});
test('isPjpProtectedFromCancel distinguishes empty today/future SCHEDULED PJPs from past or active PJPs', () => {
  const todayKey = '2026-11-26';
  const emptyFuture = {
    status: 'SCHEDULED',
    date: '2026-11-27T00:00:00.000Z',
    _count: { routeChanges: 0, derivedPjps: 0 },
    stops: [{ status: 'PENDING', _count: { attendances: 0, orders: 0, routeChanges: 0 } }],
  };
  assert.equal(isPjpProtectedFromCancel(emptyFuture, todayKey), false);
  assert.equal(
    isPjpProtectedFromCancel({ ...emptyFuture, date: '2026-11-26T05:00:00.000Z' }, todayKey),
    false
  );
  assert.equal(
    isPjpProtectedFromCancel({ ...emptyFuture, date: '2026-11-25T10:00:00.000Z' }, todayKey),
    true
  );
  assert.equal(
    isPjpProtectedFromCancel({ ...emptyFuture, status: 'IN_PROGRESS' }, todayKey),
    true
  );
  assert.equal(
    isPjpProtectedFromCancel(
      {
        ...emptyFuture,
        stops: [{ status: 'PENDING', _count: { attendances: 1, orders: 0, routeChanges: 0 } }],
      },
      todayKey
    ),
    true
  );
  assert.equal(
    isPjpProtectedFromCancel(
      {
        ...emptyFuture,
        stops: [{ status: 'PENDING', _count: { attendances: 0, orders: 1, routeChanges: 0 } }],
      },
      todayKey
    ),
    true
  );
  assert.equal(
    isPjpProtectedFromCancel(
      {
        ...emptyFuture,
        _count: { routeChanges: 1, derivedPjps: 0 },
      },
      todayKey
    ),
    true
  );
});
