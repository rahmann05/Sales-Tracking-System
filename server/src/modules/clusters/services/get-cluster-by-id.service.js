/** getClusterById - single-responsibility service (extracted from clusters.service.js). */
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { cacheGetOrFetch, cacheInvalidate } from '../../../utils/cacheHelper.js';
import { CACHE_KEYS } from '../../../config/cache.js';


export const getClusterById = async (id) => {
  return await cacheGetOrFetch(
    CACHE_KEYS.CLUSTER_BY_ID(id),
    async () => {
      const cluster = await prisma.cluster.findUnique({
        where: { id },
        include: { 
          outlets: { where: { deletedAt: null } },
          routes: true,
          assignedSales: { select: { id: true, name: true, role: true } },
          supervisor: { select: { id: true, name: true, role: true } },
          users: { select: { id: true, name: true, role: true } }
        },
      });
      if (!cluster || cluster.deletedAt) {
        throw new AppError('Cluster tidak ditemukan', 404);
      }
      return cluster;
    },
    300
  );
};
