import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { config } from './config/index.js';
import apiRouter from './routes/index.js';
import { notFoundHandler } from './middlewares/notFound.middleware.js';
import { errorHandler } from './middlewares/errorHandler.middleware.js';

const app = express();

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: config.clientOrigin,
    credentials: true,
  })
);

// Logging & Body Parsers
if (config.env === 'development') {
  app.use(morgan('dev'));
}
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Main API Route Mounting
app.use('/api', apiRouter);

// 404 Route Not Found Handler
app.use(notFoundHandler);

// Centralized Error Handler Middleware
app.use(errorHandler);

export default app;
