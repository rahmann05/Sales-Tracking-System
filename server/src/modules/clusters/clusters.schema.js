import { z } from 'zod';

export const createClusterSchema = z.object({
  body: z.object({
    code: z.string().trim().max(128).optional(),
    name: z.string().trim().min(2, 'Nama kluster minimal 2 karakter').max(150).refine(value=>value.toLowerCase()!=='belum ditugaskan','Nama ini digunakan oleh wilayah penampung outlet'),
    region: z.string().trim().min(2, 'Region minimal 2 karakter').max(100),
    colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Warna tidak valid').optional(),
    assignedSalesId: z.string().nullable().optional(),
    supervisorId: z.string().nullable().optional(),
  }),
});

export const updateClusterSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Nama kluster minimal 2 karakter').max(150).refine(value=>value.toLowerCase()!=='belum ditugaskan','Nama ini digunakan oleh wilayah penampung outlet').optional(),
    region: z.string().trim().min(2, 'Region minimal 2 karakter').max(100).optional(),
    colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Warna tidak valid').optional(),
    assignedSalesId: z.string().nullable().optional(),
    assignedSalesName: z.string().nullable().optional(),
    supervisorId: z.string().nullable().optional(),
    assignedSpvId: z.string().nullable().optional(),
    assignedSpvName: z.string().nullable().optional(),
    impactToken:z.string().optional(),
  }),
  params: z.object({
    id: z.string().min(1, 'ID tidak valid'),
  }),
});

export const getNearestOutletsSchema = z.object({
  body: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    count: z.number().int().min(1).max(100),
    type: z.enum(['GENERAL_TRADE', 'MODERN_TRADE']).optional(),
    supervisorId:z.string().trim().min(1).max(128).optional(),
  }),
});

export const generateRoutesSchema = z.object({
  body: z.object({
    outletIds: z.array(z.string().trim().min(1)).min(1).max(100),
  }),
});

export const createFullClusterSchema = z.object({
  body: z.object({
    code: z.string().trim().max(128).optional(),
    name: z.string().trim().min(2, 'Nama kluster minimal 2 karakter').max(150).refine(value=>value.toLowerCase()!=='belum ditugaskan','Nama ini digunakan oleh wilayah penampung outlet'),
    region: z.string().trim().min(2, 'Region minimal 2 karakter').max(100),
    color: z.string().optional(),
    colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Warna tidak valid').optional(),
    centerLat: z.number().min(-90).max(90).nullable().optional(),
    centerLng: z.number().min(-180).max(180).nullable().optional(),
    outletCount: z.number().int().optional(),
    assignedSalesId: z.string().nullable().optional(),
    supervisorId: z.string().nullable().optional(),
    assignedSpvId: z.string().nullable().optional(),
    outletIds: z.array(z.string().trim().min(1)).min(1).max(100),
    routes: z.array(z.object({
      routeIndex: z.number().int().optional(),
      isActive: z.boolean().optional(),
      totalDistanceKm: z.number().optional(),
      outletOrder: z.any(), // Json
      overviewPath: z.any().optional(), // Json
      startOutletId: z.string().nullable().optional(),
    })).optional(),
    impactToken:z.string().optional(),
  }),
});

export const updateOutletsSchema = z.object({
  params: z.object({ id: z.string().trim().min(1).max(128) }),
  body: z.object({
    outletIds: z.array(z.string().trim().min(1).max(128)),
    impactToken:z.string().optional(),
  }),
});

export const updateRoutesSchema = z.object({
  params: z.object({ id: z.string().trim().min(1).max(128) }),
  body: z.object({
    routes: z.array(z.object({
      routeIndex: z.number().int(),
      isActive: z.boolean(),
      totalDistanceKm: z.number(),
      outletOrder: z.any(),
      startOutletId: z.string().trim().min(1).max(128).optional(),
    })),
  }),
});

export const setActiveRouteSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1).max(128),
    routeIndex: z.string().regex(/^\d+$/),
  }),
});
