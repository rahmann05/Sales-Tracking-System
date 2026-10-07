import { scopeQuery } from '../../utils/team-scope.js';
import * as pjpService from './pjp.service.js';
import { successResponse } from '../../utils/response.js';

export const getTodayPjp = async (req, res, next) => {
  try {
    const data = await pjpService.getTodayPjp(req.user.id);
    if (!data) {
      return successResponse(res, 200, null, 'Tidak ada PJP yang dijadwalkan untuk hari ini');
    }
    return successResponse(res, 200, data);
  } catch (error) {
    next(error);
  }
};

export const getAllPjps = async (req, res, next) => {
  try {
    const data = await pjpService.getAllPjps(scopeQuery(req.query, req.user));
    return successResponse(res, 200, data);
  } catch (error) {
    next(error);
  }
};

export const getPjpById = async (req, res, next) => {
  try {
    const data = await pjpService.getPjpById(req.params.id, req.user);
    return successResponse(res, 200, data);
  } catch (error) {
    next(error);
  }
};

export const generatePjps = async (req, res, next) => {
  try {
    const result = await pjpService.generateDailyPjps();
    return successResponse(res, 200, result, result.message);
  } catch (error) {
    next(error);
  }
};
