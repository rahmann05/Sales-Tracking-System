import { receiveReturn } from './services/receive-return.service.js';
import { Router } from 'express';
import { authenticate, authorize, authorizeWithPermission } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as ctrl from './delivery.controller.js';
import {
  createPackingListSchema,
  updatePackingListSchema,
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
  authorizeWithPermission(['KEPALA_GUDANG', 'ADMIN'], 'can_manage_packing_list'),
  ctrl.getPackingLists
);

router.get(
  '/packing-lists/:id',
  authorizeWithPermission(['KEPALA_GUDANG', 'ADMIN'], 'can_manage_packing_list'),
  ctrl.getPackingListById
);

router.post(
  '/packing-lists',
  authorizeWithPermission(['KEPALA_GUDANG', 'ADMIN'], 'can_manage_packing_list'),
  authorize('ADMIN'),
  validate(createPackingListSchema),
  ctrl.createPackingList
);

router.delete(
  '/packing-lists/:id',
  authorizeWithPermission(['KEPALA_GUDANG', 'ADMIN'], 'can_manage_packing_list'),
  authorize('ADMIN'),
  ctrl.deletePackingList
);

// ═══════════════════════════════════════════════════════════════
// Delivery Route Routes — Kepala Gudang + Supir (read)
// ═══════════════════════════════════════════════════════════════

router.get(
  '/routes',
  (req,res,next)=>authorizeWithPermission(['KEPALA_GUDANG','SUPIR','ADMIN'],req.user.role==='SUPIR'?'can_access_driver_map':'can_monitor_delivery')(req,res,next),
  ctrl.getDeliveryRoutes
);

router.get(
  '/routes/:id',
  (req,res,next)=>authorizeWithPermission(['KEPALA_GUDANG','SUPIR','ADMIN'],req.user.role==='SUPIR'?'can_access_driver_map':'can_monitor_delivery')(req,res,next),
  ctrl.getDeliveryRouteById
);

router.post(
  '/routes',
  authorizeWithPermission(['KEPALA_GUDANG', 'ADMIN'], 'can_manage_delivery_routes'),
  validate(createDeliveryRouteSchema),
  ctrl.createDeliveryRoute
);

router.patch(
  '/routes/:id/status',
  authorizeWithPermission(['KEPALA_GUDANG', 'ADMIN'], 'can_manage_delivery_routes'),
  validate(updateRouteStatusSchema),
  ctrl.updateRouteStatus
);

router.delete(
  '/routes/:id',
  authorizeWithPermission(['KEPALA_GUDANG', 'ADMIN'], 'can_manage_delivery_routes'),
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
  authorizeWithPermission(['KEPALA_GUDANG', 'ADMIN'], 'can_monitor_delivery'),
  ctrl.getDashboard
);

router.get(
  '/drivers',
  authorizeWithPermission(['KEPALA_GUDANG', 'ADMIN'], 'can_manage_delivery_routes'),
  ctrl.getDrivers
);

router.post('/stops/:id/return', authorizeWithPermission(['ADMIN','KEPALA_GUDANG'],'can_monitor_delivery'), async(req,res,next)=>{try{res.json({success:true,data:await receiveReturn(req.params.id,req.user.id,req.body.note)});}catch(e){next(e);}});
router.put('/packing-lists/:id', authorize('ADMIN'), validate(updatePackingListSchema), ctrl.updatePackingList);
router.patch('/packing-lists/:id/status', authorize('ADMIN'), ctrl.changePackingStatus);
export default router;
