import crypto from 'node:crypto';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import path from 'path';

import { config } from './config/index.js';
import apiRouter from './routes/index.js';
import { compressionMiddleware } from './middlewares/compression.middleware.js';
import { notFoundHandler } from './middlewares/notFound.middleware.js';
import { errorHandler } from './middlewares/errorHandler.middleware.js';

const app = express();
app.set('trust proxy', 1);
const httpServer = createServer(app);

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.env === 'development' ? 5000 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Terlalu banyak request, coba lagi setelah 15 menit' },
  skip: () => config.env === 'development',
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.env === 'development' ? 1000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) =>
    `${ipKeyGenerator(req.ip || '')}:${String(req.body?.email || '')
      .trim()
      .toLowerCase()}`,
  message: {
    success: false,
    message: 'Terlalu banyak percobaan login, coba lagi setelah 15 menit',
  },
  skip: () => config.env === 'development',
});

// ─── Request Correlation ID ───────────────────────────────────────────────────
app.use((req, res, next) => {
  const headerId =
    typeof req.headers['x-request-id'] === 'string' ? req.headers['x-request-id'].trim() : '';
  req.id = headerId && headerId.length <= 128 ? headerId : crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
});

// ─── Security Middlewares ─────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https://maps.googleapis.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
        imgSrc: [
          "'self'",
          'data:',
          'blob:',
          'https://*.googleapis.com',
          'https://*.gstatic.com',
          'https://*.tile.openstreetmap.org',
        ],
        connectSrc: [
          "'self'",
          'https://maps.googleapis.com',
          'https://maps.gstatic.com',
          'https://router.project-osrm.org',
          'ws:',
          'wss:',
        ],
      },
    },
  })
);
app.use(
  cors({
    origin: config.env === 'development' ? true : config.clientOrigin,
    credentials: true,
  })
);
app.use(globalLimiter);

// ─── Logging & Body Parsers ───────────────────────────────────────────────────
if (config.env === 'development') {
  app.use(morgan('dev'));
}
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Static Bucket / Storage for Photos ───────────────────────────────────────
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use(compressionMiddleware);
app.use('/api/v1/auth', authLimiter);
app.use('/api', apiRouter);

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export { httpServer };
export default app;

// trigger restart
