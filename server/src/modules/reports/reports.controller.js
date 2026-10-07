import { scopeQuery } from '../../utils/team-scope.js';
import * as reportService from './reports.service.js';
import { successResponse } from '../../utils/response.js';

export const getDashboard = async (req, res, next) => {
  try {
    const data = await reportService.getDashboardSummary(scopeQuery(req.query, req.user));
    return successResponse(res, 200, data);
  } catch (error) {
    next(error);
  }
};

export const getSalesReport = async (req, res, next) => {
  try {
    const data = await reportService.getSalesReport(scopeQuery(req.query, req.user));
    return successResponse(res, 200, data);
  } catch (error) {
    next(error);
  }
};

export const getOutletReport = async (req, res, next) => {
  try {
    const data = await reportService.getOutletReport(scopeQuery(req.query, req.user));
    return successResponse(res, 200, data);
  } catch (error) {
    next(error);
  }
};

export const getWeeklyReport = async (req, res, next) => {
  try {
    const scope = {};
    if (req.user.role === 'SALES') scope.userId = req.user.id;
    if (req.user.role === 'SUPERVISOR') scope.supervisorId = req.user.id;
    const data = await reportService.getWeeklyReport({ ...req.query, ...scope });
    return successResponse(res, 200, data, 'Weekly Performance Report berhasil dimuat');
  } catch (error) {
    next(error);
  }
};

export const getMtdReport = async (req, res, next) => {
  try {
    const scope = {};
    if (req.user.role === 'SALES') scope.userId = req.user.id;
    if (req.user.role === 'SUPERVISOR') scope.supervisorId = req.user.id;
    const data = await reportService.getMtdReport({ ...req.query, ...scope });
    return successResponse(res, 200, data, 'Month-to-Date (MTD) Report berhasil dimuat');
  } catch (error) {
    next(error);
  }
};
