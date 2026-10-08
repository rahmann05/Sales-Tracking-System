import { CONFIG_DEFAULTS } from '../../../../../shared/config.mjs';
import { prisma } from '../../../config/prisma.js';
import { config } from '../../../config/index.js';

let cache = {};
let lastFetch = 0;
let generation=0;
let pending=null;
const CACHE_TTL = 60000; // 1 minute (60000 ms)

/**
 * Fetches a configuration value dynamically from the database, falling back to cache or environment config.
 * @param {string} key - The config key to fetch.
 * @param {any} defaultValue - Default value if not found.
 * @returns {Promise<any>}
 */
export const getDynamicConfig = async (key, defaultValue) => {
  if (Date.now()-lastFetch>CACHE_TTL) {
    const revision=generation;
    if(!pending) {
      const flight=prisma.systemConfig.findMany({where:{key:{in:[...Object.keys(CONFIG_DEFAULTS),'LOGISTICS_METRICS']}}}).then(rows=>{
        if(revision===generation){cache=Object.fromEntries(rows.map(row=>[row.key,row.value]));lastFetch=Date.now();}
      });
      const holder={flight};pending=holder;
      flight.finally(()=>{if(pending===holder)pending=null;}).catch(()=>{});
    }
    await pending.flight;
    if(revision!==generation)return getDynamicConfig(key,defaultValue);
  }

  if (cache[key] !== undefined) {
    const val = cache[key];
    // Cast appropriately based on defaultValue type
    if (typeof defaultValue === 'number') return Number.isFinite(Number(val)) ? Number(val) : (CONFIG_DEFAULTS[key] ?? defaultValue);
    if (typeof defaultValue === 'boolean') {
      return val === 'true' || val === true;
    }
    return val;
  }

  const legacyLogisticsKey = { LOGISTICS_PRICE_PER_CARTON: 'pricePerCarton', LOGISTICS_MARGIN_PERCENT: 'grossMarginPercent', LOGISTICS_BASE_DROP_COST: 'baseDropCost' }[key];
  if (legacyLogisticsKey && cache.LOGISTICS_METRICS?.[legacyLogisticsKey] !== undefined) return Number(cache.LOGISTICS_METRICS[legacyLogisticsKey]);

  // Fallback to static config mapping if available
  const staticEnvMap = {
    'ATTENDANCE_RADIUS_METERS': config.attendanceRadiusMeters,
    'VALIDATION_DISTANCE_WARNING': config.validationDistanceWarning,
    'VALIDATION_DISTANCE_SUSPECT': config.validationDistanceSuspect,
  };

  if (staticEnvMap[key] !== undefined) {
    return staticEnvMap[key];
  }

  return CONFIG_DEFAULTS[key] ?? defaultValue;
};

/**
 * Invalidates the dynamic config cache.
 */
export const invalidateConfigCache = () => {
  generation++;lastFetch=0;pending=null;cache={};
};
