import { errorResponse } from '../utils/response.js';
import { AppError } from '../utils/errors.js';
import { ZodError } from 'zod';

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
    return errorResponse(res, 400, 'Validasi gagal', formattedErrors);
  }

  // Handle Prisma / Database operational errors
  if (err.code === 'P2002') {
    return errorResponse(res, 409, `Data dengan field ${err.meta?.target || ''} sudah ada`);
  }
  if (err.code === 'P2025') {
    return errorResponse(res, 404, 'Data tidak ditemukan');
  }

  return errorResponse(res, 500, err.message || 'Internal Server Error');
};
