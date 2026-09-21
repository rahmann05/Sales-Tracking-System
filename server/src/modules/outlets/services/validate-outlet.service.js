/** validateOutlet - single-responsibility service (extracted from outlet-validation.service.js). */
import { prisma } from '../../../config/prisma.js';
import { config } from '../../../config/index.js';
import { AppError } from '../../../utils/errors.js';
import { DEFAULT_WEIGHTS, runReverseGeocode, runForwardGeocode, runFindPlace, runNearbySearch } from './outlet-validation.helpers.js';
import { normalizeIndonesianStoreName } from './normalize-indonesian-store-name.service.js';
import { extractAdminAreas } from './extract-admin-areas.service.js';
import { scoreReverseGeocode } from './score-reverse-geocode.service.js';
import { scoreForwardGeocode } from './score-forward-geocode.service.js';
import { scoreFindPlace } from './score-find-place.service.js';
import { scoreNearbySearch } from './score-nearby-search.service.js';

// ─── Main Validation Orchestrator ───────────────────────────────────────────

/**
 * Validate a single outlet using 4-signal weighted scoring with locality anchoring.
 * @param {string} outletId - UUID of the outlet to validate
 * @returns {Object} Validation result with status, confidence, and details
 */
export const validateOutlet = async (outletId) => {
  const apiKey = config.googleMapsApiKey;
  if (!apiKey) {
    throw new AppError('Google Maps API Key belum dikonfigurasi. Set GOOGLE_MAPS_API_KEY di .env', 400);
  }

  const outlet = await prisma.outlet.findUnique({
    where: { id: outletId },
    include: { cluster: { select: { id: true, name: true, region: true } } },
  });

  if (!outlet || outlet.deletedAt) {
    throw new AppError('Outlet tidak ditemukan', 404);
  }

  // Check data completeness
  const hasLatLng = outlet.latitude != null && outlet.longitude != null;
  const hasName = outlet.name && outlet.name.trim().length > 0;
  const hasAddress = outlet.address && outlet.address.trim().length > 0;

  // If absolutely no data, mark as INCOMPLETE
  if (!hasLatLng && !hasName && !hasAddress) {
    const incompleteResult = {
      validationStatus: 'INCOMPLETE',
      validationConfidence: 0,
      validatedAt: new Date(),
      validationDetails: {
        signals: {},
        overallConfidence: 0,
        warnings: ['Data outlet tidak lengkap — tidak ada nama, alamat, maupun koordinat'],
        dataCompleteness: { hasLatLng, hasName, hasAddress },
      },
    };

    await prisma.outlet.update({
      where: { id: outletId },
      data: incompleteResult,
    });

    return { ...incompleteResult, outlet };
  }

  const activeWeights = { ...DEFAULT_WEIGHTS };
  const warnings = [];

  // Step 1: Run Reverse Geocode first (if lat/lng available) to establish Ground Truth Anchor
  let reverseResult = null;
  let adminAnchor = null;
  let contextArea = outlet.cluster?.region || '';

  if (hasLatLng) {
    reverseResult = await runReverseGeocode(outlet.latitude, outlet.longitude, apiKey);
    if (reverseResult.success) {
      adminAnchor = extractAdminAreas(reverseResult.addressComponents, reverseResult.formattedAddress);
      if (adminAnchor.cityOrRegency) {
        contextArea = adminAnchor.cityOrRegency;
      }
    }
  } else {
    warnings.push('Koordinat (lat/lng) kosong — Signal Reverse Geocode di-skip');
    delete activeWeights.reverseGeocode;
  }

  // Step 2: Run Forward Geocode, Find Place, and Nearby Search concurrently with context anchoring
  const parallelCalls = {};

  if (hasAddress) {
    parallelCalls.forwardGeocode = runForwardGeocode(outlet.address, apiKey, adminAnchor);
  } else {
    warnings.push('Alamat kosong — Signal Forward Geocode di-skip');
    delete activeWeights.forwardGeocode;
  }

  if (hasName || hasAddress) {
    parallelCalls.findPlace = runFindPlace(
      hasName ? outlet.name : '',
      hasAddress ? outlet.address : '',
      apiKey,
      hasLatLng ? outlet.latitude : null,
      hasLatLng ? outlet.longitude : null,
      adminAnchor
    );
  } else {
    warnings.push('Nama dan alamat kosong — Signal Find Place di-skip');
    delete activeWeights.findPlace;
  }

  if (hasLatLng) {
    parallelCalls.nearbySearch = runNearbySearch(outlet.latitude, outlet.longitude, apiKey, 200);
  } else {
    delete activeWeights.nearbySearch;
  }

  const parallelKeys = Object.keys(parallelCalls);
  const parallelResults = await Promise.all(Object.values(parallelCalls));

  const rawResults = {};
  if (reverseResult) rawResults.reverseGeocode = reverseResult;
  parallelKeys.forEach((key, idx) => {
    rawResults[key] = parallelResults[idx];
  });

  // Step 3: Score signals
  const signalScores = {};

  if (rawResults.reverseGeocode) {
    signalScores.reverseGeocode = scoreReverseGeocode(rawResults.reverseGeocode, outlet);
  }
  if (rawResults.forwardGeocode) {
    signalScores.forwardGeocode = scoreForwardGeocode(rawResults.forwardGeocode, outlet);
  }
  if (rawResults.findPlace) {
    signalScores.findPlace = scoreFindPlace(rawResults.findPlace, outlet);
  }
  if (rawResults.nearbySearch) {
    signalScores.nearbySearch = scoreNearbySearch(rawResults.nearbySearch, outlet);
  }

  // Step 4: Handle short store name ambiguity & distant place candidates
  const normalizedName = normalizeIndonesianStoreName(outlet.name);
  const isShortName = normalizedName.length <= 4;

  if (isShortName && activeWeights.findPlace) {
    activeWeights.findPlace *= 0.5;
    if (activeWeights.reverseGeocode) activeWeights.reverseGeocode *= 1.25;
  }

  // Step 5: Adjust weighting if Find Place was discarded (out of area / no candidate)
  const findPlaceCandidateFarOrMissing =
    !signalScores.findPlace ||
    signalScores.findPlace.isFarMismatch ||
    !rawResults.findPlace?.success;

  if (findPlaceCandidateFarOrMissing && hasLatLng && signalScores.reverseGeocode?.score >= 40) {
    activeWeights.findPlace = 0.05;
    if (activeWeights.reverseGeocode) activeWeights.reverseGeocode = 0.50;
    if (activeWeights.forwardGeocode) activeWeights.forwardGeocode = 0.25;
    if (activeWeights.nearbySearch) activeWeights.nearbySearch = 0.20;
    warnings.push('Toko fisik terkonfirmasi di koordinat (profil Google Place mandiri/tidak terdaftar)');
  }

  // Step 6: Calculate weighted overall confidence
  const totalWeight = Object.values(activeWeights).reduce((sum, w) => sum + w, 0);
  let weightedSum = 0;

  for (const [key, scoreObj] of Object.entries(signalScores)) {
    weightedSum += (scoreObj.score / 100) * (activeWeights[key] || 0);
  }

  let overallConfidence = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) : 0;

  // Step 7: Distance sanity checking
  let validDistanceMeters = null;

  if (signalScores.findPlace?.details?.distanceMeters != null && !signalScores.findPlace.isFarMismatch) {
    validDistanceMeters = signalScores.findPlace.details.distanceMeters;
  } else if (signalScores.forwardGeocode?.details?.distanceMeters != null && !signalScores.forwardGeocode.details.outOfBounds) {
    validDistanceMeters = signalScores.forwardGeocode.details.distanceMeters;
  }

  if (validDistanceMeters != null) {
    if (validDistanceMeters > config.validationDistanceSuspect) {
      warnings.push(`Jarak antara koordinat outlet dan titik Google: ${validDistanceMeters}m (> ${config.validationDistanceSuspect}m)`);
    } else if (validDistanceMeters > config.validationDistanceWarning) {
      warnings.push(`Jarak antara koordinat outlet dan titik Google: ${validDistanceMeters}m (> ${config.validationDistanceWarning}m)`);
    }
  }

  // Step 8: Determine validation status
  let validationStatus;
  if (overallConfidence >= 75) validationStatus = 'VALID';
  else if (overallConfidence >= 50) validationStatus = 'LIKELY_VALID';
  else if (overallConfidence >= 30) validationStatus = 'WARNING';
  else validationStatus = 'SUSPECT';

  if (validDistanceMeters != null && validDistanceMeters > config.validationDistanceSuspect && validationStatus === 'VALID') {
    validationStatus = 'WARNING';
    warnings.push('Status disesuaikan dari VALID ke WARNING karena jarak koordinat cukup jauh');
  }

  // Step 9: Suggested coordinates extraction with strict proximity guard
  let googleSuggestedLat = null;
  let googleSuggestedLng = null;

  if (!hasLatLng) {
    if (signalScores.findPlace?.details?.googleLat != null) {
      googleSuggestedLat = signalScores.findPlace.details.googleLat;
      googleSuggestedLng = signalScores.findPlace.details.googleLng;
    } else if (signalScores.forwardGeocode?.details?.googleLat != null) {
      googleSuggestedLat = signalScores.forwardGeocode.details.googleLat;
      googleSuggestedLng = signalScores.forwardGeocode.details.googleLng;
    }
  } else {
    // If Find Place found a high-confidence matching store (name similarity >= 0.70)
    // Suggest the store's true coordinates so Ops Manager can fix misplaced GPS points!
    if (
      signalScores.findPlace?.details?.googleLat != null &&
      (signalScores.findPlace.details.nameSimilarity || 0) >= 0.70
    ) {
      googleSuggestedLat = signalScores.findPlace.details.googleLat;
      googleSuggestedLng = signalScores.findPlace.details.googleLng;
    } else if (
      signalScores.findPlace?.details?.googleLat != null &&
      !signalScores.findPlace.isFarMismatch &&
      (signalScores.findPlace.details.distanceMeters || 0) <= 1000 &&
      signalScores.findPlace.score >= 60
    ) {
      googleSuggestedLat = signalScores.findPlace.details.googleLat;
      googleSuggestedLng = signalScores.findPlace.details.googleLng;
    }
  }

  const signalDetailsForStorage = {};
  for (const [key, scoreObj] of Object.entries(signalScores)) {
    signalDetailsForStorage[key] = {
      score: scoreObj.score,
      skipped: false,
      ...scoreObj.details,
    };
  }

  for (const key of Object.keys(DEFAULT_WEIGHTS)) {
    if (!signalDetailsForStorage[key]) {
      signalDetailsForStorage[key] = { score: 0, skipped: true };
    }
  }

  const validationDetails = {
    signals: signalDetailsForStorage,
    overallConfidence,
    distanceMeters: validDistanceMeters,
    nameMatchScore: signalScores.findPlace?.details?.nameSimilarity ?? null,
    warnings,
    adminAnchor: adminAnchor ? { city: adminAnchor.cityOrRegency, subdistrict: adminAnchor.subdistrict } : null,
    dataCompleteness: { hasLatLng, hasName, hasAddress },
  };

  const updateData = {
    validationStatus,
    validationConfidence: overallConfidence,
    validatedAt: new Date(),
    validationDetails,
  };

  if (googleSuggestedLat != null) {
    updateData.googleSuggestedLat = googleSuggestedLat;
    updateData.googleSuggestedLng = googleSuggestedLng;
  }

  await prisma.outlet.update({
    where: { id: outletId },
    data: updateData,
  });

  return { ...updateData, outlet };
};
