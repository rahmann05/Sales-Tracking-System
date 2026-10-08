import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    sku: z.string().trim().max(128).optional(),
    code: z.string().trim().max(128).optional(),
    name: z.string().min(2, 'Nama produk minimal 2 karakter'),
    unit:z.string().trim().min(1).max(32),
    baseUnit:z.string().trim().min(1).max(32),
    unitsPerUnit:z.number().int().min(1).max(1000000),
    stock: z.number().int().min(0).optional(),
    price: z.number({ required_error: 'Harga wajib diisi' }).positive('Harga harus lebih dari 0'),
  }),
});

export const updateProductSchema = z.object({
  body: z.object({
    sku: z.string().min(1).optional(),
    code: z.string().trim().max(128).optional(),
    name: z.string().min(2).optional(),
    unit:z.string().trim().min(1).max(32).optional(),
    baseUnit:z.string().trim().min(1).max(32).optional(),
    unitsPerUnit:z.number().int().min(1).max(1000000).optional(),
    price: z.number().positive().optional(),
    stock: z.number().int().min(0).optional(),
  }),
  params: z.object({
    id: z.string().uuid('ID tidak valid'),
  }),
});
