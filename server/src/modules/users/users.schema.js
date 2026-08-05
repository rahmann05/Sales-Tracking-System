import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Nama minimal 2 karakter'),
    email: z.string().email('Format email tidak valid'),
    password: z.string().min(6, 'Password minimal 6 karakter'),
    role: z.enum(['SALES', 'DRIVER', 'HELPER', 'SUPERVISOR', 'ADMIN', 'MANAJER_OPERASIONAL'], {
      errorMap: () => ({ message: 'Role tidak valid' }),
    }),
    clusterId: z.string().uuid('clusterId harus berformat UUID').optional(),
    salesId: z.string().uuid('salesId harus berformat UUID').optional(),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
    role: z.enum(['SALES', 'DRIVER', 'HELPER', 'SUPERVISOR', 'ADMIN', 'MANAJER_OPERASIONAL']).optional(),
    clusterId: z.string().uuid().optional().nullable(),
    salesId: z.string().uuid().optional().nullable(),
  }),
  params: z.object({
    id: z.string().uuid('ID tidak valid'),
  }),
});
