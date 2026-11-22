import { Router } from 'express';
import { successResponse } from '../utils/response.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { getActiveDatabaseState } from '../config/database.js';
import { prisma } from '../config/prisma.js';
import { schedulerMonitor } from '../utils/scheduler-health.js';
import { getIo } from '../config/socket.js';
import { socketAdapterStatus } from '../config/socket-adapter.js';

const router = Router();

router.get('/ready', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const dbState = getActiveDatabaseState();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return successResponse(
      res,
      200,
      {
        status: 'ready',
        database: 'OK',
        databaseMode: dbState.mode,
        databaseTarget: dbState.target,
      },
      'Server is ready'
    );
  } catch {
    return res.status(503).json({
      success: false,
      message: 'Database belum siap',
      data: {
        status: 'not_ready',
        database: 'ERROR',
        databaseMode: dbState.mode,
        databaseTarget: dbState.target,
      },
    });
  }
});

router.get('/monitoring', authenticate, authorize('ADMIN'), async (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  const dbState = getActiveDatabaseState();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const jobs = schedulerMonitor.snapshot();
    return successResponse(res, 200, {
      observedAt: new Date().toISOString(),
      database: 'OK',
      databaseMode: dbState.mode,
      databaseTarget: dbState.target,
      jobs,
      schedulerInitialized: jobs.length > 0,
      socket: socketAdapterStatus(getIo()),
      basis:
        'Status proses server ini; riwayat sebelum restart tidak tersedia. WAITING berarti belum berjalan sejak proses dimulai.',
    });
  } catch (error) {
    next(error);
  }
});

router.get('/', (req, res) => {
  return successResponse(
    res,
    200,
    { uptime: process.uptime(), timestamp: new Date() },
    'Server is healthy'
  );
});

export default router;
