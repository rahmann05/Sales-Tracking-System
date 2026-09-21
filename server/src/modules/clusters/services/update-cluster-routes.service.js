/** updateClusterRoutes - single-responsibility service (extracted from clusters.service.js). */
import { prisma } from '../../../config/prisma.js';
import { invalidateClusterCache } from './clusters.helpers.js';


export const updateClusterRoutes = async (id, routes) => {
  await prisma.$transaction(async (tx) => {
    await tx.clusterRoute.deleteMany({ where: { clusterId: id } });
    if (routes && routes.length > 0) {
      const routesData = routes.map(r => ({ ...r, clusterId: id }));
      await tx.clusterRoute.createMany({ data: routesData });
    }
  });

  invalidateClusterCache(id);
  return { success: true };
};
