import { prisma } from '../../../config/prisma.js';
import { config } from '../../../config/index.js';

let cache = {};
let lastFetch = 0;
const CACHE_TTL = 60000; // 1 minute (60000 ms)

/**
 * Fetches a configuration value dynamically from the database, falling back to cache or environment config.
 * @param {string} key - The config key to fetch.
 * @param {any} defaultValue - Default value if not found.
 * @returns {Promise<any>}
 */
export const getDynamicConfig = async (key, defaultValue) => {
  const now = Date.now();
  if (now - lastFetch > CACHE_TTL) {
    try {
      const allConfigs = await prisma.systemConfig.findMany();
      cache = allConfigs.reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {});
      lastFetch = now;
    } catch (error) {
      console.error('[DynamicConfig] Failed to fetch dynamic configs', error);
      // Don't update lastFetch so it tries again next time, but we can still rely on old cache if available
    }
  }

  if (cache[key] !== undefined) {
    const val = cache[key];
    // Cast appropriately based on defaultValue type
    if (typeof defaultValue === 'number') return Number(val);
    if (typeof defaultValue === 'boolean') {
      return val === 'true' || val === true;
    }
    return val;
  }

  // Fallback to static config mapping if available
  const staticEnvMap = {
    'ATTENDANCE_RADIUS_METERS': config.attendanceRadiusMeters,
    'VALIDATION_DISTANCE_WARNING': config.validationDistanceWarning,
    'VALIDATION_DISTANCE_SUSPECT': config.validationDistanceSuspect,
  };

  if (staticEnvMap[key] !== undefined) {
    return staticEnvMap[key];
  }

  return defaultValue;
};

/**
 * Invalidates the dynamic config cache.
 */
export const invalidateConfigCache = () => {
  lastFetch = 0;
};
