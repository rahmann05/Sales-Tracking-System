import { getHealthStatus } from '../services/health.service.js';
import { successResponse } from '../utils/response.js';

export const checkHealth = async (req, res, next) => {
  try {
    const healthData = await getHealthStatus();
    return successResponse(res, 200, 'Server health status retrieved successfully', healthData);
  } catch (error) {
    next(error);
  }
};
