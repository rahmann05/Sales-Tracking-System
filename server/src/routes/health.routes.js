import { Router } from 'express';
import { successResponse } from '../utils/response.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { prisma } from '../config/prisma.js';
import { schedulerMonitor } from '../utils/scheduler-health.js';

const router = Router();

router.get('/monitoring', authenticate, authorize('ADMIN'), async (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  try {
    await prisma.$queryRaw`SELECT 1`;
    const jobs = schedulerMonitor.snapshot();
    return successResponse(res, 200, { observedAt: new Date().toISOString(), database: 'OK', jobs, schedulerInitialized: jobs.length > 0,
      basis: 'Status proses server ini; riwayat sebelum restart tidak tersedia. WAITING berarti belum berjalan sejak proses dimulai.' });
  } catch (error) { next(error); }
});

router.get('/', (req, res) => {
  return successResponse(res, 200, { uptime: process.uptime(), timestamp: new Date() }, 'Server is healthy');
});

export default router;
