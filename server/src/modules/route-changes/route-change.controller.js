import * as routeChangeService from './route-change.service.js';
import { successResponse } from '../../utils/response.js';

export const reportClosed = async (req, res, next) => {
  try {
    const { pjpStopId, reason, photoUrl } = req.body;
    const data = await routeChangeService.reportClosedOutlet(req.user.id, pjpStopId, reason, photoUrl);
    return successResponse(res, 201, data, 'Laporan outlet tutup berhasil dikirim');
  } catch (error) {
    next(error);
  }
};

export const reroute = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { replacementOutletId } = req.body;
    const data = await routeChangeService.submitReroute(req.user.id, id, replacementOutletId);
    return successResponse(res, 200, data, 'Pengajuan reroute dikirim ke Manajer Operasional');
  } catch (error) {
    next(error);
  }
};

export const skip = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await routeChangeService.submitSkip(req.user.id, id);
    return successResponse(res, 200, data, 'Instruksi skip outlet berhasil diproses');
  } catch (error) {
    next(error);
  }
};

export const approve = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await routeChangeService.approveReroute(req.user.id, id);
    return successResponse(res, 200, data, 'Reroute berhasil disetujui');
  } catch (error) {
    next(error);
  }
};

export const reject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await routeChangeService.rejectReroute(req.user.id, id);
    return successResponse(res, 200, data, 'Reroute berhasil ditolak');
  } catch (error) {
    next(error);
  }
};

export const getAll = async (req, res, next) => {
  try {
    const data = await routeChangeService.getRouteChanges(req.query);
    return successResponse(res, 200, data);
  } catch (error) {
    next(error);
  }
};
