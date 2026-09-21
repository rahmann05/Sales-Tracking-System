/** scoreForwardGeocode - single-responsibility service (extracted from outlet-validation.service.js). */
import { calculateDistanceMeters } from '../../../utils/geolocation.js';

/**
 * Score Signal 2: Forward Geocode → compare coordinates with strict distance penalties
 */
export const scoreForwardGeocode = (result, outlet) => {
  if (!result.success) return { score: 0, details: { error: result.error } };

  const hasCoords = outlet.latitude != null && outlet.longitude != null;

  if (!hasCoords) {
    return {
      score: 50,
      details: {
        googleLat: result.lat,
        googleLng: result.lng,
        googleAddress: result.formattedAddress,
        note: 'Koordinat outlet kosong - menggunakan saran titik Google',
        suggestedLat: result.lat,
        suggestedLng: result.lng,
      },
    };
  }

  const distance = calculateDistanceMeters(outlet.latitude, outlet.longitude, result.lat, result.lng);
  let score;

  if (distance <= 50) score = 100;
  else if (distance <= 100) score = 90;
  else if (distance <= 250) score = 80;
  else if (distance <= 500) score = 65;
  else if (distance <= 1000) score = 40;
  else if (distance <= 2000) score = 20;
  else if (distance <= 5000) score = 5;
  else score = 0;

  return {
    score,
    details: {
      googleLat: result.lat,
      googleLng: result.lng,
      distanceMeters: Math.round(distance),
      googleAddress: result.formattedAddress,
      outOfBounds: distance > 5000,
    },
  };
};
