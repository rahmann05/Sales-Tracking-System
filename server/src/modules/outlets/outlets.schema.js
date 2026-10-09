import { z } from 'zod';

export const locationEvidenceSchema=z.object({source:z.enum(['GPS','MANUAL','MAP','FIELD','IMPORT']),accuracyMeters:z.number().positive().max(100000).optional().nullable(),capturedAt:z.string().datetime().optional().nullable()});
const legal={taxType:z.enum(['PKP','NON_PKP']).optional(),taxNumber:z.string().trim().max(30).optional().nullable(),taxName:z.string().trim().max(200).optional().nullable(),taxAddress:z.string().trim().max(1000).optional().nullable()};
const trade={channel:z.enum(['GENERAL_TRADE','MODERN_TRADE']).optional(),subChannel:z.enum(['TOKO_RETAIL','GROSIR','KOPERASI','BIDAN','OUTLET_MOTORIS','APOTIK','BABY_SHOP','CHAIN_MINIMARKET','LOKAL_MINIMARKET','NAT_SUPERMARKET','LOKAL_SUPERMARKET','HYPERMARKET','DRUGSTORE','PERKULAKAN']).optional(),itineraryCode:z.enum(['F1','F2','F4']).optional().nullable()};

export const createOutletSchema = z.object({
  body: z.object({
    requestId:z.string().uuid().optional(),duplicateReason:z.string().trim().min(10).max(1000).optional(),locationEvidence:locationEvidenceSchema.optional(),...legal,...trade,
    name: z.string().min(2, 'Nama outlet minimal 2 karakter'),
    address: z.string().min(5, 'Alamat minimal 5 karakter'),
    latitude: z.number({ required_error: 'Latitude wajib diisi' }).min(-90).max(90),
    longitude: z.number({ required_error: 'Longitude wajib diisi' }).min(-180).max(180),
    clusterId: z.string().trim().min(1).max(128),
    outletCode: z.string().optional(),
    ownerName: z.string().optional(),
    phone: z.string().optional(),
    radiusMeters: z.number().int().min(5).max(1000).optional(),
  }),
});

export const updateOutletSchema = z.object({
  body: z.object({
    updatedAt:z.string().datetime(),reason:z.string().trim().min(10).max(1000),locationEvidence:locationEvidenceSchema.optional(),...legal,...trade,
    name: z.string().min(2).optional(),
    address: z.string().min(5).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    clusterId: z.string().trim().min(1).max(128).optional(),
    outletCode: z.string().optional(),
    ownerName: z.string().optional(),
    phone: z.string().optional(),
    radiusMeters: z.number().int().min(5).max(1000).optional(),
  }),
  params: z.object({
    id: z.string().trim().min(1).max(128),
  }),
});

export const lockOutletSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1).max(128),
  }),
});

export const unlockRequestSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1).max(128),
  }),
  body: z.object({
    reason: z.string().min(3, 'Alasan permohonan unlock minimal 3 karakter'),
  }),
});
