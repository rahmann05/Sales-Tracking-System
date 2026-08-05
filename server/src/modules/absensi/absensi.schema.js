import { z } from 'zod';

export const checkInSchema = z.object({
  params: z.object({
    pjpStopId: z.string().uuid('pjpStopId harus berformat UUID'),
  }),
  body: z.object({
    latitude: z.number({ required_error: 'Latitude wajib diisi' }).min(-90).max(90),
    longitude: z.number({ required_error: 'Longitude wajib diisi' }).min(-180).max(180),
    photoUrl: z.string().url('Format URL foto tidak valid').optional(),
  }),
});

export const checkOutSchema = z.object({
  params: z.object({
    pjpStopId: z.string().uuid('pjpStopId harus berformat UUID'),
  }),
  body: z.object({
    latitude: z.number({ required_error: 'Latitude wajib diisi' }).min(-90).max(90),
    longitude: z.number({ required_error: 'Longitude wajib diisi' }).min(-180).max(180),
    photoUrl: z.string().url('Format URL foto tidak valid').optional(),
  }),
});
