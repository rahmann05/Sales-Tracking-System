/** setActiveRoute - single-responsibility service (extracted from clusters.service.js). */
import { AppError } from '../../../utils/errors.js';
import { prisma } from '../../../config/prisma.js';
import { invalidateClusterCache } from './clusters.helpers.js';


export const setActiveRoute = async (id, routeIndex) => {
  await prisma.$transaction(async (tx) => {
    if (!await tx.clusterRoute.findFirst({where:{clusterId:id,routeIndex},select:{id:true}})) throw new AppError('Rute tidak ditemukan',404);
    await tx.clusterRoute.updateMany({
      where: { clusterId: id },
      data: { isActive: false }
    });
    await tx.clusterRoute.updateMany({
      where: { clusterId: id, routeIndex },
      data: { isActive: true }
    });
  });

  invalidateClusterCache(id);
  return { success: true };
};
