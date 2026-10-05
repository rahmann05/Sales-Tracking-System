const memoryCache = new Map();

/**
 * In-memory TTL cache middleware with automatic cache headers and Hit/Miss tracking
 * @param {number} ttlSeconds - Time-to-live in seconds (default 60s)
 */
export const memoryCacheMiddleware = (ttlSeconds = 60) => {
  return (req, res, next) => {
    // Only cache safe GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = `${req.baseUrl || ''}${req.originalUrl || req.url}`;
    const cached = memoryCache.get(key);
    const now = Date.now();

    if (cached && cached.expiry > now) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('Cache-Control', `public, max-age=${ttlSeconds}`);
      return res.status(cached.status).json(cached.data);
    }

    // Intercept res.json to capture response payload
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        memoryCache.set(key, {
          data: body,
          status: res.statusCode,
          expiry: now + ttlSeconds * 1000,
        });
        res.setHeader('X-Cache', 'MISS');
        res.setHeader('Cache-Control', `public, max-age=${ttlSeconds}`);
      }
      return originalJson(body);
    };

    next();
  };
};

/**
 * Invalidate cached entries matching a url prefix or key fragment
 * @param {string} prefix
 */
export const invalidateCache = (prefix) => {
  if (!prefix) {
    memoryCache.clear();
    return;
  }
  for (const key of memoryCache.keys()) {
    if (key.includes(prefix)) {
      memoryCache.delete(key);
    }
  }
};
