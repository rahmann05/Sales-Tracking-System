import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as ctrl from './delivery.controller.js';
import {
  createPackingListSchema,
  createDeliveryRouteSchema,
  updateRouteStatusSchema,
  submitDriverAttendanceSchema,
  updateStopStatusSchema,
} from './delivery.schema.js';

const router = Router();

// All delivery routes require authentication
router.use(authenticate);

// ═══════════════════════════════════════════════════════════════
// Packing List Routes — Kepala Gudang only
// ═══════════════════════════════════════════════════════════════

router.get(
  '/packing-lists',
  authorize('KEPALA_GUDANG', 'ADMIN'),
  ctrl.getPackingLists
);

router.get(
  '/packing-lists/:id',
  authorize('KEPALA_GUDANG', 'ADMIN'),
  ctrl.getPackingListById
);

router.post(
  '/packing-lists',
  authorize('KEPALA_GUDANG', 'ADMIN'),
  validate(createPackingListSchema),
  ctrl.createPackingList
);

router.delete(
  '/packing-lists/:id',
  authorize('KEPALA_GUDANG', 'ADMIN'),
  ctrl.deletePackingList
);

// ═══════════════════════════════════════════════════════════════
// Delivery Route Routes — Kepala Gudang + Supir (read)
// ═══════════════════════════════════════════════════════════════

router.get(
  '/routes',
  authorize('KEPALA_GUDANG', 'SUPIR', 'ADMIN'),
  ctrl.getDeliveryRoutes
);

router.get(
  '/routes/:id',
  authorize('KEPALA_GUDANG', 'SUPIR', 'ADMIN'),
  ctrl.getDeliveryRouteById
);

router.post(
  '/routes',
  authorize('KEPALA_GUDANG', 'ADMIN'),
  validate(createDeliveryRouteSchema),
  ctrl.createDeliveryRoute
);

router.patch(
  '/routes/:id/status',
  authorize('KEPALA_GUDANG', 'ADMIN'),
  validate(updateRouteStatusSchema),
  ctrl.updateRouteStatus
);

router.delete(
  '/routes/:id',
  authorize('KEPALA_GUDANG', 'ADMIN'),
  ctrl.deleteDeliveryRoute
);

// ═══════════════════════════════════════════════════════════════
// Delivery Stop Routes — Supir (attendance & status)
// ═══════════════════════════════════════════════════════════════

router.post(
  '/stops/:id/attendance',
  authorize('SUPIR'),
  validate(submitDriverAttendanceSchema),
  ctrl.submitDriverAttendance
);

router.patch(
  '/stops/:id/status',
  authorize('SUPIR'),
  validate(updateStopStatusSchema),
  ctrl.updateStopStatus
);

// ═══════════════════════════════════════════════════════════════
// Dashboard & Utility Routes
// ═══════════════════════════════════════════════════════════════

router.get(
  '/dashboard',
  authorize('KEPALA_GUDANG', 'ADMIN'),
  ctrl.getDashboard
);

router.get(
  '/drivers',
  authorize('KEPALA_GUDANG', 'ADMIN'),
  ctrl.getDrivers
);

export default router;
