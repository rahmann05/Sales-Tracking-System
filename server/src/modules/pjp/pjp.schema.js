import { z } from 'zod';

export const updateStopSchema = z.object({
  params: z.object({
    id: z.string().uuid('PJP ID tidak valid'),
    stopId: z.string().uuid('Stop ID tidak valid'),
  }),
  body: z.object({
    sequence: z.number().int().positive().optional(),
    status: z.enum(['PENDING', 'VISITED', 'CLOSED_REPORTED', 'SKIPPED']).optional(),
    outletId: z.string().uuid().optional(),
  }),
});
