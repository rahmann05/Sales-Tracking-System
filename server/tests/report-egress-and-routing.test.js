import assert from 'node:assert/strict';
import test from 'node:test';
import { prisma } from '../src/config/prisma.js';
import { loadReportRecords } from '../src/modules/reports/services/report-records.service.js';
import { invalidateConfigCache } from '../src/modules/config/services/dynamic-config.service.js';
import { clearRoadRouteCache, resolveRoadRoute } from '../src/modules/routing/routing.service.js';

test('loadReportRecords selects operational fields while excluding photoUrl Base64 blobs', async (t) => {
  const origPjp = prisma.pjp.findMany;
  const origOff = prisma.offPjpAttendance.findMany;
  const seen = {};
  prisma.pjp.findMany = async (args) => {
    seen.pjpSelect = args.select;
    return [];
  };
  prisma.offPjpAttendance.findMany = async (args) => {
    seen.offSelect = args.select;
    return [];
  };
  t.after(() => {
    prisma.pjp.findMany = origPjp;
    prisma.offPjpAttendance.findMany = origOff;
  });

  await loadReportRecords(new Date('2026-10-01T00:00:00Z'), new Date('2026-10-02T00:00:00Z'));

  const attSelect = seen.pjpSelect.stops.select.attendances.select;
  assert.ok(attSelect);
  assert.equal(Object.hasOwn(attSelect, 'photoUrl'), false);
  assert.equal(Object.hasOwn(seen.offSelect, 'photoUrl'), false);
});

test('resolveRoadRoute caches repeated OSRM leg lookups and clears via clearRoadRouteCache', async (t) => {
  const origConfig = prisma.systemConfig.findMany;
  const origFetch = globalThis.fetch;
  let fetchCalls = 0;

  prisma.systemConfig.findMany = async () => [
    { key: 'ROUTING_PROVIDER', value: 'OSRM' },
    { key: 'ROUTING_ALLOW_FALLBACK', value: true },
    { key: 'FEATURE_MAPS_MODE', value: 'ACTIVE' },
  ];
  invalidateConfigCache();
  clearRoadRouteCache();

  globalThis.fetch = async () => {
    fetchCalls++;
    return {
      ok: true,
      json: async () => ({
        code: 'Ok',
        routes: [
          {
            distance: 1500,
            duration: 240,
            legs: [{ distance: 1500, duration: 240 }],
            geometry: {
              coordinates: [
                [107.6, -6.9],
                [107.61, -6.91],
              ],
            },
          },
        ],
      }),
    };
  };

  t.after(() => {
    prisma.systemConfig.findMany = origConfig;
    globalThis.fetch = origFetch;
    invalidateConfigCache();
    clearRoadRouteCache();
  });

  const points = [
    { lat: -6.9, lng: 107.6 },
    { lat: -6.91, lng: 107.61 },
  ];
  const first = await resolveRoadRoute(points);
  const second = await resolveRoadRoute(points);
  assert.equal(first.provider, 'osrm');
  assert.equal(second.provider, 'osrm');
  assert.equal(fetchCalls, 1);

  clearRoadRouteCache();
  await resolveRoadRoute(points);
  assert.equal(fetchCalls, 2);
});
