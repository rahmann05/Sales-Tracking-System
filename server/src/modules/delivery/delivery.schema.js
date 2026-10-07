import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════
// Packing List Schemas
// ═══════════════════════════════════════════════════════════════

const invoiceItemSchema = z.object({
  invoiceNumber: z.string().min(1, 'Nomor faktur wajib diisi'),
  totalAmount: z.number().nonnegative().optional(),
  totalCartons: z.number().int().min(1).default(1),
  notes: z.string().optional(),
});

const packingBody = z.object({
  outletId: z.string().trim().min(1).max(128),
  sourceOrderId: z.string().trim().min(1).max(128).nullable().optional(),
  totalCartons: z.number().int().nonnegative(),
  totalWeight: z.number().nonnegative().optional(),
  notes: z.string().max(2000).optional(),
  overrideReason: z.string().max(1000).optional(),
  items: z.array(z.object({ lineId: z.string().min(1).optional(), sku: z.string().max(100).optional(), name: z.string().trim().min(1), unit: z.string().trim().min(1).default('unit'), quantity: z.number().int().positive() })).default([]),
  invoices: z.array(invoiceItemSchema).default([]),
});
export const createPackingListSchema = z.object({ body: packingBody });
export const updatePackingListSchema = z.object({ body: packingBody.extend({ revision: z.number().int().positive() }), params: z.object({ id: z.string().trim().min(1).max(128) }) });

// ═══════════════════════════════════════════════════════════════
// Delivery Route Schemas
// ═══════════════════════════════════════════════════════════════

const deliveryStopItemSchema = z.object({
  packingListId: z.string().trim().min(1).max(128),
  outletId: z.string().trim().min(1).max(128),
  sequence: z.number().int().min(1),
  allocatedCartons: z.number().int().positive().optional(),
  allocatedItems: z.array(z.object({ lineId: z.string().min(1), quantity: z.number().int().positive() })).optional(),
});

export const createDeliveryRouteSchema = z.object({
  body: z.object({
    date: z.string().refine((d) => !isNaN(Date.parse(d)), 'Format tanggal tidak valid'),
    vehicleId: z.string().trim().min(1).max(128),
    driverId: z.string().trim().min(1).max(128),
    notes: z.string().optional(),
    totalDistanceKm: z.number().nonnegative().optional(),
    stops: z.array(deliveryStopItemSchema).min(1, 'Minimal 1 toko tujuan'),
  }),
});

export const updateRouteStatusSchema = z.object({
  body: z.object({
    status: z.enum(['DRAFT', 'READY', 'IN_TRANSIT', 'COMPLETED', 'PARTIAL']),
    totalDistanceKm: z.number().nonnegative().optional(),
  }),
  params: z.object({
    id: z.string().trim().min(1).max(128),
  }),
});

// ═══════════════════════════════════════════════════════════════
// Delivery Stop / Attendance Schemas
// ═══════════════════════════════════════════════════════════════

const rejectedItem = z.object({lineId:z.string().min(1),quantity:z.number().int().positive()});
const stopResult = z.object({status:z.enum(['DELIVERED','REJECTED','PARTIAL_REJECT']),rejectReason:z.string().optional(),rejectedCartons:z.number().int().nonnegative().optional(),rejectedItems:z.array(rejectedItem).optional()});
export const submitDriverAttendanceSchema = z.object({
  body: z.object({
    type: z.enum(['IN', 'OUT']),
    result: stopResult.optional(),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    photoUrl: z.string().optional(),
    notes: z.string().optional(),
  }),
  params: z.object({
    id: z.string().trim().min(1).max(128),
  }),
});

export const updateStopStatusSchema = z.object({
  body: z.object({
    status: z.enum(['PENDING', 'DELIVERED', 'REJECTED', 'PARTIAL_REJECT']),
    rejectReason: z.string().optional(),
    rejectedCartons: z.number().int().min(0).optional(),
    rejectedItems: z.array(rejectedItem).optional(),
    notes: z.string().optional(),
    photoUrl: z.string().optional(),
  }),
  params: z.object({
    id: z.string().trim().min(1).max(128),
  }),
});
