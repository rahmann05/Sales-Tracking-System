/** scoreReverseGeocode - single-responsibility service (extracted from outlet-validation.service.js). */
import { calculateAddressSimilarity } from './calculate-address-similarity.service.js';

// ─── Signal Scoring ─────────────────────────────────────────────────────────

/**
 * Score Signal 1: Reverse Geocode → compare address & locality
 */
export const scoreReverseGeocode = (result, outlet) => {
  if (!result.success) return { score: 0, details: { error: result.error } };

  const similarity = calculateAddressSimilarity(outlet.address, result.formattedAddress);
  let score = Math.round(similarity * 100);

  if (similarity >= 0.35) {
    score = Math.max(score, 60);
  }
  if (similarity >= 0.6) {
    score = Math.max(score, 85);
  }

  return {
    score: Math.min(100, score),
    details: {
      googleAddress: result.formattedAddress,
      outletAddress: outlet.address,
      addressSimilarity: Math.round(similarity * 100) / 100,
    },
  };
};
