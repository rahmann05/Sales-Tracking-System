import * as deliveryService from './delivery.service.js';
import { AppError } from '../../utils/errors.js';

// ═══════════════════════════════════════════════════════════════
// Packing List Controllers
// ═══════════════════════════════════════════════════════════════

export const createPackingList = async (req, res, next) => {
  try {
    const result = await deliveryService.createPackingList(req.body, req.user.id);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const getPackingLists = async (req, res, next) => {
  try {
    const result = await deliveryService.getPackingLists(req.query);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const getPackingListById = async (req, res, next) => {
  try {
    const result = await deliveryService.getPackingListById(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const deletePackingList = async (req, res, next) => {
  try {
    const result = await deliveryService.deletePackingList(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// ═══════════════════════════════════════════════════════════════
// Delivery Route Controllers
// ═══════════════════════════════════════════════════════════════

export const createDeliveryRoute = async (req, res, next) => {
  try {
    const result = await deliveryService.createDeliveryRoute(req.body, req.user.id);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const getDeliveryRoutes = async (req, res, next) => {
  try {
    const result = await deliveryService.getDeliveryRoutes(req.query, req.user.id, req.user.role);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const getDeliveryRouteById = async (req, res, next) => {
  try {
    const result = await deliveryService.getDeliveryRouteById(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const updateRouteStatus = async (req, res, next) => {
  try {
    const result = await deliveryService.updateRouteStatus(req.params.id, req.body.status);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const deleteDeliveryRoute = async (req, res, next) => {
  try {
    const result = await deliveryService.deleteDeliveryRoute(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// ═══════════════════════════════════════════════════════════════
// Delivery Stop / Attendance Controllers
// ═══════════════════════════════════════════════════════════════

export const submitDriverAttendance = async (req, res, next) => {
  try {
    const result = await deliveryService.submitDriverAttendance(req.params.id, req.body, req.user.id);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const updateStopStatus = async (req, res, next) => {
  try {
    const result = await deliveryService.updateStopStatus(req.params.id, req.body, req.user.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// ═══════════════════════════════════════════════════════════════
// Dashboard Controller
// ═══════════════════════════════════════════════════════════════

export const getDashboard = async (req, res, next) => {
  try {
    const result = await deliveryService.getDashboard(req.query);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const getDrivers = async (req, res, next) => {
  try {
    const result = await deliveryService.getDrivers();
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};
