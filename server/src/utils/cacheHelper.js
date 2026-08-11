import { cache } from '../config/cache.js';

/** Get from cache, if MISS call fetcher, cache result, return */
export const cacheGetOrFetch = async (key, fetcherFn, ttl) => {
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  const data = await fetcherFn();
  cache.set(key, data, ttl);
  return data;
};

/** Invalidate one or more keys */
export const cacheInvalidate = (...keys) => {
  keys.forEach((key) => cache.del(key));
};

/** Flush all keys matching a prefix */
export const cacheFlushPrefix = (prefix) => {
  const allKeys = cache.keys();
  const matching = allKeys.filter((k) => k.startsWith(prefix));
  if (matching.length > 0) cache.del(matching);
};