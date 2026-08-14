import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateDistanceMeters } from '../src/utils/geolocation.js';

describe('Geolocation & Geofencing Unit Tests', () => {
  it('should return 0 meters for identical coordinates', () => {
    const lat = -6.8722;
    const lon = 107.5423;
    const distance = calculateDistanceMeters(lat, lon, lat, lon);
    assert.equal(Math.round(distance), 0);
  });

  it('should accurately calculate distance between two close points within 50m radius', () => {
    // Alun-alun Cimahi (-6.8722, 107.5423) vs ~30m away (-6.8724, 107.5424)
    const lat1 = -6.8722;
    const lon1 = 107.5423;
    const lat2 = -6.8724;
    const lon2 = 107.5424;

    const distance = calculateDistanceMeters(lat1, lon1, lat2, lon2);
    assert.ok(distance > 0, 'Distance must be positive');
    assert.ok(distance < 50, `Distance ${distance}m should be within 50m geofence`);
  });

  it('should correctly flag coordinates outside 50m geofence radius', () => {
    // Cimahi (-6.8722, 107.5423) vs Padalarang (-6.8375, 107.4764) ~8.2 km away
    const cimahiLat = -6.8722;
    const cimahiLng = 107.5423;
    const padalarangLat = -6.8375;
    const padalarangLng = 107.4764;

    const distance = calculateDistanceMeters(cimahiLat, cimahiLng, padalarangLat, padalarangLng);
    assert.ok(distance > 5000, `Distance ${distance}m should be greater than 5000m`);
    assert.ok(distance > 50, 'Should exceed 50m outlet radius');
  });
});
