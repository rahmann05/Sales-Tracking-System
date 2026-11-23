import { cache } from '../config/cache.js';

const inFlight = new Map();

/** Get from cache, deduplicating concurrent cold misses, if MISS call fetcher, cache result, return */
export const cacheGetOrFetch = async (key, fetcherFn, ttl) => {
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  if (inFlight.has(key)) {
    return inFlight.get(key);
  }

  const flight = Promise.resolve()
    .then(() => fetcherFn())
    .then((data) => {
      cache.set(key, data, ttl);
      return data;
    })
    .finally(() => {
      if (inFlight.get(key) === flight) {
        inFlight.delete(key);
      }
    });

  inFlight.set(key, flight);
  return flight;
};

/** Invalidate one or more keys */
export const cacheInvalidate = (...keys) => {
  keys.forEach((key) => {
    inFlight.delete(key);
    cache.del(key);
  });
};

/** Flush all keys matching a prefix */
export const cacheFlushPrefix = (prefix) => {
  for (const key of inFlight.keys()) {
    if (key.startsWith(prefix)) inFlight.delete(key);
  }
  const allKeys = cache.keys();
  const matching = allKeys.filter((k) => k.startsWith(prefix));
  if (matching.length > 0) cache.del(matching);
};
