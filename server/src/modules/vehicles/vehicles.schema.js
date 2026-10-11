import { z } from 'zod';
import { parseGoogleMapsPoint } from '../../../../shared/google-maps-point.mjs';

export const createVehicleSchema = z.object({
  body: z.object({
    code: z.string().trim().max(128).optional(),
    name: z.string().min(2, 'Nama kendaraan minimal 2 karakter'),
    maxCartons: z.number().int().min(1).optional(),
    maxWeightKg: z.number().min(1),
    fuelKmPerLiter: z.number().min(1),
    fuelType: z.string().min(2),
    fuelPricePerLiter: z.number().min(1).optional(),
    isActive: z.boolean().optional().default(true),
    photoUrl: z.string().min(20, 'Foto kendaraan wajib dilampirkan').max(8_000_000),
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

const serviceCode = z.string().regex(/^[A-Z][A-Z0-9_]{0,47}$/);
const finiteNumber = z.number().finite();
export const recordMaintenanceSchema = z.object({
  body: z.object({
    workshopName:z.string().trim().max(200).optional(),
    requestId:z.string().uuid().optional(),
    notes:z.string().trim().max(2000).optional(),
    serviceType: serviceCode.optional(),
    serviceTypes: z.array(serviceCode).min(1,'Pilih minimal satu jenis servis').max(12).optional(),
    odometerAtService: z.number().finite().min(0),
    cost: z.number().finite().min(0).optional(),
    serviceDate: z.string().datetime().optional(),
    receiptPhotoUrl: z.string().min(20,'Foto struk wajib dilampirkan').max(8_000_000),
    location: z.object({
      latitude: finiteNumber.min(-90).max(90).optional(),
      longitude: finiteNumber.min(-180).max(180).optional(),
      accuracy: finiteNumber.min(0).nullish(),
      observedAt: z.string().datetime().nullish(),
      mapsUrl: z.string().trim().max(2000).optional(),
    }).transform((loc, ctx) => {
      if (Number.isFinite(loc.latitude) && Number.isFinite(loc.longitude)) return loc;
      const parsed = parseGoogleMapsPoint(loc.mapsUrl);
      if (!parsed) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Titik bengkel tidak valid' });
        return z.NEVER;
      }
      return { ...loc, latitude: parsed.latitude, longitude: parsed.longitude, mapsUrl: parsed.mapsUrl || loc.mapsUrl };
    }),
  }).refine(body=>body.serviceType||body.serviceTypes?.length,{message:'Pilih minimal satu jenis servis',path:['serviceTypes']}),
  params: z.object({
    id: z.string().uuid('ID kendaraan tidak valid'),
  }),
});

export const vehiclePhotoSchema = z.object({
  body: z.object({ photoUrl: z.string().min(20,'Foto kendaraan wajib dilampirkan').max(8_000_000) }).strict(),
  params: z.object({ id: z.string().uuid('ID kendaraan tidak valid') }),
});

