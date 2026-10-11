import {validReceiptSignature,SIGNATURE_MAX_LENGTH} from '../../../../shared/delivery-receipt.mjs';
import { z } from 'zod';
import {actionNames} from '../../../../shared/business-actions.mjs';

// ═══════════════════════════════════════════════════════════════
// Packing List Schemas
// ═══════════════════════════════════════════════════════════════

const invoiceItemSchema = z.object({
  destinationId:z.string().min(1).optional(),
  sourceOrderIds:z.array(z.string().min(1)).max(30).optional(),
  items:z.array(z.object({lineId:z.string().min(1),quantity:z.number().int().positive(),unitPrice:z.number().nonnegative().optional()})).optional(),
  taxRatePercent:z.number().min(0).max(100).optional(),
  taxIncluded:z.boolean().optional(),
  taxRoundingMode:z.enum(['NEAREST','DOWN','UP']).optional(),
  invoiceNumber: z.string().trim().max(128).optional(),
  totalAmount: z.number().nonnegative().optional(),
  totalCartons: z.number().int().nonnegative().default(0),
  notes: z.string().optional(),
});

const packingBody = z.object({
  loadPlanVersion:z.literal(2).optional(),
  suggestedVehicleId:z.string().min(1).nullable().optional(),
  destinations:z.array(z.object({id:z.string().min(1).max(128),outletId:z.string().min(1),sourceOrderIds:z.array(z.string().min(1)).max(30),totalCartons:z.number().int().nonnegative(),totalWeight:z.number().nonnegative().nullable().optional()})).max(30).optional(),
  requestId:z.string().uuid().optional(),
  releaseAfterSave:z.boolean().optional(),
  documentKind:z.enum(['PACKING','MANIFEST']).optional(),
  code: z.string().trim().max(128).optional(),
  outletId: z.string().trim().min(1).max(128),
  sourceOrderId: z.string().trim().min(1).max(128).nullable().optional(),
  sourceOrderIds: z.array(z.string().trim().min(1).max(128)).max(30).optional(),
  totalCartons: z.number().int().nonnegative(),
  totalWeight: z.number().nonnegative().optional(),
  notes: z.string().max(2000).optional(),
  overrideReason: z.string().max(1000).optional(),
  items: z.array(z.object({ destinationId:z.string().min(1).optional(),lineId: z.string().min(1).optional(), sourceOrderItemId: z.string().min(1).optional(), sku: z.string().max(100).optional(), name: z.string().trim().min(1), unit: z.string().trim().min(1).default('unit'), quantity: z.number().int().positive() })).default([]),
  invoices: z.array(invoiceItemSchema).default([]),
});
export const createPackingListSchema = z.object({ body: packingBody });
export const updatePackingListSchema = z.object({ body: packingBody.extend({ revision: z.number().int().positive() }), params: z.object({ id: z.string().trim().min(1).max(128) }) });

// ═══════════════════════════════════════════════════════════════
// Delivery Route Schemas
// ═══════════════════════════════════════════════════════════════

const deliveryStopItemSchema = z.object({
  packingDestinationId:z.string().min(1).optional(),
  packingListId: z.string().trim().min(1).max(128),
  outletId: z.string().trim().min(1).max(128),
  sequence: z.number().int().min(1),
  allocatedCartons: z.number().int().positive().optional(),
  allocatedInvoices: z.array(z.object({ invoiceId: z.string().min(1), cartons: z.number().int().positive() })).optional(),
  allocatedItems: z.array(z.object({ lineId: z.string().min(1), quantity: z.number().int().positive() })).optional(),
});

export const createDeliveryRouteSchema = z.object({
  body: z.object({
    requestId:z.string().uuid().optional(),
    code: z.string().trim().max(128).optional(),
    date: z.string().refine((d) => !isNaN(Date.parse(d)), 'Format tanggal tidak valid'),
    plannedStartAt: z.string().datetime().optional(),
    plannedEndAt: z.string().datetime().optional(),
    vehicleId: z.string().trim().min(1).max(128),
    driverId: z.string().trim().min(1).max(128),
    capacityOverrideReason:z.string().trim().max(2000).optional(),
    vehicleDecisionReason:z.string().trim().max(2000).optional(),
    departureDepotId:z.string().trim().min(1).max(20).optional(),
    returnDepotId:z.string().trim().min(1).max(20).optional(),
    notes: z.string().optional(),
    stops: z.array(deliveryStopItemSchema).min(1, 'Minimal 1 toko tujuan'),
  }),
});

export const updateRouteStatusSchema = z.object({
  body: z.object({
    status: z.enum(['DRAFT', 'READY', 'IN_TRANSIT', 'COMPLETED', 'PARTIAL']),
  }),
  params: z.object({
    id: z.string().trim().min(1).max(128),
  }),
});

// ═══════════════════════════════════════════════════════════════
// Delivery Stop / Attendance Schemas
// ═══════════════════════════════════════════════════════════════

const rejectedItem = z.object({lineId:z.string().min(1),quantity:z.number().int().positive()});
const invoiceAllocation = z.object({invoiceId:z.string().min(1),cartons:z.number().int().positive()});
const receiptFields={recipientName:z.string().trim().max(200).optional(),signatureDataUrl:z.string().max(SIGNATURE_MAX_LENGTH).refine(v=>!v||validReceiptSignature(v),'Tanda tangan PNG tidak valid').optional()};
const stopResult = z.object({...receiptFields,status:z.enum(['DELIVERED','REJECTED','PARTIAL_REJECT']),rejectReason:z.string().optional(),rejectedCartons:z.number().int().nonnegative().optional(),rejectedItems:z.array(rejectedItem).optional(),rejectedInvoices:z.array(invoiceAllocation).optional()});
export const submitDriverAttendanceSchema = z.object({
  body: z.object({
    requestId:z.string().uuid().optional(),
    type: z.enum(['IN', 'OUT']),
    result: stopResult.optional(),
    accuracy:z.number().nonnegative().max(100000).nullable().optional(),
    observedAt:z.string().datetime().nullable().optional(),
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),
    photoUrl: z.string().optional(),
    notes: z.string().optional(),
  }),
  params: z.object({
    id: z.string().trim().min(1).max(128),
  }),
});

export const updateStopStatusSchema = z.object({
  body: z.object({
    ...receiptFields,
    requestId:z.string().uuid().optional(),
    status: z.enum(['PENDING', 'DELIVERED', 'REJECTED', 'PARTIAL_REJECT']),
    rejectReason: z.string().optional(),
    rejectedCartons: z.number().int().min(0).optional(),
    rejectedItems: z.array(rejectedItem).optional(),
    rejectedInvoices: z.array(invoiceAllocation).optional(),
    missingCheckoutReason:z.string().trim().min(5).max(2000).optional(),
    notes: z.string().optional(),
    photoUrl: z.string().optional(),
  }),
  params: z.object({
    id: z.string().trim().min(1).max(128),
  }),
});

export const routeActionSchema = z.object({ body: z.object({
  action: z.enum(actionNames('TRIP')),
  capacityOverrideReason:z.string().trim().max(2000).optional(),
  departureAnswers:z.record(z.unknown()).optional(),
  stage:z.enum(['PICK','CHECK','LOAD']).optional(),ownerId:z.string().uuid().optional(),dueAt:z.string().datetime().optional(),assignmentRevision:z.number().int().nonnegative().optional(),
  note: z.string().trim().max(2000).default(''), confirmedAsPlanned:z.boolean().optional(),cartons:z.number().int().nonnegative().optional(),
  quantities:z.record(z.number().int().nonnegative()).optional(), odometer:z.number().nonnegative().optional(), fuelLiters:z.number().nonnegative().optional(), documentsReturned:z.boolean().optional(),
  latitude:z.number().min(-90).max(90).optional(),longitude:z.number().min(-180).max(180).optional(),accuracy:z.number().nonnegative().optional(),observedAt:z.string().datetime().optional(),photoUrl:z.string().optional(),
  plannedStartAt:z.string().datetime().optional(), plannedEndAt:z.string().datetime().optional(), vehicleId:z.string().min(1).optional(), driverId:z.string().min(1).optional()
}) });
export const locationSchema = z.object({ body:z.object({latitude:z.number().min(-90).max(90),longitude:z.number().min(-180).max(180),accuracy:z.number().nonnegative().max(100000),observedAt:z.string().datetime()}) });
export const returnSchema = z.object({body:z.object({ note:z.string().trim().min(1).max(2000),receivedCartons:z.number().int().nonnegative(),reusableCartons:z.number().int().nonnegative(),items:z.array(z.object({lineId:z.string().min(1),received:z.number().int().nonnegative(),reusable:z.number().int().nonnegative()})),reusableInvoices:z.array(invoiceAllocation).default([]) })});
export const issueSchema = z.object({body:z.object({title:z.string().trim().min(1).max(200),reason:z.string().trim().min(1).max(2000),kind:z.enum(['CONTEXT','GOODS']).optional(),requestId:z.string().uuid().optional(),ownerId:z.string().uuid().optional(),salesVisitId:z.string().uuid().optional(),dueAt:z.string().datetime().optional(),routeId:z.string().min(1).optional(),packingListId:z.string().min(1).optional(),orderId:z.string().min(1).optional()}).refine(b=>b.routeId||b.packingListId||b.orderId||b.salesVisitId,'Pilih referensi pekerjaan')});
export const resolutionSchema = z.object({body:z.object({resolution:z.string().trim().min(1).max(2000)})});

export const issueActionSchema=z.object({body:z.object({action:z.enum(['CLAIM','NOTE','REASSIGN','REOPEN']),ownerId:z.string().uuid().nullable().optional(),note:z.string().trim().max(2000).optional()}).superRefine((data,ctx)=>{if(data.action!=='CLAIM'&&!data.note)ctx.addIssue({code:'custom',path:['note'],message:'Jelaskan alasan atau tindakan.'});})});
