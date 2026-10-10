import {assignReturnInspection} from './services/return-assignment.service.js';
import {findDeliveryRequest,cancelDeliveryRequest} from './services/delivery-request.service.js';
import { receiveReturn } from './services/receive-return.service.js';
import { operationsDashboard, routeAction, createIssue, resolveIssue } from './services/operations.service.js';
import { reportDriverLocation } from './services/driver-location.service.js';
import { prisma } from '../../config/prisma.js';
import { routeActionSchema, locationSchema, returnSchema, issueSchema, resolutionSchema } from './delivery.schema.js';
import { Router } from 'express';
import {z} from 'zod';
import {reconcileInvoiceReceipt,correctInvoiceCommercial} from './services/invoice-reconciliation.service.js';
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
router.get('/stops/:id/requests/:requestId',authorize('SUPIR'),authorizeWithPermission(['SUPIR'],'can_access_driver_map'),async(req,res,next)=>{try{res.json({data:await findDeliveryRequest(req.params.id,req.params.requestId,req.user)});}catch(e){next(e);}});
router.post('/stops/:id/requests/:requestId/cancel',authorize('SUPIR'),authorizeWithPermission(['SUPIR'],'can_access_driver_map'),async(req,res,next)=>{try{res.json({data:await cancelDeliveryRequest(req.params.id,req.params.requestId,req.user)});}catch(e){next(e);}});
router.patch('/packing-lists/:id/invoices',authorize('ADMIN'),async(req,res,next)=>{
  try{const data=z.object({revision:z.number().int().positive(),note:z.string().trim().min(1).max(2000),invoices:z.array(z.object({id:z.string().uuid(),totalAmount:z.number().nonnegative(),taxRatePercent:z.number().min(0).max(100).optional(),taxIncluded:z.boolean().optional(),taxRoundingMode:z.enum(['NEAREST','DOWN','UP']).optional(),items:z.array(z.object({lineId:z.string().min(1),quantity:z.number().int().positive(),unitPrice:z.number().nonnegative().optional()}))})).min(1)}).parse(req.body);res.json({data:await correctInvoiceCommercial(req.params.id,data,req.user)});}catch(e){next(e);}
});
router.post('/packing-lists/:id/reconciliation',authorize('ADMIN'),async(req,res,next)=>{
  try{const data=z.object({fingerprint:z.string().max(200000),note:z.string().trim().min(1).max(2000),invoices:z.array(z.object({invoiceId:z.string().uuid(),items:z.array(z.object({lineId:z.string().min(1),quantity:z.number().int().nonnegative()}))})).min(1)}).parse(req.body);res.json({data:await reconcileInvoiceReceipt(req.params.id,data,req.user)});}catch(e){next(e);}
});

// ═══════════════════════════════════════════════════════════════
// Packing List Routes — Admin authors; warehouse reads released documents
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
  authorizeWithPermission(['SUPIR'],'can_access_driver_map'),
  validate(submitDriverAttendanceSchema),
  ctrl.submitDriverAttendance
);

router.patch(
  '/stops/:id/status',
  authorize('SUPIR'),
  authorizeWithPermission(['SUPIR'],'can_access_driver_map'),
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

const execute = fn => async(req,res,next)=>{try{res.json({success:true,data:await fn(req)});}catch(e){next(e);}};
const monitor = authorizeWithPermission(['ADMIN','KEPALA_GUDANG'],'can_monitor_delivery');
const manage = authorizeWithPermission(['ADMIN','KEPALA_GUDANG'],'can_manage_delivery_routes');
router.get('/operations', monitor, execute(req=>operationsDashboard(req.query.date)));
router.get('/my-issues', authorize('SUPIR'), execute(req=>prisma.deliveryIssue.findMany({where:{ownerId:req.user.id,status:'OPEN'},orderBy:{dueAt:'asc'}})));
router.post('/routes/:id/actions', (req,res,next)=>req.user.role==='SUPIR'?authorizeWithPermission(['SUPIR'],'can_access_driver_map')(req,res,next):manage(req,res,next), validate(routeActionSchema), execute(req=>routeAction(req.params.id,routeActionSchema.parse({body:req.body}).body,req.user)));
router.post('/routes/:id/location', authorize('SUPIR'), authorizeWithPermission(['SUPIR'],'can_access_driver_map'), validate(locationSchema), execute(req=>reportDriverLocation(req.params.id,locationSchema.parse({body:req.body}).body,req.user.id)));
router.post('/issues', monitor, validate(issueSchema), execute(req=>createIssue(issueSchema.parse({body:req.body}).body,req.user)));
router.patch('/issues/:id/resolve', (req,res,next)=>req.user.role==='SUPIR'?next():monitor(req,res,next), validate(resolutionSchema), execute(req=>resolveIssue(req.params.id,req.body.resolution,req.user)));
router.patch('/stops/:id/return-assignment', monitor, execute(req=>assignReturnInspection(req.params.id,req.body,req.user)));
router.post('/stops/:id/return', monitor, validate(returnSchema), execute(req=>receiveReturn(req.params.id,req.user.id,returnSchema.parse({body:req.body}).body)));
router.put('/packing-lists/:id', authorize('ADMIN'), authorizeWithPermission(['ADMIN'],'can_manage_packing_list'), validate(updatePackingListSchema), ctrl.updatePackingList);
router.patch('/packing-lists/:id/status', authorize('ADMIN'), authorizeWithPermission(['ADMIN'],'can_manage_packing_list'), ctrl.changePackingStatus);
export default router;
