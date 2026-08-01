import { errorResponse } from '../utils/response.js';

export const errorHandler = (err, req, res, _next) => {
  console.error('[Error Middleware]:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const errors = process.env.NODE_ENV === 'development' ? err.stack : null;

  return errorResponse(res, statusCode, message, errors);
};
