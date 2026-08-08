import {
  createOffPjpAttendance,
  getOffPjpAttendances,
  validateOffPjpAttendance,
} from './off-pjp.service.js';
import { successResponse } from '../../utils/response.js';

export const submitOffPjpAttendance = async (req, res, next) => {
  try {
    const data = await createOffPjpAttendance(req.user.id, req.body);
    return successResponse(res, 201, data, 'Absen toko luar RJP berhasil dicatat, menunggu validasi Supervisor');
  } catch (err) {
    next(err);
  }
};

export const listOffPjpAttendances = async (req, res, next) => {
  try {
    const result = await getOffPjpAttendances(req.user, req.query);
    return successResponse(res, 200, result, 'Daftar absen toko luar RJP berhasil diambil');
  } catch (err) {
    next(err);
  }
};

export const handleValidateOffPjpAttendance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { approved, rejectionNote } = req.body;
    const updated = await validateOffPjpAttendance(id, req.user.id, approved, rejectionNote);
    return successResponse(res, 200, updated, approved ? 'Absen luar RJP divalidasi' : 'Absen luar RJP ditolak');
  } catch (err) {
    next(err);
  }
};
