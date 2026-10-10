import { z } from 'zod';
export const revisitSchema=z.object({params:z.object({id:z.string().uuid()}),body:z.object({date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),time:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),manualCode:z.string().trim().max(100).optional(),reason:z.string().trim().min(5).max(2000)}).strict()});

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
    reason:z.string().trim().min(5).max(2000).optional(),
  }),
});

export const skipSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID request tidak valid'),
  }),
});
