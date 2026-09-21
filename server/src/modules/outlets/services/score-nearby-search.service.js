/** scoreNearbySearch - single-responsibility service (extracted from outlet-validation.service.js). */
import { calculateNameSimilarity } from './calculate-name-similarity.service.js';

/**
 * Score Signal 4: Nearby Search → find best name match among nearby places
 */
export const scoreNearbySearch = (result, outlet) => {
  if (!result.success || !result.places?.length) {
    return { score: 0, details: { error: result.error || 'No nearby places found' } };
  }

  let bestMatch = { similarity: 0, name: '', index: -1 };

  result.places.forEach((place, idx) => {
    const sim = calculateNameSimilarity(outlet.name, place.name);
    if (sim > bestMatch.similarity) {
      bestMatch = { similarity: sim, name: place.name, index: idx };
    }
  });

  let score;
  if (bestMatch.similarity >= 0.8) score = 100;
  else if (bestMatch.similarity >= 0.6) score = 75;
  else if (bestMatch.similarity >= 0.4) score = 50;
  else if (bestMatch.similarity >= 0.2) score = 25;
  else score = 10;

  return {
    score,
    details: {
      totalNearbyPlaces: result.places.length,
      bestMatchName: bestMatch.name || null,
      bestMatchSimilarity: Math.round(bestMatch.similarity * 100) / 100,
      nearbyPlaceNames: result.places.slice(0, 5).map((p) => p.name),
    },
  };
};
