/** getClusters - single-responsibility service (extracted from clusters.service.js). */
import { prisma } from '../../../config/prisma.js';
import { cacheGetOrFetch, cacheInvalidate } from '../../../utils/cacheHelper.js';
import { CACHE_KEYS } from '../../../config/cache.js';


export const getClusters = async () => {
  return await cacheGetOrFetch(
    CACHE_KEYS.ALL_CLUSTERS,
    async () => {
      return await prisma.cluster.findMany({
        where: { deletedAt: null },
        include: { 
          _count: { select: { outlets: true, users: true } },
          routes: true,
          assignedSales: { select: { id: true, name: true, role: true } },
          supervisor: { select: { id: true, name: true, role: true } },
          users: { select: { id: true, name: true, role: true } }
        },
        orderBy: { name: 'asc' },
      });
    },
    300
  );
};
