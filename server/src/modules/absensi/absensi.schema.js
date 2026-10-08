import { z } from 'zod';
import {visitOutcomeSchema} from './visit-outcome.schema.js';

export const checkInSchema = z.object({
  params: z.object({
    pjpStopId: z.string().uuid('pjpStopId harus berformat UUID'),
  }),
  body: z.object({
    latitude: z.number({ required_error: 'Latitude wajib diisi' }).min(-90).max(90),
    longitude: z.number({ required_error: 'Longitude wajib diisi' }).min(-180).max(180),
    photoUrl: z.string().url('Format URL foto tidak valid').nullable().optional(),
    notes: z.string().max(4000).optional(),
  }),
});

export const checkOutSchema = z.object({
  params: z.object({
    pjpStopId: z.string().uuid('pjpStopId harus berformat UUID'),
  }),
  body: z.object({
    latitude: z.number({ required_error: 'Latitude wajib diisi' }).min(-90).max(90),
    longitude: z.number({ required_error: 'Longitude wajib diisi' }).min(-180).max(180),
    photoUrl: z.string().url('Format URL foto tidak valid').nullable().optional(),
    notes: z.string().max(4000).optional(),
    earlyReason: z.string().max(1000).nullable().optional(),
    visitOutcome:visitOutcomeSchema.optional(),
    reason: z.string().max(1000).nullable().optional(),
    orderAmount: z.number().finite().min(0).max(1e12).optional(),
    skuSold: z.number().int().min(0).max(100000).optional(),
    productIds: z.array(z.string().uuid()).max(500).optional(),

  }),
});
