/** calculateNameSimilarity - single-responsibility service (extracted from outlet-validation.service.js). */
import { phoneticIndonesianNormalize, jaroWinklerSimilarity, tokenOverlapSimilarity } from './outlet-validation.helpers.js';
import { normalizeIndonesianStoreName } from './normalize-indonesian-store-name.service.js';

/**
 * Combined name similarity with phonetic, number, and typo tolerance.
 * Both inputs are normalized, prefix-stripped, and checked for Indonesian variations.
 */
export const calculateNameSimilarity = (name1, name2) => {
  const n1 = normalizeIndonesianStoreName(name1);
  const n2 = normalizeIndonesianStoreName(name2);

  if (!n1 || !n2) return 0;
  if (n1 === n2) return 1.0;

  // Direct calculation
  const jwDirect = jaroWinklerSimilarity(n1, n2);
  const toDirect = tokenOverlapSimilarity(n1, n2);
  const directScore = jwDirect * 0.6 + toDirect * 0.4;

  // Phonetic calculation (handles s/z e.g. Aska vs Azka)
  const p1 = phoneticIndonesianNormalize(n1);
  const p2 = phoneticIndonesianNormalize(n2);
  const jwPhonetic = jaroWinklerSimilarity(p1, p2);
  const toPhonetic = tokenOverlapSimilarity(p1, p2);
  const phoneticScore = jwPhonetic * 0.6 + toPhonetic * 0.4;

  let bestScore = Math.max(directScore, phoneticScore);

  // Exact match after phonetic or number normalization
  if (p1 === p2 || n1 === n2) {
    bestScore = Math.max(bestScore, 0.98);
  }

  return Math.min(1.0, bestScore);
};
