import { errorResponse } from '../utils/response.js';

export const notFoundHandler = (req, res) => {
  return errorResponse(res, 404, `Route ${req.originalUrl} not found`);
};
