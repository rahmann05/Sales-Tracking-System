import { z } from 'zod';
import {authorizeDomainAction} from '../../middlewares/domain-permission.middleware.js';
import { listManualSales, reviewManualSales } from './services/manual-sales-review.service.js';
import {authorizeVisitReview} from './services/visit-review-permissions.js';
import { Router } from 'express';
import * as absensiController from './absensi.controller.js';
import {
  submitOffPjpAttendance,
  listOffPjpAttendances,
  handleValidateOffPjpAttendance,
} from './off-pjp.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { checkInSchema, checkOutSchema } from './absensi.schema.js';
import { createOffPjpAttendanceSchema, validateOffPjpSchema, offPjpQuerySchema } from './off-pjp.schema.js';

const router = Router();

router.use(authenticate);

// ─── Absensi PJP (In/Out per Stop) ───────────────────────────────────────────
router.post('/:pjpStopId/in', authorizeDomainAction('SALES_VISIT'), validate(checkInSchema), absensiController.checkIn);
router.post('/:pjpStopId/out', authorize('SALES'), validate(checkOutSchema), absensiController.checkOut);
router.get('/history', absensiController.history);
router.get('/pjp/:pjpId', authorize('SUPERVISOR', 'ADMIN'), absensiController.getPjpRecap);

// ─── Absensi Off-PJP (Kunjungan Toko Luar RJP) ───────────────────────────────
router.post(
  '/off-pjp',
  authorizeDomainAction('OFF_PJP'),
  validate(createOffPjpAttendanceSchema),
  submitOffPjpAttendance
);
router.get(
  '/off-pjp',
  authorize('ADMIN','SUPERVISOR','SALES'),
  validate(offPjpQuerySchema),
  listOffPjpAttendances
);
router.patch(
  '/off-pjp/:id/validate',
  authorizeVisitReview('OFF_PJP'),
  validate(validateOffPjpSchema),
  handleValidateOffPjpAttendance
);

router.get('/manual-sales', authorize('ADMIN','SUPERVISOR'), async (req,res,next) => {
  try { res.json({ success: true, data: await listManualSales(req.user, req.query) }); } catch(error) { next(error); }
});
router.patch('/manual-sales/:kind/:id', authorizeVisitReview('MANUAL_SALES'), async (req,res,next) => {
  try {
    const body = z.object({ decision: z.enum(['APPROVED','REJECTED']), note: z.string().max(2000).optional() }).parse(req.body);
    res.json({ success: true, data: await reviewManualSales(req.user, req.params.kind, req.params.id, body.decision, body.note) });
  } catch(error) { next(error); }
});
export default router;
