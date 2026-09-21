/** cleanAddressForSearch - single-responsibility service (extracted from outlet-validation.service.js). */
import { extractAddressTokens } from './outlet-validation.helpers.js';

/**
 * Clean and enrich raw address for forward geocoding & search (strips RT/RW noise, enriches with anchor)
 */
export const cleanAddressForSearch = (rawAddress, adminAnchor = null) => {
  if (!rawAddress || typeof rawAddress !== 'string') return '';

  let cleaned = rawAddress
    .replace(/rt\s*[\/\.]?\s*rw\s*[\d\s\-\.\/]+/gi, '')
    .replace(/rt\s*[\d]+/gi, '')
    .replace(/rw\s*[\d]+/gi, '')
    .replace(/[^\w\s\.\,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Only append anchor if address is sparse/short (e.g. only street without district)
  const addrTokens = extractAddressTokens(cleaned);
  const hasSubdistrict = adminAnchor?.subdistrict && cleaned.toLowerCase().includes(adminAnchor.subdistrict.toLowerCase());
  const hasCity = adminAnchor?.cityOrRegency && cleaned.toLowerCase().includes(adminAnchor.cityOrRegency.toLowerCase());

  if (addrTokens.size < 3) {
    if (adminAnchor?.subdistrict && !hasSubdistrict) {
      cleaned = `${cleaned}, ${adminAnchor.subdistrict}`;
    }
    if (adminAnchor?.cityOrRegency && !hasCity) {
      cleaned = `${cleaned}, ${adminAnchor.cityOrRegency}`;
    }
  }

  return cleaned;
};
