import * as orderService from './orders.service.js';
import { successResponse } from '../../utils/response.js';

export const create = async (req, res, next) => {
  try {
    const { pjpStopId, items } = req.body;
    const data = await orderService.createOrder(req.user.id, pjpStopId, items);
    return successResponse(res, 201, data, 'Order berhasil dibuat');
  } catch (error) {
    next(error);
  }
};

export const getAll = async (req, res, next) => {
  try {
    const data = await orderService.getOrders(req.user, req.query);
    return successResponse(res, 200, data);
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const data = await orderService.getOrderById(req.params.id, req.user);
    return successResponse(res, 200, data);
  } catch (error) {
    next(error);
  }
};

export const approve = async (req, res, next) => {
  try {
    const data = await orderService.approveOrder(req.params.id, req.user.id);
    return successResponse(res, 200, data, 'Order berhasil disetujui');
  } catch (error) {
    next(error);
  }
};

export const reject = async (req, res, next) => {
  try {
    const data = await orderService.rejectOrder(req.params.id, req.user.id);
    return successResponse(res, 200, data, 'Order berhasil ditolak');
  } catch (error) {
    next(error);
  }
};
