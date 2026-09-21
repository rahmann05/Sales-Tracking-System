import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════
// Packing List Schemas
// ═══════════════════════════════════════════════════════════════

const invoiceItemSchema = z.object({
  invoiceNumber: z.string().min(1, 'Nomor faktur wajib diisi'),
  totalAmount: z.number().optional(),
  totalCartons: z.number().int().min(1).default(1),
  notes: z.string().optional(),
});

export const createPackingListSchema = z.object({
  body: z.object({
    outletId: z.string().uuid('ID outlet tidak valid'),
    totalCartons: z.number().int().min(1, 'Minimal 1 karton'),
    totalWeight: z.number().positive().optional(),
    notes: z.string().optional(),
    invoices: z.array(invoiceItemSchema).min(1, 'Minimal 1 faktur'),
  }),
});

export const updatePackingListSchema = z.object({
  body: z.object({
    totalCartons: z.number().int().min(1).optional(),
    totalWeight: z.number().positive().optional(),
    notes: z.string().optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

// ═══════════════════════════════════════════════════════════════
// Delivery Route Schemas
// ═══════════════════════════════════════════════════════════════

const deliveryStopItemSchema = z.object({
  packingListId: z.string().uuid('ID packing list tidak valid'),
  outletId: z.string().uuid('ID outlet tidak valid'),
  sequence: z.number().int().min(1),
});

export const createDeliveryRouteSchema = z.object({
  body: z.object({
    date: z.string().refine((d) => !isNaN(Date.parse(d)), 'Format tanggal tidak valid'),
    vehicleId: z.string().uuid('ID kendaraan tidak valid'),
    driverId: z.string().uuid('ID supir tidak valid'),
    notes: z.string().optional(),
    stops: z.array(deliveryStopItemSchema).min(1, 'Minimal 1 toko tujuan'),
  }),
});

export const updateRouteStatusSchema = z.object({
  body: z.object({
    status: z.enum(['DRAFT', 'READY', 'IN_TRANSIT', 'COMPLETED', 'PARTIAL']),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

// ═══════════════════════════════════════════════════════════════
// Delivery Stop / Attendance Schemas
// ═══════════════════════════════════════════════════════════════

export const submitDriverAttendanceSchema = z.object({
  body: z.object({
    type: z.enum(['IN', 'OUT']),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    photoUrl: z.string().optional(),
    notes: z.string().optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const updateStopStatusSchema = z.object({
  body: z.object({
    status: z.enum(['PENDING', 'DELIVERED', 'REJECTED', 'PARTIAL_REJECT']),
    rejectReason: z.string().optional(),
    rejectedCartons: z.number().int().min(0).optional(),
    notes: z.string().optional(),
    photoUrl: z.string().optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});
