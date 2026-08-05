import { z } from 'zod';

export const createClusterSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Nama cluster minimal 2 karakter'),
    region: z.string().min(2, 'Region minimal 2 karakter'),
  }),
});

export const updateClusterSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    region: z.string().min(2).optional(),
  }),
  params: z.object({
    id: z.string().uuid('ID tidak valid'),
  }),
});
