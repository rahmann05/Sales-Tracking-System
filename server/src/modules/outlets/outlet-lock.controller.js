import {
  lockOutlet,
  unlockOutletDirect,
  requestOutletUnlock,
  handleUnlockRequest,
  getUnlockRequests,
} from './outlet-lock.service.js';
import { successResponse } from '../../utils/response.js';

export const handleLockOutlet = async (req, res, next) => {
  try {
    const outlet = await lockOutlet(req.params.id);
    return successResponse(res, 200, outlet, 'Outlet berhasil dikunci');
  } catch (err) {
    next(err);
  }
};

export const handleUnlockOutletDirect = async (req, res, next) => {
  try {
    const outlet = await unlockOutletDirect(req.params.id);
    return successResponse(res, 200, outlet, 'Outlet berhasil dibuka kuncinya');
  } catch (err) {
    next(err);
  }
};

export const handleRequestUnlock = async (req, res, next) => {
  try {
    const request = await requestOutletUnlock(req.params.id, req.user.id, req.body.reason);
    return successResponse(res, 201, request, 'Permintaan buka kunci outlet terkirim, menunggu persetujuan Supervisor');
  } catch (err) {
    next(err);
  }
};

export const handleApproveOrRejectUnlock = async (req, res, next) => {
  try {
    const { approved } = req.body;
    const result = await handleUnlockRequest(req.params.requestId, req.user.id, approved);
    return successResponse(res, 200, result, result.message);
  } catch (err) {
    next(err);
  }
};

export const handleGetUnlockRequests = async (req, res, next) => {
  try {
    const requests = await getUnlockRequests(req.query);
    return successResponse(res, 200, requests, 'Daftar permintaan unlock berhasil diambil');
  } catch (err) {
    next(err);
  }
};
