import { z } from 'zod';

const outletBaseFields = {
  name: z.string().min(2, 'Nama outlet minimal 2 karakter'),
  address: z.string().min(5, 'Alamat minimal 5 karakter'),
  latitude: z.number({ required_error: 'Latitude wajib diisi' }).min(-90).max(90),
  longitude: z.number({ required_error: 'Longitude wajib diisi' }).min(-180).max(180),
  clusterId: z.string().uuid('clusterId harus berformat UUID'),
  // Optional enrichment fields
  outletCode: z.string().optional(),
  ownerName: z.string().optional(),
  phone: z.string().optional(),
  creditLimit: z.number().min(0).optional(),
  outstanding: z.number().min(0).optional(),
  radiusMeters: z.number().int().min(10).max(1000).optional(),
};

export const createOutletSchema = z.object({
  body: z.object(outletBaseFields),
});

export const updateOutletSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    address: z.string().min(5).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    clusterId: z.string().uuid().optional(),
    outletCode: z.string().optional(),
    ownerName: z.string().optional(),
    phone: z.string().optional(),
    creditLimit: z.number().min(0).optional(),
    outstanding: z.number().min(0).optional(),
    radiusMeters: z.number().int().min(10).max(1000).optional(),
  }),
  params: z.object({
    id: z.string().uuid('ID tidak valid'),
  }),
});

export const lockOutletSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID tidak valid'),
  }),
});

export const unlockRequestSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID tidak valid'),
  }),
  body: z.object({
    reason: z.string().min(5, 'Alasan minimal 5 karakter'),
  }),
});
