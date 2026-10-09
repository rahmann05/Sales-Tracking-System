import { z } from 'zod';
export const salesLocationSchema=z.object({body:z.object({latitude:z.number().finite().min(-90).max(90),longitude:z.number().finite().min(-180).max(180),accuracy:z.number().finite().nonnegative().nullable().optional(),observedAt:z.string().datetime().nullable().optional(),speed:z.number().finite().nonnegative().nullable().optional(),heading:z.number().finite().min(0).max(360).nullable().optional(),battery:z.number().finite().min(0).max(1).nullable().optional()})});

export const createUserSchema = z.object({
  body: z.object({
    staffCode: z.string().trim().max(128).optional(),
    name: z.string().min(2, 'Nama minimal 2 karakter'),
    email: z.string().email('Format email tidak valid'),
    password: z.string().min(6, 'Password minimal 6 karakter'),
    role: z.string().min(2, 'Role tidak valid'),
    clusterId: z.string().min(1).max(128).optional().nullable(),
    permissions: z.record(z.boolean()).optional(),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
    role: z.string().min(2).optional(),
    clusterId: z.string().min(1).max(128).optional().nullable(),
  }),
  params: z.object({
    id: z.string().min(1).max(128),
  }),
});

export const updatePasswordSchema = z.object({
  body: z.object({
    password: z.string().min(6, 'Password minimal 6 karakter'),
  }),
  params: z.object({
    id: z.string().min(1).max(128),
  }),
});

export const updatePermissionsSchema = z.object({
  body: z.object({
    permissions: z.record(z.boolean(), { invalid_type_error: 'Permissions harus berupa objek dengan nilai boolean' }),
  }),
  params: z.object({
    id: z.string().min(1).max(128),
  }),
});
