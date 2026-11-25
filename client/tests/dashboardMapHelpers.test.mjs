import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveClusterColor,
  buildClusterSequenceMap,
  filterOperationalMapScope,
  buildPjpStopLookup,
  buildNumberedPinSvg,
} from '../src/pages/Dashboard/dashboardMapHelpers.js';
import {
  chunkWaypoints,
  googleDirectionsService,
} from '../src/services/googleDirectionsService.js';

const sampleClusters = [
  {
    id: 'cl-dadan',
    name: 'GT Bandung Selatan & Kopo',
    colorHex: '#0f766e',
    assignedSalesId: 'u-dadan',
    assignedSales: { id: 'u-dadan', name: 'Dadan Ramdani' },
    users: [{ id: 'u-dadan', name: 'Dadan Ramdani' }],
    routes: [{ id: 'cr-1', isActive: true, outletOrder: ['o-dadan-1', 'o-dadan-2', 'o-dadan-3'] }],
  },
  {
    id: 'cl-cahya',
    name: 'GT Cimahi & Bandung Barat',
    colorHex: '#1b66ca',
    assignedSalesId: 'u-cahya',
    assignedSales: { id: 'u-cahya', name: 'Cahya Pratama' },
    users: [{ id: 'u-cahya', name: 'Cahya Pratama' }],
    routes: [
      {
        id: 'cr-2',
        isActive: true,
        outletOrder: [{ id: 'o-cahya-1', sequence: 4 }, { outletId: 'o-cahya-2', sequence: 5 }],
      },
    ],
  },
];

const sampleOutlets = [
  { id: 'o-dadan-1', name: 'Warung Baim', outletCode: 'BFI-D1', clusterId: 'cl-dadan', latitude: -6.94, longitude: 107.61 },
  { id: 'o-dadan-2', name: 'Toko Anugrah', outletCode: 'BFI-D2', clusterId: 'cl-dadan', latitude: -6.95, longitude: 107.62 },
  { id: 'o-cahya-1', name: '3 Mart', outletCode: 'BFI-C1', clusterId: 'cl-cahya', latitude: -6.88, longitude: 107.54 },
];

const sampleRoutes = [
  {
    id: 'pjp-dadan',
    salesId: 'u-dadan',
    repName: 'Dadan Ramdani',
    clusterId: 'cl-dadan',
    clusterIds: ['cl-dadan'],
    clusterName: 'GT Bandung Selatan & Kopo',
    stops: [
      { id: 'st-2', outletId: 'o-dadan-2', outletCode: 'BFI-D2', clusterId: 'cl-dadan', sequence: 2, status: 'PENDING', latitude: -6.95, longitude: 107.62 },
      { id: 'st-1', outletId: 'o-dadan-1', outletCode: 'BFI-D1', clusterId: 'cl-dadan', sequence: 1, status: 'VISITED', latitude: -6.94, longitude: 107.61 },
    ],
  },
  {
    id: 'pjp-cahya',
    salesId: 'u-cahya',
    repName: 'Cahya Pratama',
    clusterId: 'cl-cahya',
    clusterIds: ['cl-cahya'],
    clusterName: 'GT Cimahi & Bandung Barat',
    stops: [
      { id: 'st-c1', outletId: 'o-cahya-1', outletCode: 'BFI-C1', clusterId: 'cl-cahya', sequence: 1, status: 'PENDING', latitude: -6.88, longitude: 107.54 },
    ],
  },
];

test('filterOperationalMapScope isolates map to selected salesman and hides unrelated clusters/outlets', () => {
  const allScope = filterOperationalMapScope({
    outlets: sampleOutlets,
    clusters: sampleClusters,
    routes: sampleRoutes,
    selectedSalesName: 'ALL',
    selectedRoute: null,
  });
  assert.equal(allScope.isFiltered, false);
  assert.equal(allScope.visibleClusters.length, 2);
  assert.equal(allScope.visibleOutlets.length, 3);

  const dadanScope = filterOperationalMapScope({
    outlets: sampleOutlets,
    clusters: sampleClusters,
    routes: sampleRoutes,
    selectedSalesName: 'Dadan Ramdani',
    selectedRoute: null,
  });
  assert.equal(dadanScope.isFiltered, true);
  assert.deepEqual(
    dadanScope.visibleClusters.map((c) => c.id),
    ['cl-dadan']
  );
  assert.deepEqual(
    dadanScope.visibleOutlets.map((o) => o.id),
    ['o-dadan-1', 'o-dadan-2']
  );

  const cahyaRouteScope = filterOperationalMapScope({
    outlets: sampleOutlets,
    clusters: sampleClusters,
    routes: sampleRoutes,
    selectedSalesName: 'ALL',
    selectedRoute: sampleRoutes[1],
  });
  assert.equal(cahyaRouteScope.isFiltered, true);
  assert.deepEqual(
    cahyaRouteScope.visibleClusters.map((c) => c.id),
    ['cl-cahya']
  );
  assert.deepEqual(
    cahyaRouteScope.visibleOutlets.map((o) => o.id),
    ['o-cahya-1']
  );
});

test('buildClusterSequenceMap supports string[] and object[] ClusterRoute.outletOrder and omits missing', () => {
  const seqMap = buildClusterSequenceMap([
    ...sampleClusters,
    { id: 'cl-empty', name: 'Empty Cluster', routes: [] },
  ]);
  assert.equal(seqMap.get('o-dadan-1')?.sequence, 1);
  assert.equal(seqMap.get('o-dadan-2')?.sequence, 2);
  assert.equal(seqMap.get('o-dadan-3')?.sequence, 3);
  assert.equal(seqMap.get('o-cahya-1')?.sequence, 4);
  assert.equal(seqMap.get('o-cahya-2')?.sequence, 5);
  assert.equal(seqMap.get('non-existent'), undefined);
});

test('resolveClusterColor uses DB colorHex consistently and falls back cleanly', () => {
  assert.equal(resolveClusterColor(sampleClusters[0]), '#0f766e');
  assert.equal(resolveClusterColor({ name: 'Test Cluster' }).startsWith('#'), true);
});

test('buildPjpStopLookup sorts stops by DB sequence ascending', () => {
  const lookup = buildPjpStopLookup([sampleRoutes[0]]);
  assert.equal(lookup.byOutletId.get('o-dadan-1')?.sequence, 1);
  assert.equal(lookup.byOutletId.get('o-dadan-2')?.sequence, 2);
});

test('buildNumberedPinSvg embeds stop sequence numbers, cluster color, and status indicator', () => {
  const pjpPin = buildNumberedPinSvg({
    color: '#0f766e',
    number: 2,
    variant: 'pjp',
    status: 'VISITED',
  });
  const decodedPjp = decodeURIComponent(pjpPin.url.split(',')[1]);
  assert.match(decodedPjp, /fill="#0f766e"/);
  assert.match(decodedPjp, />2<\/text>/);
  assert.match(decodedPjp, /fill="#16a34a"/);

  const clusterNoNum = buildNumberedPinSvg({
    color: '#1b66ca',
    number: null,
    variant: 'cluster',
  });
  const decodedCluster = decodeURIComponent(clusterNoNum.url.split(',')[1]);
  assert.doesNotMatch(decodedCluster, /<text/);
  assert.equal(clusterNoNum.anchor.x, 8);
});

test('chunkWaypoints overlaps boundary stops above 25 and resolveRoadRouteWithMeta reports fallback explicitly', async () => {
  const small = Array.from({ length: 10 }, (_, i) => ({ lat: -6.9 + i * 0.001, lng: 107.6 }));
  assert.equal(chunkWaypoints(small, 25).length, 1);

  const large = Array.from({ length: 27 }, (_, i) => ({ lat: -6.9 + i * 0.001, lng: 107.6 }));
  const chunks = chunkWaypoints(large, 25);
  assert.equal(chunks.length, 2);
  assert.equal(chunks[0].length, 25);
  assert.equal(chunks[1].length, 3);
  assert.deepEqual(chunks[0][24], chunks[1][0]);

  const fallbackRes = await googleDirectionsService.resolveRoadRouteWithMeta([
    { lat: -6.94, lng: 107.61 },
    { lat: -6.95, lng: 107.62 },
  ]);
  assert.equal(fallbackRes.isFallback, true);
  assert.equal(fallbackRes.provider, 'FALLBACK');
  assert.equal(fallbackRes.path.length, 2);
  assert.ok(fallbackRes.reason.length > 0);
});
