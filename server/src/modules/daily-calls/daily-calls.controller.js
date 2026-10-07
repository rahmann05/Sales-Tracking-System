import { scopeQuery } from '../../utils/team-scope.js';
import * as dailyCallsService from './daily-calls.service.js';
import { successResponse } from '../../utils/response.js';

export const getDailyCalls = async (req, res, next) => {
  try {
    const report = await dailyCallsService.getDailyCallReport(scopeQuery(req.query, req.user));
    return successResponse(res, 200, report, 'Daily Call Report berhasil dimuat');
  } catch (err) {
    next(err);
  }
};

