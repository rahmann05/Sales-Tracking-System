/**
 * Outlet Validation Service (4-Signal Weighted Scoring)
 * Single Responsibility: Validate outlet data against Google APIs using
 * Reverse Geocode, Forward Geocode, Find Place, and Nearby Search signals.
 * 1 File = 1 Service
 */

import { prisma } from '../../config/prisma.js';
import { config } from '../../config/index.js';
import { calculateDistanceMeters } from '../../utils/geolocation.js';
import { AppError } from '../../utils/errors.js';
import { cacheInvalidate } from '../../utils/cacheHelper.js';
import { CACHE_KEYS } from '../../config/cache.js';
import { broadcastCacheInvalidation } from '../../config/socket.js';

// ─── Signal Weights ──────────────────────────────────────────────────────────
const WEIGHTS = {
  reverseGeocode: 0.25,
  forwardGeocode: 0.35,
  findPlace: 0.40,
};

// ─── Indonesian Store Name Prefixes to Strip ─────────────────────────────────
const STORE_PREFIXES = [
  'toko ', 'tk. ', 'tk ', 'tb. ', 'tb ', 'ud. ', 'ud ',
  'cv. ', 'cv ', 'pt. ', 'pt ', 'warung ', 'depot ', 'kios ',
  'bu ', 'bpk. ', 'bpk ', 'pak ', 'ibu ', 'hj. ', 'hj ',
  'h. ', 'h ', 'agen ', 'grosir ', 'minimarket ', 'swalayan ',
];

// ─── Name Normalization ──────────────────────────────────────────────────────

/**
 * Normalize Indonesian store names for comparison.
 * Strips common prefixes, punctuation, extra whitespace, lowercases.
 */
export const normalizeIndonesianStoreName = (name) => {
  if (!name || typeof name !== 'string') return '';

  let normalized = name.toLowerCase().trim();

  // Remove punctuation except alphanumeric and spaces
  normalized = normalized.replace(/[^\w\s]/gi, ' ');

  // Strip known store prefixes
  for (const prefix of STORE_PREFIXES) {
    if (normalized.startsWith(prefix)) {
      normalized = normalized.slice(prefix.length);
      break; // Only strip the first matching prefix
    }
  }

  // Collapse multiple spaces
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized;
};

// ─── String Similarity: Jaro-Winkler ────────────────────────────────────────

/**
 * Jaro similarity between two strings.
 */
const jaroSimilarity = (s1, s2) => {
  if (s1 === s2) return 1.0;
  if (!s1.length || !s2.length) return 0.0;

  const matchDistance = Math.max(Math.floor(Math.max(s1.length, s2.length) / 2) - 1, 0);

  const s1Matches = new Array(s1.length).fill(false);
  const s2Matches = new Array(s2.length).fill(false);

  let matches = 0;
  let transpositions = 0;

  for (let i = 0; i < s1.length; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, s2.length);

    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0.0;

  let k = 0;
  for (let i = 0; i < s1.length; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }

  return (
    (matches / s1.length + matches / s2.length + (matches - transpositions / 2) / matches) / 3
  );
};

/**
 * Jaro-Winkler similarity (adds prefix bonus to Jaro).
 */
const jaroWinklerSimilarity = (s1, s2) => {
  const jaro = jaroSimilarity(s1, s2);

  // Common prefix (up to 4 chars)
  let prefix = 0;
  for (let i = 0; i < Math.min(s1.length, s2.length, 4); i++) {
    if (s1[i] === s2[i]) prefix++;
    else break;
  }

  return jaro + prefix * 0.1 * (1 - jaro);
};

/**
 * Token overlap (Jaccard-like) similarity.
 * Compares word-level tokens between two strings.
 */
const tokenOverlapSimilarity = (s1, s2) => {
  const tokens1 = new Set(s1.split(/\s+/).filter(Boolean));
  const tokens2 = new Set(s2.split(/\s+/).filter(Boolean));

  if (tokens1.size === 0 && tokens2.size === 0) return 1.0;
  if (tokens1.size === 0 || tokens2.size === 0) return 0.0;

  let intersection = 0;
  for (const t of tokens1) {
    if (tokens2.has(t)) intersection++;
  }

  const union = new Set([...tokens1, ...tokens2]).size;
  return union > 0 ? intersection / union : 0;
};

/**
 * Combined name similarity: 60% Jaro-Winkler + 40% Token Overlap.
 * Both inputs should be pre-normalized.
 */
export const calculateNameSimilarity = (name1, name2) => {
  const n1 = normalizeIndonesianStoreName(name1);
  const n2 = normalizeIndonesianStoreName(name2);

  if (!n1 || !n2) return 0;
  if (n1 === n2) return 1.0;

  const jw = jaroWinklerSimilarity(n1, n2);
  const to = tokenOverlapSimilarity(n1, n2);

  return jw * 0.6 + to * 0.4;
};

// ─── Address Component Similarity ───────────────────────────────────────────

/**
 * Compare address strings by extracting key components.
 */
const calculateAddressSimilarity = (addr1, addr2) => {
  if (!addr1 || !addr2) return 0;

  const normalize = (s) =>
    s
      .toLowerCase()
      .replace(/jl\.|jln\.|jalan/g, '')
      .replace(/no\.|nomor/g, '')
      .replace(/rt\s*\.?\s*\d+/g, '')
      .replace(/rw\s*\.?\s*\d+/g, '')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const n1 = normalize(addr1);
  const n2 = normalize(addr2);

  return tokenOverlapSimilarity(n1, n2);
};

// ─── Google API Callers ─────────────────────────────────────────────────────

/**
 * Signal 1: Reverse Geocode (lat/lng → address)
 */
const runReverseGeocode = async (lat, lng, apiKey) => {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&language=id`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status === 'OK' && data.results?.length > 0) {
      const result = data.results[0];
      return {
        success: true,
        formattedAddress: result.formatted_address || '',
        addressComponents: result.address_components || [],
        placeId: result.place_id,
      };
    }

    return { success: false, error: data.status || 'NO_RESULTS' };
  } catch (err) {
    console.warn('[Validation] Reverse Geocode error:', err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Signal 2: Forward Geocode (address → lat/lng)
 */
const runForwardGeocode = async (address, apiKey) => {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}&language=id&region=id`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status === 'OK' && data.results?.length > 0) {
      const result = data.results[0];
      const loc = result.geometry?.location;
      return {
        success: true,
        lat: loc?.lat,
        lng: loc?.lng,
        formattedAddress: result.formatted_address || '',
        placeId: result.place_id,
      };
    }

    return { success: false, error: data.status || 'NO_RESULTS' };
  } catch (err) {
    console.warn('[Validation] Forward Geocode error:', err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Signal 3: Find Place from Text (name + address → place)
 */
const runFindPlace = async (name, address, apiKey) => {
  try {
    const input = [name, address].filter(Boolean).join(' ');
    const fields = 'name,geometry,formatted_address,place_id,business_status,types';
    const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(input)}&inputtype=textquery&fields=${fields}&key=${apiKey}&language=id&locationbias=circle:50000@-6.9,107.6`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status === 'OK' && data.candidates?.length > 0) {
      const place = data.candidates[0];
      return {
        success: true,
        placeName: place.name || '',
        lat: place.geometry?.location?.lat,
        lng: place.geometry?.location?.lng,
        formattedAddress: place.formatted_address || '',
        placeId: place.place_id,
        businessStatus: place.business_status || 'UNKNOWN',
        types: place.types || [],
      };
    }

    return { success: false, error: data.status || 'NO_CANDIDATES' };
  } catch (err) {
    console.warn('[Validation] Find Place error:', err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Signal 4: Nearby Search (lat/lng + radius → nearby places)
 */
const runNearbySearch = async (lat, lng, apiKey, radius = 150) => {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&key=${apiKey}&language=id`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status === 'OK' && data.results?.length > 0) {
      return {
        success: true,
        places: data.results.map((p) => ({
          name: p.name || '',
          lat: p.geometry?.location?.lat,
          lng: p.geometry?.location?.lng,
          types: p.types || [],
          vicinity: p.vicinity || '',
          placeId: p.place_id,
        })),
      };
    }

    return { success: false, error: data.status || 'NO_RESULTS', places: [] };
  } catch (err) {
    console.warn('[Validation] Nearby Search error:', err.message);
    return { success: false, error: err.message, places: [] };
  }
};

// ─── Signal Scoring ─────────────────────────────────────────────────────────

/**
 * Score Signal 1: Reverse Geocode → compare address
 */
const scoreReverseGeocode = (result, outlet) => {
  if (!result.success) return { score: 0, details: { error: result.error } };

  const similarity = calculateAddressSimilarity(outlet.address, result.formattedAddress);
  const score = Math.round(similarity * 100);

  return {
    score,
    details: {
      googleAddress: result.formattedAddress,
      outletAddress: outlet.address,
      addressSimilarity: Math.round(similarity * 100) / 100,
    },
  };
};

/**
 * Score Signal 2: Forward Geocode → compare coordinates
 */
const scoreForwardGeocode = (result, outlet) => {
  if (!result.success) return { score: 0, details: { error: result.error } };

  const hasCoords = outlet.latitude != null && outlet.longitude != null;

  if (!hasCoords) {
    // If outlet has no coords, we can still get a score from address matching
    return {
      score: 50, // Partial score — found a geocode result
      details: {
        googleLat: result.lat,
        googleLng: result.lng,
        googleAddress: result.formattedAddress,
        note: 'Outlet coordinates missing - using Google suggestion',
        suggestedLat: result.lat,
        suggestedLng: result.lng,
      },
    };
  }

  const distance = calculateDistanceMeters(outlet.latitude, outlet.longitude, result.lat, result.lng);
  let score;

  if (distance <= 50) score = 100;
  else if (distance <= 100) score = 90;
  else if (distance <= 200) score = 75;
  else if (distance <= 500) score = 50;
  else if (distance <= 1000) score = 25;
  else score = 10;

  return {
    score,
    details: {
      googleLat: result.lat,
      googleLng: result.lng,
      distanceMeters: Math.round(distance),
      googleAddress: result.formattedAddress,
    },
  };
};

/**
 * Score Signal 3: Find Place → compare name + coordinates
 */
const scoreFindPlace = (result, outlet) => {
  if (!result.success) return { score: 0, details: { error: result.error } };

  const nameSimilarity = calculateNameSimilarity(outlet.name, result.placeName);
  let distanceScore = 50; // Default if no coords
  let distanceMeters = null;

  if (outlet.latitude != null && outlet.longitude != null && result.lat != null && result.lng != null) {
    distanceMeters = calculateDistanceMeters(outlet.latitude, outlet.longitude, result.lat, result.lng);

    if (distanceMeters <= 50) distanceScore = 100;
    else if (distanceMeters <= 100) distanceScore = 85;
    else if (distanceMeters <= 200) distanceScore = 70;
    else if (distanceMeters <= 500) distanceScore = 40;
    else distanceScore = 10;
  }

  // Combined: 60% name match + 40% distance
  const score = Math.round(nameSimilarity * 100 * 0.6 + distanceScore * 0.4);

  return {
    score,
    details: {
      googlePlaceName: result.placeName,
      outletName: outlet.name,
      nameSimilarity: Math.round(nameSimilarity * 100) / 100,
      distanceMeters: distanceMeters != null ? Math.round(distanceMeters) : null,
      googleLat: result.lat,
      googleLng: result.lng,
      googleAddress: result.formattedAddress,
      businessStatus: result.businessStatus,
      types: result.types,
      placeId: result.placeId,
    },
  };
};

/**
 * Score Signal 4: Nearby Search → find best name match among nearby places
 */
const scoreNearbySearch = (result, outlet) => {
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
  else score = 5; // At least some places are nearby (location is real)

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

// ─── Main Validation Orchestrator ───────────────────────────────────────────

/**
 * Validate a single outlet using 4-signal weighted scoring.
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

    // NOTE: No cache invalidation here - validation metadata changes don't affect map data
    return { ...incompleteResult, outlet };
  }

  // Run applicable signals concurrently
  const signalPromises = {};
  const activeWeights = {};
  const warnings = [];

  // Signal 1: Reverse Geocode (needs lat/lng)
  if (hasLatLng) {
    signalPromises.reverseGeocode = runReverseGeocode(outlet.latitude, outlet.longitude, apiKey);
    activeWeights.reverseGeocode = WEIGHTS.reverseGeocode;
  } else {
    warnings.push('Koordinat (lat/lng) kosong — Signal Reverse Geocode di-skip');
  }

  // Signal 2: Forward Geocode (needs address)
  if (hasAddress) {
    signalPromises.forwardGeocode = runForwardGeocode(outlet.address, apiKey);
    activeWeights.forwardGeocode = WEIGHTS.forwardGeocode;
  } else {
    warnings.push('Alamat kosong — Signal Forward Geocode di-skip');
  }

  // Signal 3: Find Place from Text (needs name or address)
  if (hasName || hasAddress) {
    signalPromises.findPlace = runFindPlace(
      hasName ? outlet.name : '',
      hasAddress ? outlet.address : '',
      apiKey
    );
    activeWeights.findPlace = WEIGHTS.findPlace;
    // Reduce weight if only one of name/address is present
    if (!hasName) {
      activeWeights.findPlace *= 0.6;
      warnings.push('Nama outlet kosong — Signal Find Place menggunakan alamat saja (bobot dikurangi)');
    }
  } else {
    warnings.push('Nama dan alamat kosong — Signal Find Place di-skip');
  }

  // Await all signals concurrently
  const signalKeys = Object.keys(signalPromises);
  const signalResults = await Promise.all(Object.values(signalPromises));

  const rawResults = {};
  signalKeys.forEach((key, idx) => {
    rawResults[key] = signalResults[idx];
  });

  // Score each signal
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

  // Calculate weighted confidence score
  const totalWeight = Object.values(activeWeights).reduce((sum, w) => sum + w, 0);
  let weightedSum = 0;

  for (const [key, scoreObj] of Object.entries(signalScores)) {
    weightedSum += (scoreObj.score / 100) * (activeWeights[key] || 0);
  }

  const overallConfidence = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) : 0;

  // Determine distance warning
  let distanceMeters = null;
  if (signalScores.findPlace?.details?.distanceMeters != null) {
    distanceMeters = signalScores.findPlace.details.distanceMeters;
  } else if (signalScores.forwardGeocode?.details?.distanceMeters != null) {
    distanceMeters = signalScores.forwardGeocode.details.distanceMeters;
  }

  if (distanceMeters != null) {
    if (distanceMeters > config.validationDistanceSuspect) {
      warnings.push(`Jarak antara koordinat outlet dan Google sangat jauh: ${distanceMeters}m (> ${config.validationDistanceSuspect}m)`);
    } else if (distanceMeters > config.validationDistanceWarning) {
      warnings.push(`Jarak antara koordinat outlet dan Google cukup jauh: ${distanceMeters}m (> ${config.validationDistanceWarning}m)`);
    }
  }

  // Determine validation status
  let validationStatus;
  if (overallConfidence >= 75) validationStatus = 'VALID';
  else if (overallConfidence >= 50) validationStatus = 'LIKELY_VALID';
  else if (overallConfidence >= 30) validationStatus = 'WARNING';
  else validationStatus = 'SUSPECT';

  // Override: if distance is very far, downgrade to WARNING at most
  if (distanceMeters != null && distanceMeters > config.validationDistanceSuspect && validationStatus === 'VALID') {
    validationStatus = 'WARNING';
    warnings.push('Status diturunkan dari VALID ke WARNING karena jarak koordinat sangat jauh');
  }

  // Extract suggested coordinates (from Find Place or Forward Geocode)
  let googleSuggestedLat = null;
  let googleSuggestedLng = null;

  // Prioritize Find Place coordinates
  if (signalScores.findPlace?.details?.googleLat != null) {
    googleSuggestedLat = signalScores.findPlace.details.googleLat;
    googleSuggestedLng = signalScores.findPlace.details.googleLng;
  } else if (signalScores.forwardGeocode?.details?.googleLat != null) {
    googleSuggestedLat = signalScores.forwardGeocode.details.googleLat;
    googleSuggestedLng = signalScores.forwardGeocode.details.googleLng;
  }

  // Build signal details for storage
  const signalDetailsForStorage = {};
  for (const [key, scoreObj] of Object.entries(signalScores)) {
    signalDetailsForStorage[key] = {
      score: scoreObj.score,
      skipped: false,
      ...scoreObj.details,
    };
  }

  // Mark skipped signals
  for (const key of Object.keys(WEIGHTS)) {
    if (!signalDetailsForStorage[key]) {
      signalDetailsForStorage[key] = { score: 0, skipped: true };
    }
  }

  const validationDetails = {
    signals: signalDetailsForStorage,
    overallConfidence,
    distanceMeters,
    nameMatchScore: signalScores.findPlace?.details?.nameSimilarity ?? null,
    warnings,
    dataCompleteness: { hasLatLng, hasName, hasAddress },
  };

  // Save to database
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

  // NOTE: No cache invalidation - validation metadata doesn't affect map/cluster data

  return { ...updateData, outlet };
};

// ─── Separate Nearby Search Validation ──────────────────────────────────────

/**
 * Run Nearby Search separately and append the results to the outlet's validationDetails.
 */
export const validateNearby = async (outletId) => {
  const outlet = await prisma.outlet.findUnique({ where: { id: outletId } });
  if (!outlet) throw new AppError(404, 'Outlet tidak ditemukan');

  const apiKey = config.googleMapsApiKey;
  if (!apiKey) throw new AppError(500, 'Konfigurasi Google Maps API Key tidak ditemukan');

  // Use the best available coordinates (prefer googleSuggested if already validated)
  const lat = outlet.googleSuggestedLat ?? outlet.latitude;
  const lng = outlet.googleSuggestedLng ?? outlet.longitude;

  if (lat == null || lng == null) {
    throw new AppError(400, 'Koordinat outlet tidak tersedia untuk Nearby Search');
  }

  const nearbyResult = await runNearbySearch(lat, lng, apiKey);
  const scoredNearby = scoreNearbySearch(nearbyResult, outlet);

  // Retrieve existing validationDetails to merge
  let currentDetails = outlet.validationDetails || {};
  if (typeof currentDetails === 'string') {
    try {
      currentDetails = JSON.parse(currentDetails);
    } catch {
      currentDetails = {};
    }
  }

  // Store the full raw result for display, plus the score
  currentDetails.nearbySearch = {
    ...scoredNearby,
    placesList: nearbyResult.places || [],
  };

  // Update in database
  const updatedOutlet = await prisma.outlet.update({
    where: { id: outletId },
    data: {
      validationDetails: currentDetails,
    },
  });

  // NOTE: No cache invalidation - validationDetails is metadata, not map-relevant data

  return {
    nearbySearch: currentDetails.nearbySearch,
    updatedOutlet,
  };
};

// ─── Validation Summary ─────────────────────────────────────────────────────

/**
 * Get validation summary statistics for all outlets.
 */
export const getValidationSummary = async () => {
  const counts = await prisma.outlet.groupBy({
    by: ['validationStatus'],
    where: { deletedAt: null },
    _count: { id: true },
  });

  const total = await prisma.outlet.count({ where: { deletedAt: null } });

  const summary = {
    total,
    UNVALIDATED: 0,
    VALID: 0,
    LIKELY_VALID: 0,
    WARNING: 0,
    SUSPECT: 0,
    INCOMPLETE: 0,
  };

  counts.forEach((row) => {
    summary[row.validationStatus] = row._count.id;
  });

  return summary;
};

// ─── Cache Invalidation Helper ──────────────────────────────────────────────

const invalidateOutletCache = () => {
  cacheInvalidate(CACHE_KEYS.ALL_OUTLETS);
  broadcastCacheInvalidation('outlets');
};
