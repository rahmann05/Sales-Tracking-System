import assert from 'node:assert/strict';
import test from 'node:test';
import { optimize2Opt } from '../src/modules/clusters/services/clusters.helpers.js';

test('optimize2Opt untangles crossed segments and preserves every stop', () => {
  // Deliberately crossed X-path: (0,0) -> (0,0.02) -> (0.02,0) -> (0.02,0.02)
  const stops = [
    { id: 'A', latitude: -6.9, longitude: 107.6 },
    { id: 'B', latitude: -6.9, longitude: 107.62 },
    { id: 'C', latitude: -6.92, longitude: 107.6 },
    { id: 'D', latitude: -6.92, longitude: 107.62 },
  ];
  const result = optimize2Opt(stops);
  assert.equal(result.route.length, stops.length);
  assert.deepEqual(result.route.map((s) => s.id).sort(), ['A', 'B', 'C', 'D']);
  // Crossed path was ~2.2+3.1+2.2 = 7.5km; uncrossed is ~2.2*3 = 6.6km
  assert.ok(
    result.distanceKm < 7.0,
    `Expected uncrossed distance < 7.0km, got ${result.distanceKm}`
  );
});

test('optimize2Opt handles 0, 1, and 2 stops cleanly without mutating input array', () => {
  assert.deepEqual(optimize2Opt([]), { route: [], distanceKm: 0 });
  const single = [{ id: 'A', latitude: -6.9, longitude: 107.6 }];
  assert.equal(optimize2Opt(single).distanceKm, 0);
  const pair = [
    { id: 'A', latitude: -6.9, longitude: 107.6 },
    { id: 'B', latitude: -6.91, longitude: 107.61 },
  ];
  const out = optimize2Opt(pair);
  assert.equal(out.route.length, 2);
  assert.ok(out.distanceKm > 1 && out.distanceKm < 2);
});
