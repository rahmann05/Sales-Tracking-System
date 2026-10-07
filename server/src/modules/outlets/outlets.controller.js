import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/errors.js';
import * as outletService from './outlets.service.js';
import { successResponse } from '../../utils/response.js';

export const getAll = async (req, res, next) => {
  try {
    const data = await outletService.getOutlets(req.query,req.user);
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

async function assertTargetCluster(req) {
  if (!req.body.clusterId) return;
  const cluster=await prisma.cluster.findFirst({where:{id:req.body.clusterId,deletedAt:null,...(req.user.role==='SUPERVISOR'?{supervisorId:req.user.id}: {})},select:{id:true}});
  if(!cluster)throw new AppError('Klaster tujuan berada di luar penugasan',403);
}

export const create = async (req, res, next) => {
  try {
    await assertTargetCluster(req);
    const data = await outletService.createOutlet(req.body);
    return successResponse(res, 201, data, 'Outlet berhasil dibuat');
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    await assertTargetCluster(req);
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
