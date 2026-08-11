import { z } from 'zod';

export const createClusterSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Nama cluster minimal 2 karakter'),
    region: z.string().min(2, 'Region minimal 2 karakter'),
    colorHex: z.string().optional(),
  }),
});

export const updateClusterSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    region: z.string().min(2).optional(),
    colorHex: z.string().optional(),
  }),
  params: z.object({
    id: z.string().uuid('ID tidak valid'),
  }),
});

export const getNearestOutletsSchema = z.object({
  body: z.object({
    lat: z.number(),
    lng: z.number(),
    count: z.number().int().min(1),
  }),
});

export const generateRoutesSchema = z.object({
  body: z.object({
    outletIds: z.array(z.string()),
  }),
});

export const createFullClusterSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    region: z.string().min(2),
    color: z.string().optional(),
    centerLat: z.number().nullable().optional(),
    centerLng: z.number().nullable().optional(),
    outletCount: z.number().int().optional(),
    assignedSalesId: z.string().uuid().nullable().optional(),
    outletIds: z.array(z.string()),
    routes: z.array(z.object({
      routeIndex: z.number().int(),
      isActive: z.boolean(),
      totalDistanceKm: z.number(),
      outletOrder: z.any(), // Json
      overviewPath: z.any().optional(), // Json
      startOutletId: z.string().uuid().nullable().optional(),
    })).optional(),
  }),
});

export const updateOutletsSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    outletIds: z.array(z.string().uuid()),
  }),
});

export const updateRoutesSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    routes: z.array(z.object({
      routeIndex: z.number().int(),
      isActive: z.boolean(),
      totalDistanceKm: z.number(),
      outletOrder: z.any(),
      startOutletId: z.string().uuid().optional(),
    })),
  }),
});

export const setActiveRouteSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
    routeIndex: z.string().regex(/^\d+$/),
  }),
});
