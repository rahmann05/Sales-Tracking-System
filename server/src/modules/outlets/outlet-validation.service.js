/**
 * Outlet Validation Service (4-Signal Weighted Scoring with Locality Anchoring)
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
const DEFAULT_WEIGHTS = {
  reverseGeocode: 0.25,
  forwardGeocode: 0.25,
  findPlace: 0.30,
  nearbySearch: 0.20,
};

// ─── Indonesian Store Name Prefixes to Strip ─────────────────────────────────
const STORE_PREFIXES = [
  'toko ', 'tk. ', 'tk ', 'tb. ', 'tb ', 'ud. ', 'ud ',
  'cv. ', 'cv ', 'pt. ', 'pt ', 'warung ', 'depot ', 'kios ',
  'bu ', 'bpk. ', 'bpk ', 'pak ', 'ibu ', 'hj. ', 'hj ',
  'h. ', 'h ', 'agen ', 'grosir ', 'minimarket ', 'swalayan ',
  'kedai ', 'mart ',
];

// Noise words in Indonesian street addresses to strip for token comparison
const ADDRESS_NOISE_WORDS = new Set([
  'jl', 'jln', 'jalan', 'gang', 'gg', 'blok', 'no', 'nomor',
  'rt', 'rw', 'kp', 'kampung', 'ds', 'desa', 'kel', 'kelurahan',
  'kec', 'kecamatan', 'kab', 'kabupaten', 'kota', 'prov', 'provinsi',
  'raya', 'besar', 'utama', 'indonesia', 'jawa', 'barat', 'pos', 'kodepos',
  'dki', 'daerah', 'khusus', 'ibukota',
]);

// ─── Name Normalization ──────────────────────────────────────────────────────

const NUMBER_WORDS_MAP = {
  '0': 'nol',
  '1': 'satu',
  '2': 'dua',
  '3': 'tiga',
  '4': 'empat',
  '5': 'lima',
  '6': 'enam',
  '7': 'tujuh',
  '8': 'delapan',
  '9': 'sembilan',
};

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

/**
 * Indonesian phonetic normalization for typos (e.g. Aska <-> Azka, Fajar <-> Pajar)
 */
const phoneticIndonesianNormalize = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/z/g, 's')
    .replace(/kh/g, 'h')
    .replace(/sy/g, 's')
    .replace(/ph/g, 'f')
    .replace(/v/g, 'f')
    .replace(/c(?=[eiy])/g, 's')
    .replace(/ch/g, 'c');
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

// ─── Address Component Similarity & Region Helpers ───────────────────────────

/**
 * Extract meaningful specific tokens from an Indonesian address
 * by stripping noise words like jl, no, rt, rw, kota, etc.
 */
const extractAddressTokens = (addr) => {
  if (!addr || typeof addr !== 'string') return new Set();

  const cleaned = addr
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const rawTokens = cleaned.split(' ').filter(Boolean);
  const meaningfulTokens = new Set();

  for (const t of rawTokens) {
    if (!ADDRESS_NOISE_WORDS.has(t) && t.length >= 2) {
      meaningfulTokens.add(t);
    }
  }

  return meaningfulTokens;
};

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

/**
 * Signal 2: Forward Geocode (address → lat/lng with optional regional context)
 */
const runForwardGeocode = async (address, apiKey, adminAnchor = null) => {
  try {
    const queryAddress = cleanAddressForSearch(address, adminAnchor);

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(queryAddress)}&key=${apiKey}&language=id&region=id`;
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
        addressComponents: result.address_components || [],
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
 * Signal 3: Find Place with Proximity-First Keyword Search & Clean Text Query Fallback
 */
const runFindPlace = async (name, address, apiKey, lat = null, lng = null, adminAnchor = null) => {
  try {
    const cleanName = (name || '').trim();

    // Strategy 1: High-Confidence Proximity Search (Nearby Search with keyword) within 500m
    // ONLY accept if name match is HIGH (>= 0.75), e.g. "Al-Fath 2" vs "Toko Al - Fath 2"
    if (lat != null && lng != null) {
      const cleanKeyword = cleanName.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
      const nearbyUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=500&keyword=${encodeURIComponent(cleanKeyword)}&key=${apiKey}&language=id`;
      const nearbyRes = await fetch(nearbyUrl);
      const nearbyData = await nearbyRes.json();

      if (nearbyData.status === 'OK' && nearbyData.results?.length > 0) {
        let bestPlace = null;
        let highestSim = 0;

        for (const place of nearbyData.results) {
          const sim = calculateNameSimilarity(cleanName, place.name);
          if (sim > highestSim) {
            highestSim = sim;
            bestPlace = place;
          }
        }

        // Must be a strong match (>= 0.75) to accept proximity match over text search
        if (bestPlace && highestSim >= 0.75) {
          return {
            success: true,
            placeName: bestPlace.name || '',
            lat: bestPlace.geometry?.location?.lat,
            lng: bestPlace.geometry?.location?.lng,
            formattedAddress: bestPlace.vicinity || bestPlace.formatted_address || '',
            placeId: bestPlace.place_id,
            businessStatus: bestPlace.business_status || 'UNKNOWN',
            types: bestPlace.types || [],
            source: 'nearby_proximity',
          };
        }
      }
    }

    // Strategy 2: Place Text Search combining Name + Meaningful Address Tokens
    const cleanAddr = (address || '')
      .replace(/rt\s*[\/\.]?\s*rw\s*[\d\s\-\.\/]+/gi, '')
      .replace(/rt\s*[\d]+/gi, '')
      .replace(/rw\s*[\d]+/gi, '')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    let cleanQuery = [cleanName, cleanAddr].filter(Boolean).join(' ');

    const fields = 'name,geometry,formatted_address,place_id,business_status,types';
    let biasParam = lat != null && lng != null ? `circle:10000@${lat},${lng}` : 'circle:50000@-6.9,107.6';

    const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(cleanQuery)}&inputtype=textquery&fields=${fields}&key=${apiKey}&language=id&locationbias=${biasParam}`;
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
        source: 'findplace_text',
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
const runNearbySearch = async (lat, lng, apiKey, radius = 200) => {
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
 * Score Signal 1: Reverse Geocode → compare address & locality
 */
export const scoreReverseGeocode = (result, outlet) => {
  if (!result.success) return { score: 0, details: { error: result.error } };

  const similarity = calculateAddressSimilarity(outlet.address, result.formattedAddress);
  let score = Math.round(similarity * 100);

  if (similarity >= 0.35) {
    score = Math.max(score, 60);
  }
  if (similarity >= 0.6) {
    score = Math.max(score, 85);
  }

  return {
    score: Math.min(100, score),
    details: {
      googleAddress: result.formattedAddress,
      outletAddress: outlet.address,
      addressSimilarity: Math.round(similarity * 100) / 100,
    },
  };
};

/**
 * Score Signal 2: Forward Geocode → compare coordinates with strict distance penalties
 */
export const scoreForwardGeocode = (result, outlet) => {
  if (!result.success) return { score: 0, details: { error: result.error } };

  const hasCoords = outlet.latitude != null && outlet.longitude != null;

  if (!hasCoords) {
    return {
      score: 50,
      details: {
        googleLat: result.lat,
        googleLng: result.lng,
        googleAddress: result.formattedAddress,
        note: 'Koordinat outlet kosong - menggunakan saran titik Google',
        suggestedLat: result.lat,
        suggestedLng: result.lng,
      },
    };
  }

  const distance = calculateDistanceMeters(outlet.latitude, outlet.longitude, result.lat, result.lng);
  let score;

  if (distance <= 50) score = 100;
  else if (distance <= 100) score = 90;
  else if (distance <= 250) score = 80;
  else if (distance <= 500) score = 65;
  else if (distance <= 1000) score = 40;
  else if (distance <= 2000) score = 20;
  else if (distance <= 5000) score = 5;
  else score = 0;

  return {
    score,
    details: {
      googleLat: result.lat,
      googleLng: result.lng,
      distanceMeters: Math.round(distance),
      googleAddress: result.formattedAddress,
      outOfBounds: distance > 5000,
    },
  };
};

/**
 * Score Signal 3: Find Place → compare name + coordinates with locality check
 */
export const scoreFindPlace = (result, outlet) => {
  if (!result.success) return { score: 0, details: { error: result.error } };

  const nameSimilarity = calculateNameSimilarity(outlet.name, result.placeName);
  let distanceScore = 50;
  let distanceMeters = null;
  let isFarMismatch = false;

  if (outlet.latitude != null && outlet.longitude != null && result.lat != null && result.lng != null) {
    distanceMeters = calculateDistanceMeters(outlet.latitude, outlet.longitude, result.lat, result.lng);

    if (distanceMeters <= 50) distanceScore = 100;
    else if (distanceMeters <= 100) distanceScore = 90;
    else if (distanceMeters <= 250) distanceScore = 80;
    else if (distanceMeters <= 500) distanceScore = 65;
    else if (distanceMeters <= 1000) distanceScore = 40;
    else if (distanceMeters <= 2000) distanceScore = 20;
    else if (distanceMeters <= 5000) distanceScore = 5;
    else {
      distanceScore = 0;
      isFarMismatch = true;
    }
  }

  let score = isFarMismatch
    ? 0
    : Math.round(nameSimilarity * 100 * 0.6 + distanceScore * 0.4);

  if (nameSimilarity < 0.4) {
    score = Math.min(score, 20);
  }

  return {
    score,
    isFarMismatch,
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
      isFarMismatch,
      note: isFarMismatch
        ? `Tempat Google ditemukan di luar radius wajar (${Math.round((distanceMeters || 0) / 1000)}km) - Diabaikan`
        : null,
    },
  };
};

/**
 * Score Signal 4: Nearby Search → find best name match among nearby places
 */
export const scoreNearbySearch = (result, outlet) => {
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
  else score = 10;

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

// ─── Batch Validation Orchestrator ──────────────────────────────────────────

/**
 * Validate multiple outlets in batch with concurrency limit to respect API rate limits.
 * @param {Object} options - { outletIds?: string[], filter?: string, limit?: number }
 */
export const batchValidateOutlets = async (options = {}) => {
  const { outletIds, filter, limit = 50 } = options;

  const where = { deletedAt: null };

  if (Array.isArray(outletIds) && outletIds.length > 0) {
    where.id = { in: outletIds };
  } else if (filter) {
    if (filter === 'SUSPECT') where.validationStatus = 'SUSPECT';
    else if (filter === 'UNVALIDATED') where.validationStatus = 'UNVALIDATED';
    else if (filter === 'WARNING') where.validationStatus = 'WARNING';
    else if (filter === 'NEEDS_REVIEW') {
      where.validationStatus = { in: ['SUSPECT', 'WARNING', 'UNVALIDATED'] };
    }
  }

  const outletsToValidate = await prisma.outlet.findMany({
    where,
    select: { id: true, name: true },
    take: limit,
    orderBy: { updatedAt: 'desc' },
  });

  const results = {
    total: outletsToValidate.length,
    processed: 0,
    success: 0,
    failed: 0,
    errors: [],
  };

  const CONCURRENCY = 3;
  for (let i = 0; i < outletsToValidate.length; i += CONCURRENCY) {
    const chunk = outletsToValidate.slice(i, i + CONCURRENCY);
    const chunkPromises = chunk.map(async (o) => {
      try {
        await validateOutlet(o.id);
        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push({ id: o.id, name: o.name, error: err.message });
      } finally {
        results.processed++;
      }
    });

    await Promise.all(chunkPromises);
  }

  const summary = await getValidationSummary();

  return {
    ...results,
    summary,
  };
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

