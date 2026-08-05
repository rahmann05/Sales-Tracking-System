import * as absensiService from './absensi.service.js';
import { successResponse } from '../../utils/response.js';

export const checkIn = async (req, res, next) => {
  try {
    const { pjpStopId } = req.params;
    const { latitude, longitude, photoUrl } = req.body;
    const data = await absensiService.checkIn(pjpStopId, req.user.id, parseFloat(latitude), parseFloat(longitude), photoUrl);
    return successResponse(res, 201, data, 'Absen IN berhasil');
  } catch (error) {
    next(error);
  }
};

export const checkOut = async (req, res, next) => {
  try {
    const { pjpStopId } = req.params;
    const { latitude, longitude, photoUrl } = req.body;
    const data = await absensiService.checkOut(pjpStopId, req.user.id, parseFloat(latitude), parseFloat(longitude), photoUrl);
    return successResponse(res, 201, data, 'Absen OUT berhasil');
  } catch (error) {
    next(error);
  }
};

export const history = async (req, res, next) => {
  try {
    const data = await absensiService.getAttendanceHistory(req.user.id, req.query);
    return successResponse(res, 200, data);
  } catch (error) {
    next(error);
  }
};

export const getPjpRecap = async (req, res, next) => {
  try {
    const data = await absensiService.getPjpAttendanceRecap(req.params.pjpId);
    return successResponse(res, 200, data);
  } catch (error) {
    next(error);
  }
};
