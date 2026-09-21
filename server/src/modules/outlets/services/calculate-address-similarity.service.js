/** calculateAddressSimilarity - single-responsibility service (extracted from outlet-validation.service.js). */
import { extractAddressTokens } from './outlet-validation.helpers.js';

/**
 * Compare address strings by extracting specific location tokens and checking containment.
 */
export const calculateAddressSimilarity = (addr1, addr2) => {
  if (!addr1 || !addr2) return 0;

  const tokens1 = extractAddressTokens(addr1);
  const tokens2 = extractAddressTokens(addr2);

  if (tokens1.size === 0 || tokens2.size === 0) return 0;

  // Separate alpha words (e.g. nyenyerean, marga, cikole) vs numbers (e.g. 157, 331)
  const alphaTokens1 = Array.from(tokens1).filter((t) => !/^\d+$/.test(t));
  const alphaTokens2 = Array.from(tokens2).filter((t) => !/^\d+$/.test(t));

  let alphaMatches = 0;
  for (const t of alphaTokens1) {
    if (tokens2.has(t)) {
      alphaMatches++;
    } else {
      for (const t2 of tokens2) {
        if (t.length >= 4 && (t2.includes(t) || t.includes(t2))) {
          alphaMatches += 0.8;
          break;
        }
      }
    }
  }

  let totalMatches = 0;
  for (const t of tokens1) {
    if (tokens2.has(t)) {
      totalMatches++;
    } else {
      for (const t2 of tokens2) {
        if (t.length >= 4 && (t2.includes(t) || t.includes(t2))) {
          totalMatches += 0.8;
          break;
        }
      }
    }
  }

  if (totalMatches === 0 && alphaMatches === 0) return 0;

  const alphaCoverage = alphaTokens1.length > 0 ? alphaMatches / alphaTokens1.length : 0;
  const totalCoverage = totalMatches / tokens1.size;
  const jaccard = totalMatches / new Set([...tokens1, ...tokens2]).size;

  // Distinctive alpha token match (e.g. matching kampung/street name) carries major weight
  const score = alphaTokens1.length > 0
    ? alphaCoverage * 0.65 + totalCoverage * 0.20 + jaccard * 0.15
    : totalCoverage * 0.70 + jaccard * 0.30;

  return Math.min(1.0, score);
};
