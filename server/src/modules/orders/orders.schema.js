import { z } from 'zod';

const orderItemSchema = z.object({
  productId: z.string().uuid('productId harus berformat UUID'),
  quantity: z.number().int().positive('Kuantitas harus lebih dari 0'),
  unitPrice: z.number().positive().optional(),
});

export const createOrderSchema = z.object({
  body: z.object({
    pjpStopId: z.string().uuid('pjpStopId harus berformat UUID'),
    items: z
      .array(orderItemSchema)
      .min(1, 'Minimal harus ada 1 item dalam order'),
    paymentType: z.enum(['CASH', 'CREDIT', 'TRANSFER']).optional(),
  }),
});
