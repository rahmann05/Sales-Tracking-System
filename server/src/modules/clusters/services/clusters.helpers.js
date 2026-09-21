/** Shared helpers for clusters services (internal). */
import { cacheGetOrFetch, cacheInvalidate } from '../../../utils/cacheHelper.js';
import { CACHE_KEYS } from '../../../config/cache.js';
import { broadcastCacheInvalidation } from '../../../config/socket.js';
import { haversineKm } from '../cluster-generator.service.js';


export const invalidateClusterCache = (id = null) => {
  cacheInvalidate(CACHE_KEYS.ALL_CLUSTERS);
  cacheInvalidate(CACHE_KEYS.ALL_OUTLETS);
  if (id) cacheInvalidate(CACHE_KEYS.CLUSTER_BY_ID(id));
  broadcastCacheInvalidation('clusters');
};

/**
 * 2-Opt Local Search Optimizer for TSP path (eliminates intersecting lines and reduces total distance)
 */
export const optimize2Opt = (initialRoute) => {
  let bestRoute = [...initialRoute];
  let improved = true;
  let iterations = 0;

  const calcDist = (route) => {
    let d = 0;
    for (let i = 0; i < route.length - 1; i++) {
      const seg = haversineKm(route[i].latitude, route[i].longitude, route[i + 1].latitude, route[i + 1].longitude);
      if (!isNaN(seg)) d += seg;
    }
    return d;
  };

  let bestDist = calcDist(bestRoute);

  while (improved && iterations < 50) {
    improved = false;
    iterations++;

    for (let i = 0; i < bestRoute.length - 1; i++) {
      for (let k = i + 1; k < bestRoute.length; k++) {
        const newRoute = [
          ...bestRoute.slice(0, i),
          ...bestRoute.slice(i, k + 1).reverse(),
          ...bestRoute.slice(k + 1),
        ];
        const newDist = calcDist(newRoute);
        if (newDist < bestDist - 0.005) {
          bestRoute = newRoute;
          bestDist = newDist;
          improved = true;
        }
      }
    }
  }

  return { route: bestRoute, distanceKm: bestDist };
};
