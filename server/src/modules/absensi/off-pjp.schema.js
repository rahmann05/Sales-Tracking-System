import { z } from 'zod';

export const createOffPjpAttendanceSchema = z.object({
  body: z.object({
    outletName: z.string().min(2, 'Nama outlet minimal 2 karakter'),
    customerName: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().min(5, 'Alamat minimal 5 karakter'),
    reason: z.string().min(5, 'Alasan kunjungan minimal 5 karakter'),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    photoUrl: z.string().url().optional().nullable(),
    outletId: z.string().uuid().optional(), // Link ke outlet DB jika diketahui
  }),
});

export const validateOffPjpSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID tidak valid'),
  }),
  body: z.object({
    approved: z.boolean({ required_error: 'Field approved (true/false) wajib diisi' }),
    rejectionNote: z.string().optional(),
  }),
});

export const offPjpQuerySchema = z.object({
  query: z.object({
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
    userId: z.string().uuid().optional(),
    date: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});
