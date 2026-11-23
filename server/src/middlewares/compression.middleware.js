import zlib from 'node:zlib';

const MIN_COMPRESS_BYTES = 1024;

/**
 * Compresses large JSON responses with gzip when accepted by the client.
 */
export const compressionMiddleware = (req, res, next) => {
  if (req.method === 'HEAD') return next();
  const acceptEncoding = String(req.headers['accept-encoding'] || '');
  if (!/\bgzip\b/i.test(acceptEncoding)) return next();

  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.headersSent || res.getHeader('Content-Encoding')) {
      return originalJson(body);
    }

    let payload;
    try {
      payload = JSON.stringify(body);
    } catch {
      return originalJson(body);
    }

    if (typeof payload !== 'string' || Buffer.byteLength(payload, 'utf8') < MIN_COMPRESS_BYTES) {
      return originalJson(body);
    }

    const buffer = Buffer.from(payload, 'utf8');
    zlib.gzip(buffer, (err, compressed) => {
      if (err || res.headersSent || compressed.length >= buffer.length) {
        return originalJson(body);
      }
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Encoding', 'gzip');
      res.setHeader('Vary', 'Accept-Encoding');
      res.setHeader('Content-Length', String(compressed.length));
      res.end(compressed);
    });
    return res;
  };

  next();
};
