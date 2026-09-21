/** extractAdminAreas - single-responsibility service (extracted from outlet-validation.service.js). */
import { ADDRESS_NOISE_WORDS } from './outlet-validation.helpers.js';

/**
 * Extract administrative area components from Google Geocode results
 */
export const extractAdminAreas = (addressComponents = [], formattedAddress = '') => {
  const areas = {
    cityOrRegency: '',
    subdistrict: '',
    province: '',
    postalCode: '',
    tokens: new Set(),
  };

  if (Array.isArray(addressComponents)) {
    for (const comp of addressComponents) {
      const types = comp.types || [];
      const longName = comp.long_name || comp.short_name || '';

      if (types.includes('administrative_area_level_2')) {
        areas.cityOrRegency = longName;
      } else if (types.includes('administrative_area_level_3') || types.includes('locality')) {
        areas.subdistrict = longName;
      } else if (types.includes('administrative_area_level_1')) {
        areas.province = longName;
      } else if (types.includes('postal_code')) {
        areas.postalCode = longName;
      }
    }
  }

  const rawText = `${formattedAddress} ${areas.cityOrRegency} ${areas.subdistrict} ${areas.province}`.toLowerCase();
  const cleaned = rawText
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  cleaned.split(' ').filter((t) => t.length >= 3 && !ADDRESS_NOISE_WORDS.has(t)).forEach((t) => areas.tokens.add(t));

  return areas;
};
