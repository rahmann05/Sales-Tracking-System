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
