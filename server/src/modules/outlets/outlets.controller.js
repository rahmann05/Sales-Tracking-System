import * as outletService from './outlets.service.js';
import { successResponse } from '../../utils/response.js';

export const getAll = async (req, res, next) => {
  try {
    const data = await outletService.getOutlets(req.query);
    return successResponse(res, 200, data);
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const data = await outletService.getOutletById(req.params.id);
    return successResponse(res, 200, data);
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const data = await outletService.createOutlet(req.body);
    return successResponse(res, 201, data, 'Outlet berhasil dibuat');
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const data = await outletService.updateOutlet(req.params.id, req.body);
    return successResponse(res, 200, data, 'Outlet berhasil diperbarui');
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    await outletService.deleteOutlet(req.params.id);
    return successResponse(res, 200, null, 'Outlet berhasil dihapus');
  } catch (error) {
    next(error);
  }
};
