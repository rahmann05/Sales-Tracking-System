/** Shared helpers for outlets services (internal). */
import { invalidateCache } from '../../../middlewares/cache.middleware.js';
import { cacheInvalidate } from '../../../utils/cacheHelper.js';
import { CACHE_KEYS } from '../../../config/cache.js';
import { broadcastCacheInvalidation } from '../../../config/socket.js';


export const invalidateOutletCache = () => {
  invalidateCache('outlets');
  cacheInvalidate(CACHE_KEYS.ALL_CLUSTERS);
  cacheInvalidate(CACHE_KEYS.ALL_OUTLETS);
  broadcastCacheInvalidation('outlets');
};
