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
    const codes = req.body?.codes;
    if (codes != null && (typeof codes !== 'object' || Array.isArray(codes) || Object.values(codes).some(value=>typeof value !== 'string' || value.length>128))) return res.status(400).json({message:'Daftar kode PJP tidak valid'});
    const manualCodes=Object.values(codes || {}).map(value=>value.trim()).filter(Boolean);
    if(new Set(manualCodes).size!==manualCodes.length) return res.status(400).json({message:'Nomor PJP manual duplikat dalam pengajuan'});
    const result = await pjpService.generateDailyPjps(codes);
    return successResponse(res, 200, result, result.message);
  } catch (error) {
    next(error);
  }
};
