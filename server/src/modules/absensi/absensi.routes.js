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
router.post('/:pjpStopId/in', authorize('SALES'), validate(checkInSchema), absensiController.checkIn);
router.post('/:pjpStopId/out', authorize('SALES'), validate(checkOutSchema), absensiController.checkOut);
router.get('/history', absensiController.history);
router.get('/pjp/:pjpId', authorize('SUPERVISOR', 'MANAJER_OPERASIONAL', 'ADMIN'), absensiController.getPjpRecap);

// ─── Absensi Off-PJP (Kunjungan Toko Luar RJP) ───────────────────────────────
// POST /absensi/off-pjp                      — Sales submit absen toko luar RJP
// GET  /absensi/off-pjp                      — List (Sales: own, Supervisor+: all)
// PATCH /absensi/off-pjp/:id/validate        — Supervisor validate/reject

router.post(
  '/off-pjp',
  authorize('SALES'),
  validate(createOffPjpAttendanceSchema),
  submitOffPjpAttendance
);
router.get(
  '/off-pjp',
  validate(offPjpQuerySchema),
  listOffPjpAttendances
);
router.patch(
  '/off-pjp/:id/validate',
  authorize('SUPERVISOR', 'ADMIN', 'MANAJER_OPERASIONAL'),
  validate(validateOffPjpSchema),
  handleValidateOffPjpAttendance
);

export default router;
