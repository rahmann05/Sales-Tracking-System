/** getClusters - single-responsibility service (extracted from clusters.service.js). */
import { prisma } from '../../../config/prisma.js';
import { cacheGetOrFetch } from "../../../utils/cacheHelper.js";
import { CACHE_KEYS } from '../../../config/cache.js';


export const getClusters = async () => {
  return await cacheGetOrFetch(
    CACHE_KEYS.ALL_CLUSTERS,
    async () => {
      return await prisma.cluster.findMany({
        where: { deletedAt: null },
        include: {
          outlets:{where:{deletedAt:null},select:{type:true}},
          _count: { select: { outlets: {where:{deletedAt:null}}, users: {where:{deletedAt:null}} } },
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
