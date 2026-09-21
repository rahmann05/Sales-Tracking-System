/** Shared helpers for outlet-validation services (internal). */
import { cacheInvalidate } from '../../../utils/cacheHelper.js';
import { CACHE_KEYS } from '../../../config/cache.js';
import { broadcastCacheInvalidation } from '../../../config/socket.js';

/**
 * Outlet Validation Service (4-Signal Weighted Scoring with Locality Anchoring)
 * Single Responsibility: Validate outlet data against Google APIs using
 * Reverse Geocode, Forward Geocode, Find Place, and Nearby Search signals.
 * 1 File = 1 Service
 */


// ─── Signal Weights ──────────────────────────────────────────────────────────
export const DEFAULT_WEIGHTS = {
  reverseGeocode: 0.25,
  forwardGeocode: 0.25,
  findPlace: 0.30,
  nearbySearch: 0.20,
};

// ─── Indonesian Store Name Prefixes to Strip ─────────────────────────────────
export const STORE_PREFIXES = [
  'toko ', 'tk. ', 'tk ', 'tb. ', 'tb ', 'ud. ', 'ud ',
  'cv. ', 'cv ', 'pt. ', 'pt ', 'warung ', 'depot ', 'kios ',
  'bu ', 'bpk. ', 'bpk ', 'pak ', 'ibu ', 'hj. ', 'hj ',
  'h. ', 'h ', 'agen ', 'grosir ', 'minimarket ', 'swalayan ',
  'kedai ', 'mart ',
];

// Noise words in Indonesian street addresses to strip for token comparison
export const ADDRESS_NOISE_WORDS = new Set([
  'jl', 'jln', 'jalan', 'gang', 'gg', 'blok', 'no', 'nomor',
  'rt', 'rw', 'kp', 'kampung', 'ds', 'desa', 'kel', 'kelurahan',
  'kec', 'kecamatan', 'kab', 'kabupaten', 'kota', 'prov', 'provinsi',
  'raya', 'besar', 'utama', 'indonesia', 'jawa', 'barat', 'pos', 'kodepos',
  'dki', 'daerah', 'khusus', 'ibukota',
]);

// ─── Name Normalization ──────────────────────────────────────────────────────
export const NUMBER_WORDS_MAP = {
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
 * Indonesian phonetic normalization for typos (e.g. Aska <-> Azka, Fajar <-> Pajar)
 */
export const phoneticIndonesianNormalize = (str) => {
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
export const jaroSimilarity = (s1, s2) => {
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
export const jaroWinklerSimilarity = (s1, s2) => {
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
export const tokenOverlapSimilarity = (s1, s2) => {
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

// ─── Address Component Similarity & Region Helpers ───────────────────────────

/**
 * Extract meaningful specific tokens from an Indonesian address
 * by stripping noise words like jl, no, rt, rw, kota, etc.
 */
export const extractAddressTokens = (addr) => {
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

// ─── Google API Callers ─────────────────────────────────────────────────────

/**
 * Signal 1: Reverse Geocode (lat/lng → address)
 */
export const runReverseGeocode = async (lat, lng, apiKey) => {
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
 * Signal 2: Forward Geocode (address → lat/lng with optional regional context)
 */
export const runForwardGeocode = async (address, apiKey, adminAnchor = null) => {
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
export const runFindPlace = async (name, address, apiKey, lat = null, lng = null, adminAnchor = null) => {
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
export const runNearbySearch = async (lat, lng, apiKey, radius = 200) => {
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

// ─── Cache Invalidation Helper ──────────────────────────────────────────────
export const invalidateOutletCache = () => {
  cacheInvalidate(CACHE_KEYS.ALL_OUTLETS);
  broadcastCacheInvalidation('outlets');
};
