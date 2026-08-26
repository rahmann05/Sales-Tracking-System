import { errorResponse } from '../utils/response.js';
import { AppError } from '../utils/errors.js';
import { ZodError } from 'zod';
import { config } from '../config/index.js';

export const errorHandler = (err, req, res, next) => {
  console.error('[Error Middleware]:', err);

  if (err instanceof AppError) {
    return errorResponse(res, err.statusCode, err.message, err.errors);
  }

  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return errorResponse(res, 400, 'Validasi input gagal', formattedErrors);
  }

  // Handle Prisma / Database operational errors
  if (err.code === 'P2002') {
    return errorResponse(res, 409, `Data dengan field ${err.meta?.target || ''} sudah terdaftar`);
  }
  if (err.code === 'P2025') {
    return errorResponse(res, 404, 'Data yang diminta tidak ditemukan');
  }

  // Sanitize internal server errors in production to prevent information disclosure
  const safeMessage =
    config.env === 'production'
      ? 'Terjadi kesalahan internal pada server'
      : err.message || 'Internal Server Error';

  return errorResponse(res, 500, safeMessage);
};
