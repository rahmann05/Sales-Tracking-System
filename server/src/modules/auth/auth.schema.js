import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().min(1, 'Email atau Username wajib diisi'),
    password: z.string().min(1, 'Password wajib diisi'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string({ required_error: 'Refresh token wajib diisi' }),
  }),
});
