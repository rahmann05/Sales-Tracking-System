/** Shared helpers for clusters services (internal). */
import { invalidateCache } from '../../../middlewares/cache.middleware.js';
import { cacheInvalidate } from '../../../utils/cacheHelper.js';
import { CACHE_KEYS } from '../../../config/cache.js';
import { broadcastCacheInvalidation } from '../../../config/socket.js';
import { haversineKm } from '../cluster-generator.service.js';

export const invalidateClusterCache = (id = null) => {
  invalidateCache('clusters');
  invalidateCache('outlets');
  invalidateCache('users');
  cacheInvalidate(CACHE_KEYS.ALL_CLUSTERS);
  cacheInvalidate(CACHE_KEYS.ALL_OUTLETS);
  if (id) cacheInvalidate(CACHE_KEYS.CLUSTER_BY_ID(id));
  broadcastCacheInvalidation('clusters');
};

/**
 * 2-Opt Local Search Optimizer for open TSP path (O(N^2) delta distance + in-place segment reversal)
 */
export const optimize2Opt = (initialRoute) => {
  const bestRoute = [...initialRoute];
  const n = bestRoute.length;

  const edgeDist = (a, b) => {
    const seg = haversineKm(a.latitude, a.longitude, b.latitude, b.longitude);
    return Number.isFinite(seg) ? seg : 0;
  };

  const calcDist = (route) => {
    let total = 0;
    for (let i = 0; i < route.length - 1; i++) {
      total += edgeDist(route[i], route[i + 1]);
    }
    return total;
  };

  if (n < 3) {
    return { route: bestRoute, distanceKm: calcDist(bestRoute) };
  }

  let improved = true;
  let iterations = 0;

  while (improved && iterations < 50) {
    improved = false;
    iterations++;

    for (let i = 0; i < n - 1; i++) {
      for (let k = i + 1; k < n; k++) {
        if (i === 0 && k === n - 1) continue;
        const oldEdges =
          (i > 0 ? edgeDist(bestRoute[i - 1], bestRoute[i]) : 0) +
          (k < n - 1 ? edgeDist(bestRoute[k], bestRoute[k + 1]) : 0);
        const newEdges =
          (i > 0 ? edgeDist(bestRoute[i - 1], bestRoute[k]) : 0) +
          (k < n - 1 ? edgeDist(bestRoute[i], bestRoute[k + 1]) : 0);

        if (newEdges - oldEdges < -0.005) {
          let left = i;
          let right = k;
          while (left < right) {
            const tmp = bestRoute[left];
            bestRoute[left] = bestRoute[right];
            bestRoute[right] = tmp;
            left++;
            right--;
          }
          improved = true;
        }
      }
    }
  }

  return { route: bestRoute, distanceKm: calcDist(bestRoute) };
};
