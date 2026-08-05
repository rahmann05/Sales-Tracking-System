import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    sku: z.string().min(1, 'SKU wajib diisi'),
    name: z.string().min(2, 'Nama produk minimal 2 karakter'),
    price: z.number({ required_error: 'Harga wajib diisi' }).positive('Harga harus lebih dari 0'),
  }),
});

export const updateProductSchema = z.object({
  body: z.object({
    sku: z.string().min(1).optional(),
    name: z.string().min(2).optional(),
    price: z.number().positive().optional(),
  }),
  params: z.object({
    id: z.string().uuid('ID tidak valid'),
  }),
});
