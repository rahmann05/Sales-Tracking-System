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
  if (!outlet) throw new AppError(404, 'Outlet tidak ditemukan');

  const apiKey = config.googleMapsApiKey;
  if (!apiKey) throw new AppError(500, 'Konfigurasi Google Maps API Key tidak ditemukan');

  const lat = outlet.googleSuggestedLat ?? outlet.latitude;
  const lng = outlet.googleSuggestedLng ?? outlet.longitude;

  if (lat == null || lng == null) {
    throw new AppError(400, 'Koordinat outlet tidak tersedia untuk Nearby Search');
  }

  const nearbyResult = await runNearbySearch(lat, lng, apiKey);
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
    where: { id: outletId },
    data: {
      validationDetails: currentDetails,
    },
  });

  return {
    nearbySearch: currentDetails.nearbySearch,
    updatedOutlet,
  };
};
