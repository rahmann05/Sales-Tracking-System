import { z } from 'zod';

export const createVehicleSchema = z.object({
  body: z.object({
    code: z.string().min(2, 'Kode kendaraan minimal 2 karakter'),
    name: z.string().min(2, 'Nama kendaraan minimal 2 karakter'),
    maxCartons: z.number().int().min(1),
    maxWeightKg: z.number().min(1),
    fuelKmPerLiter: z.number().min(1),
    fuelType: z.string().min(2),
    fuelPricePerLiter: z.number().min(1),
    isActive: z.boolean().optional().default(true),
  }),
});

export const updateVehicleSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    maxCartons: z.number().int().min(1).optional(),
    maxWeightKg: z.number().min(1).optional(),
    fuelKmPerLiter: z.number().min(1).optional(),
    fuelType: z.string().min(2).optional(),
    fuelPricePerLiter: z.number().min(1).optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().uuid('ID tidak valid'),
  }),
});
