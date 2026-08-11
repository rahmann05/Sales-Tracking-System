import * as clusterService from './clusters.service.js';
import { successResponse } from '../../utils/response.js';

export const getAll = async (req, res, next) => {
  try {
    const data = await clusterService.getClusters();
    return successResponse(res, 200, data);
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const data = await clusterService.getClusterById(req.params.id);
    return successResponse(res, 200, data);
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const data = await clusterService.createCluster(req.body);
    return successResponse(res, 201, data, 'Cluster berhasil dibuat');
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const data = await clusterService.updateCluster(req.params.id, req.body);
    return successResponse(res, 200, data, 'Cluster berhasil diperbarui');
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    await clusterService.deleteCluster(req.params.id);
    return successResponse(res, 200, null, 'Cluster berhasil dihapus');
  } catch (error) {
    next(error);
  }
};

export const getNearestOutlets = async (req, res, next) => {
  try {
    const { lat, lng, count, type } = req.body;
    const data = await clusterService.getNearestOutlets(lat, lng, count, type);
    return successResponse(res, 200, data);
  } catch (error) {
    next(error);
  }
};

export const generateRoutes = async (req, res, next) => {
  try {
    const { outletIds } = req.body;
    const data = await clusterService.generateClusterRoutes(outletIds);
    return successResponse(res, 200, data);
  } catch (error) {
    next(error);
  }
};

export const createFull = async (req, res, next) => {
  try {
    const data = await clusterService.createClusterFull(req.body);
    return successResponse(res, 201, data, 'Cluster berhasil dibuat');
  } catch (error) {
    next(error);
  }
};

export const updateOutlets = async (req, res, next) => {
  try {
    const { outletIds } = req.body;
    const data = await clusterService.updateClusterOutlets(req.params.id, outletIds);
    return successResponse(res, 200, data, 'Outlet cluster berhasil diperbarui');
  } catch (error) {
    next(error);
  }
};

export const updateRoutes = async (req, res, next) => {
  try {
    const { routes } = req.body;
    const data = await clusterService.updateClusterRoutes(req.params.id, routes);
    return successResponse(res, 200, data, 'Rute referensi berhasil diperbarui');
  } catch (error) {
    next(error);
  }
};

export const setActiveRoute = async (req, res, next) => {
  try {
    const routeIndex = parseInt(req.params.routeIndex, 10);
    const data = await clusterService.setActiveRoute(req.params.id, routeIndex);
    return successResponse(res, 200, data, 'Rute aktif berhasil diubah');
  } catch (error) {
    next(error);
  }
};
