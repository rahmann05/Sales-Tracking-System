/** normalizeIndonesianStoreName - single-responsibility service (extracted from outlet-validation.service.js). */
import { STORE_PREFIXES } from './outlet-validation.helpers.js';
import { expandIndonesianNumbers } from './expand-indonesian-numbers.service.js';

/**
 * Normalize Indonesian store names for comparison.
 * Strips common prefixes, punctuation, extra whitespace, splits merged words (e.g. tigamart -> tiga mart).
 */
export const normalizeIndonesianStoreName = (name) => {
  if (!name || typeof name !== 'string') return '';

  let normalized = name.toLowerCase().trim();

  // Remove punctuation except alphanumeric and spaces
  normalized = normalized.replace(/[^\w\s]/gi, ' ');

  // Split common fused store suffixes (e.g. tigamart -> tiga mart, alfath -> al fath)
  normalized = normalized
    .replace(/(\w+)(mart|toserba|swalayan|grosir|kios|warung|shop|store)\b/gi, '$1 $2')
    .replace(/\bal\s*fath\b/gi, 'al fath')
    .replace(/\balfath\b/gi, 'al fath');

  // Strip known store prefixes
  for (const prefix of STORE_PREFIXES) {
    if (normalized.startsWith(prefix)) {
      normalized = normalized.slice(prefix.length).trim();
      break;
    }
  }

  // Expand numbers (e.g. "3 mart" -> "tiga mart")
  normalized = expandIndonesianNumbers(normalized);

  // Collapse multiple spaces
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized;
};
