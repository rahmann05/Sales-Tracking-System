/** scoreFindPlace - single-responsibility service (extracted from outlet-validation.service.js). */
import { calculateDistanceMeters } from '../../../utils/geolocation.js';
import { calculateNameSimilarity } from './calculate-name-similarity.service.js';

/**
 * Score Signal 3: Find Place → compare name + coordinates with locality check
 */
export const scoreFindPlace = (result, outlet) => {
  if (!result.success) return { score: 0, details: { error: result.error } };

  const nameSimilarity = calculateNameSimilarity(outlet.name, result.placeName);
  let distanceScore = 50;
  let distanceMeters = null;
  let isFarMismatch = false;

  if (outlet.latitude != null && outlet.longitude != null && result.lat != null && result.lng != null) {
    distanceMeters = calculateDistanceMeters(outlet.latitude, outlet.longitude, result.lat, result.lng);

    if (distanceMeters <= 50) distanceScore = 100;
    else if (distanceMeters <= 100) distanceScore = 90;
    else if (distanceMeters <= 250) distanceScore = 80;
    else if (distanceMeters <= 500) distanceScore = 65;
    else if (distanceMeters <= 1000) distanceScore = 40;
    else if (distanceMeters <= 2000) distanceScore = 20;
    else if (distanceMeters <= 5000) distanceScore = 5;
    else {
      distanceScore = 0;
      isFarMismatch = true;
    }
  }

  let score = isFarMismatch
    ? 0
    : Math.round(nameSimilarity * 100 * 0.6 + distanceScore * 0.4);

  if (nameSimilarity < 0.4) {
    score = Math.min(score, 20);
  }

  return {
    score,
    isFarMismatch,
    details: {
      googlePlaceName: result.placeName,
      outletName: outlet.name,
      nameSimilarity: Math.round(nameSimilarity * 100) / 100,
      distanceMeters: distanceMeters != null ? Math.round(distanceMeters) : null,
      googleLat: result.lat,
      googleLng: result.lng,
      googleAddress: result.formattedAddress,
      businessStatus: result.businessStatus,
      types: result.types,
      placeId: result.placeId,
      isFarMismatch,
      note: isFarMismatch
        ? `Tempat Google ditemukan di luar radius wajar (${Math.round((distanceMeters || 0) / 1000)}km) - Diabaikan`
        : null,
    },
  };
};
