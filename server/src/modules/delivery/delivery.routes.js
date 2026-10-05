import { Router } from 'express';
import { authenticate, authorize, authorizeWithPermission } from '../../middlewares/auth.middleware.js';
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
  authorizeWithPermission(['KEPALA_GUDANG', 'ADMIN'], 'can_manage_delivery'),
  ctrl.getPackingLists
);

router.get(
  '/packing-lists/:id',
  authorizeWithPermission(['KEPALA_GUDANG', 'ADMIN'], 'can_manage_delivery'),
  ctrl.getPackingListById
);

router.post(
  '/packing-lists',
  authorizeWithPermission(['KEPALA_GUDANG', 'ADMIN'], 'can_manage_delivery'),
  validate(createPackingListSchema),
  ctrl.createPackingList
);

router.delete(
  '/packing-lists/:id',
  authorizeWithPermission(['KEPALA_GUDANG', 'ADMIN'], 'can_manage_delivery'),
  ctrl.deletePackingList
);

// ═══════════════════════════════════════════════════════════════
// Delivery Route Routes — Kepala Gudang + Supir (read)
// ═══════════════════════════════════════════════════════════════

router.get(
  '/routes',
  authorizeWithPermission(['KEPALA_GUDANG', 'SUPIR', 'ADMIN'], 'can_manage_delivery'),
  ctrl.getDeliveryRoutes
);

router.get(
  '/routes/:id',
  authorizeWithPermission(['KEPALA_GUDANG', 'SUPIR', 'ADMIN'], 'can_manage_delivery'),
  ctrl.getDeliveryRouteById
);

router.post(
  '/routes',
  authorizeWithPermission(['KEPALA_GUDANG', 'ADMIN'], 'can_manage_delivery'),
  validate(createDeliveryRouteSchema),
  ctrl.createDeliveryRoute
);

router.patch(
  '/routes/:id/status',
  authorizeWithPermission(['KEPALA_GUDANG', 'ADMIN'], 'can_manage_delivery'),
  validate(updateRouteStatusSchema),
  ctrl.updateRouteStatus
);

router.delete(
  '/routes/:id',
  authorizeWithPermission(['KEPALA_GUDANG', 'ADMIN'], 'can_manage_delivery'),
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
  authorizeWithPermission(['KEPALA_GUDANG', 'ADMIN'], 'can_manage_delivery'),
  ctrl.getDashboard
);

router.get(
  '/drivers',
  authorizeWithPermission(['KEPALA_GUDANG', 'ADMIN'], 'can_manage_delivery'),
  ctrl.getDrivers
);

export default router;
