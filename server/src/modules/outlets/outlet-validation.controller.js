/**
 * Outlet Validation Controller
 * Single Responsibility: Handle HTTP requests for outlet validation endpoints.
 * 1 File = 1 Controller
 */

import * as validationService from './outlet-validation.service.js';
import { successResponse } from '../../utils/response.js';

/**
 * POST /outlets/:id/validate
 * Validate a single outlet using 4-signal weighted scoring.
 */
export const validateSingle = async (req, res, next) => {
  try {
    const result = await validationService.validateOutlet(req.params.id);
    return successResponse(res, 200, result, 'Validasi outlet selesai');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /outlets/validation-summary
 * Get validation status summary counts for all outlets.
 */
export const getValidationSummary = async (req, res, next) => {
  try {
    const summary = await validationService.getValidationSummary();
    return successResponse(res, 200, summary);
  } catch (error) {
    next(error);
  }
};
