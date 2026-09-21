/** expandIndonesianNumbers - single-responsibility service (extracted from outlet-validation.service.js). */
import { NUMBER_WORDS_MAP } from './outlet-validation.helpers.js';

/**
 * Expand digit characters to Indonesian words (e.g. "3 Mart" -> "tiga mart")
 */
export const expandIndonesianNumbers = (str) => {
  if (!str) return '';
  return str
    .replace(/\b([0-9])\b/g, (_, d) => NUMBER_WORDS_MAP[d] || d)
    .replace(/([0-9])([a-zA-Z])/g, (_, d, l) => `${NUMBER_WORDS_MAP[d] || d} ${l}`)
    .replace(/([a-zA-Z])([0-9])/g, (_, l, d) => `${l} ${NUMBER_WORDS_MAP[d] || d}`);
};
