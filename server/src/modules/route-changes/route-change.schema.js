import { z } from 'zod';

export const reportClosedSchema = z.object({
  body: z.object({
    pjpStopId: z.string().uuid('pjpStopId harus berformat UUID'),
    reason: z.string().min(5, 'Alasan minimal 5 karakter').optional(),
    photoUrl: z.string().url('Format URL foto tidak valid').optional(),
  }),
});

export const rerouteSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID request tidak valid'),
  }),
  body: z.object({
    replacementOutletId: z.string().uuid('replacementOutletId harus berformat UUID'),
  }),
});

export const skipSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID request tidak valid'),
  }),
});
