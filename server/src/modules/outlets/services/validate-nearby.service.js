import { getDynamicConfig } from '../../config/config.service.js';
import { invalidateOutletCache } from './outlets.helpers.js';
/** validateNearby - single-responsibility service (extracted from outlet-validation.service.js). */
import { prisma } from '../../../config/prisma.js';
import { config } from '../../../config/index.js';
import { AppError } from '../../../utils/errors.js';
import { runNearbySearch } from './outlet-validation.helpers.js';
import { scoreNearbySearch } from './score-nearby-search.service.js';

// ─── Separate Nearby Search Validation ──────────────────────────────────────

/**
 * Run Nearby Search separately and append the results to the outlet's validationDetails.
 */
export const validateNearby = async (outletId) => {
  const outlet = await prisma.outlet.findUnique({ where: { id: outletId } });
  if (!outlet || outlet.deletedAt) throw new AppError('Outlet tidak ditemukan',404);

  const apiKey = await getDynamicConfig('MAPS_API_KEY','') || config.googleMapsApiKey;
  if (!apiKey) throw new AppError('Konfigurasi Google Maps API Key tidak ditemukan',400);

  const lat = outlet.latitude;
  const lng = outlet.longitude;

  if (lat == null || lng == null) {
    throw new AppError('Koordinat outlet tidak tersedia untuk Nearby Search',400);
  }

  const nearbyResult = await runNearbySearch(lat, lng, apiKey,await getDynamicConfig('VALIDATION_NEARBY_RADIUS_METERS',200));
  if (!nearbyResult.success && !['ZERO_RESULTS','NO_RESULTS'].includes(nearbyResult.error)) throw new AppError('Layanan peta tidak tersedia. Data tidak diubah.',503);
  const scoredNearby = scoreNearbySearch(nearbyResult, outlet);

  let currentDetails = outlet.validationDetails || {};
  if (typeof currentDetails === 'string') {
    try {
      currentDetails = JSON.parse(currentDetails);
    } catch {
      currentDetails = {};
    }
  }

  currentDetails.nearbySearch = {
    ...scoredNearby,
    placesList: nearbyResult.places || [],
  };

  const updatedOutlet = await prisma.outlet.update({
    where: { id: outletId,updatedAt:outlet.updatedAt },
    data: {
      validationDetails: currentDetails,
    },
  });

  invalidateOutletCache();
  return {
    nearbySearch: currentDetails.nearbySearch,
    updatedOutlet,
  };
};
