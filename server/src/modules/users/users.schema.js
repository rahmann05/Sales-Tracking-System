import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Nama minimal 2 karakter'),
    email: z.string().email('Format email tidak valid'),
    password: z.string().min(6, 'Password minimal 6 karakter'),
    role: z.string().min(2, 'Role tidak valid'),
    clusterId: z.string().uuid('clusterId harus berformat UUID').optional().nullable(),
    permissions: z.record(z.boolean()).optional(),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
    role: z.string().min(2).optional(),
    clusterId: z.string().uuid().optional().nullable(),
  }),
  params: z.object({
    id: z.string().uuid('ID tidak valid'),
  }),
});

export const updatePasswordSchema = z.object({
  body: z.object({
    password: z.string().min(6, 'Password minimal 6 karakter'),
  }),
  params: z.object({
    id: z.string().uuid('ID tidak valid'),
  }),
});

export const updatePermissionsSchema = z.object({
  body: z.object({
    permissions: z.record(z.boolean(), { invalid_type_error: 'Permissions harus berupa objek dengan nilai boolean' }),
  }),
  params: z.object({
    id: z.string().uuid('ID tidak valid'),
  }),
});
