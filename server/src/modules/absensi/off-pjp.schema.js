import { z } from 'zod';
import {visitOutcomeSchema} from './visit-outcome.schema.js';

export const createOffPjpAttendanceSchema = z.object({
  body: z.object({
    requestId: z.string().uuid().optional(),
    visitOutcome:visitOutcomeSchema.optional(),
    orderAmount: z.number().finite().min(0).max(1e12).optional(),
    productIds: z.array(z.string().uuid()).max(500).optional(),
    skuSold: z.number().int().min(0).max(100000).optional(),
    outletName: z.string().min(2, 'Nama outlet minimal 2 karakter'),
    customerName: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().min(5, 'Alamat minimal 5 karakter'),
    reason: z.string().min(5, 'Alasan kunjungan minimal 5 karakter'),
    accuracy:z.number().nonnegative().max(100000).nullable().optional(),
    observedAt:z.string().datetime().nullable().optional(),
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),
    photoUrl: z.string().url().optional().nullable(),
    outletId: z.string().uuid().optional(),
  }),
});

export const validateOffPjpSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID tidak valid'),
  }),
  body: z.object({
    approved: z.boolean({ required_error: 'Field approved (true/false) wajib diisi' }),
    rejectionNote: z.string().optional(),
  }),
});

export const offPjpQuerySchema = z.object({
  query: z.object({
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
    userId: z.string().uuid().optional(),
    date: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});
