import { z } from 'zod';

export const createOutletSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Nama outlet minimal 2 karakter'),
    address: z.string().min(5, 'Alamat minimal 5 karakter'),
    latitude: z.number({ required_error: 'Latitude wajib diisi' }).min(-90).max(90),
    longitude: z.number({ required_error: 'Longitude wajib diisi' }).min(-180).max(180),
    clusterId: z.string().uuid('clusterId harus berformat UUID'),
  }),
});

export const updateOutletSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    address: z.string().min(5).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    clusterId: z.string().uuid().optional(),
  }),
  params: z.object({
    id: z.string().uuid('ID tidak valid'),
  }),
});
