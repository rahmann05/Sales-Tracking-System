import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import rateLimit from 'express-rate-limit';
import path from 'path';

import { config } from './config/index.js';
import apiRouter from './routes/index.js';
import { notFoundHandler } from './middlewares/notFound.middleware.js';
import { errorHandler } from './middlewares/errorHandler.middleware.js';

const app = express();
const httpServer = createServer(app);

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.env === 'development' ? 5000 : 200,
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
  message: { success: false, message: 'Terlalu banyak percobaan login, coba lagi setelah 15 menit' },
  skip: () => config.env === 'development',
});

// ─── Security Middlewares ─────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ 
  origin: config.env === 'development' ? true : config.clientOrigin, 
  credentials: true 
}));
app.use(globalLimiter);

// ─── Logging & Body Parsers ───────────────────────────────────────────────────
if (config.env === 'development') {
  app.use(morgan('dev'));
}
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ─── Static Bucket / Storage for Photos ───────────────────────────────────────
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/v1/auth', authLimiter);
app.use('/api', apiRouter);

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export { httpServer };
export default app;

// trigger restart
