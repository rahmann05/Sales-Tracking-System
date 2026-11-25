import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mileagePoint } from '../src/modules/delivery/services/vehicle-mileage-plan.service.js';
import { CONFIG_DEFAULTS } from '../../shared/config.mjs';

// Google point whose basis changed: the operational point is unusable, but the master has coordinates.
const outlet = {
  id: 'o1',
  latitude: -6.9267,
  longitude: 107.4991,
  googleLocation: { status: 'ACTIVE', basis: { name: 'lama' }, expiresAt: '2099-01-01T00:00:00Z' },
};

test('stale Google point yields no destination unless the master-outlet rule is on', () => {
  assert.equal(mileagePoint(outlet), null);
  const point = mileagePoint(outlet, undefined, { native: true });
  assert.equal(point.latitude, -6.9267);
  assert.equal(point.source, 'OUTLET_MASTER');
  assert.equal(point.googleMapsOnly, false);
});

test('a valid operational or order point is never replaced by the fallback', () => {
  const plain = { id: 'o2', latitude: -6.9, longitude: 107.5 };
  assert.equal(mileagePoint(plain).latitude, -6.9);
  const order = { outletId: 'o1', latitude: -6.1, longitude: 107.1 };
  assert.equal(mileagePoint(outlet, order, { native: true }).latitude, -6.1);
  assert.equal(mileagePoint({ id: 'o3' }, undefined, { native: true }), null);
});

test('both delivery planning rules default to on and are editable settings', () => {
  assert.equal(CONFIG_DEFAULTS.DELIVERY_AUTO_SELECT_LOADS, true);
  assert.equal(CONFIG_DEFAULTS.DELIVERY_DESTINATION_FROM_OUTLET, true);
});
