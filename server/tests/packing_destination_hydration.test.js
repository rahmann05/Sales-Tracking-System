import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withPackingDestinations } from '../src/modules/delivery/services/packing-destination.service.js';

test('withPackingDestinations hydrates missing outlet info and point on v2 vehicle loads', async () => {
  const outletRow = {
    id: 'outlet-1',
    name: 'Toko Jaya',
    address: 'Jl. Kopo No. 12',
    outletCode: 'BFI001',
    latitude: -6.945,
    longitude: 107.588,
    googleLocation: null,
  };

  const mockDb = {
    order: {
      findMany: async () => [{ id: 'ord-1', customerSnapshot: { name: 'Toko Jaya' } }],
    },
    outlet: {
      findMany: async ({ where }) => {
        assert.deepEqual(where.id.in, ['outlet-1']);
        return [outletRow];
      },
    },
  };

  const v2Packing = {
    id: 'pl-v2',
    code: 'BF-PL-004',
    loadPlanVersion: 2,
    outletId: 'outlet-1',
    sourceOrderIds: ['ord-1'],
    destinations: [
      {
        id: 'dest-1',
        outletId: 'outlet-1',
        sourceOrderIds: ['ord-1'],
        totalCartons: 4,
        totalWeight: 20,
      },
    ],
    items: [{ destinationId: 'dest-1', sku: 'BF-01', name: 'Nugget', unit: 'pak', quantity: 4 }],
  };

  const [hydrated] = await withPackingDestinations([v2Packing], mockDb);

  assert.equal(hydrated.destinations[0].outlet.name, 'Toko Jaya');
  assert.equal(hydrated.destinations[0].point.latitude, -6.945);
  assert.equal(hydrated.destinations[0].point.longitude, 107.588);
  assert.equal(hydrated.destinationsReady, true);
});
