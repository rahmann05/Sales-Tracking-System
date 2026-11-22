import NodeCache from 'node-cache';
import { AppError } from '../../utils/errors.js';
import { fetchGoogleLegs } from './googleDirectionsProvider.js';
import { fetchOsrmLegs } from './osrmProvider.js';
import { config } from '../../config/index.js';
import { getDynamicConfig } from '../config/config.service.js';

const routeCache = new NodeCache({ stdTTL: 6 * 3600, maxKeys: 500, useClones: false });

export const clearRoadRouteCache = () => {
  routeCache.flushAll();
};

const routeCacheKey = (waypoints, provider, fallback, googleOnly) => {
  const coords = waypoints
    .map((p) => `${Number(p.lat).toFixed(5)},${Number(p.lng).toFixed(5)}`)
    .join('|');
  return `${provider}:${fallback ? 1 : 0}:${googleOnly ? 1 : 0}:${coords}`;
};

/**
 * Resolve rute per leg dengan fallback Google → OSRM (dengan bounded cache)
 * @param {Array} waypoints - Array of {lat, lng}
 * @returns {Promise<{legs: Array, provider: 'google'|'osrm'}>}
 */
export const resolveRoadRoute = async (waypoints) => {
  if (
    !Array.isArray(waypoints) ||
    waypoints.length < 2 ||
    waypoints.some(
      (p) =>
        !Number.isFinite(p.lat) ||
        !Number.isFinite(p.lng) ||
        Math.abs(p.lat) > 90 ||
        Math.abs(p.lng) > 180
    )
  ) {
    throw new AppError(
      'Rute memerlukan koordinat lengkap pada setiap tujuan. Perbaiki lokasi outlet terlebih dahulu.',
      422
    );
  }
  const googleOnly = waypoints.some((p) => p.googleMapsOnly);
  const provider = await getDynamicConfig('ROUTING_PROVIDER', 'AUTO');
  const fallback = await getDynamicConfig('ROUTING_ALLOW_FALLBACK', true);
  if (provider === 'OFF' || (await getDynamicConfig('FEATURE_MAPS_MODE', 'ACTIVE')) !== 'ACTIVE') {
    throw new AppError('Layanan rute jalan dinonaktifkan Admin', 403);
  }

  const cacheKey = routeCacheKey(waypoints, provider, fallback, googleOnly);
  const cached = routeCache.get(cacheKey);
  if (cached) return cached;

  let apiKey = config.googleMapsApiKey || process.env.GOOGLE_MAPS_API_KEY;
  try {
    const dynamicKey = await getDynamicConfig('MAPS_API_KEY', apiKey);
    if (dynamicKey) apiKey = dynamicKey;
  } catch {}

  const cacheAndReturn = (result) => {
    try {
      routeCache.set(cacheKey, result);
    } catch {}
    return result;
  };

  if (googleOnly && (!apiKey || provider === 'OSRM')) {
    throw new AppError(
      'Tujuan memakai titik Google. Aktifkan rute Google atau gunakan lokasi lapangan.',
      503
    );
  }
  if (apiKey && provider !== 'OSRM') {
    try {
      const legs = await fetchGoogleLegs(waypoints, apiKey);
      return cacheAndReturn({ legs, provider: 'google' });
    } catch (err) {
      if (googleOnly || (provider === 'GOOGLE' && !fallback) || !fallback) throw err;
      console.warn(
        '[routingService] Google Directions/Routes API gagal, fallback OSRM:',
        err.message
      );
    }
  } else {
    console.info('[routingService] GOOGLE_MAPS_API_KEY tidak diset — langsung pakai OSRM.');
  }

  if (provider === 'GOOGLE' && !fallback) {
    throw new AppError('Google Maps belum tersedia dan rute cadangan dinonaktifkan', 503);
  }
  try {
    const legs = await fetchOsrmLegs(waypoints);
    return cacheAndReturn({ legs, provider: 'osrm' });
  } catch (err) {
    console.error('[routingService] OSRM fallback juga gagal:', err.message);
    throw err;
  }
};
