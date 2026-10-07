/** updateClusterRoutes - single-responsibility service (extracted from clusters.service.js). */
import { routeRecords } from './cluster-assignment-policy.service.js';
import { prisma } from '../../../config/prisma.js';
import { invalidateClusterCache } from './clusters.helpers.js';


export const updateClusterRoutes = async (id, routes) => {
  await prisma.$transaction(async (tx) => {
    const outlets = await tx.outlet.findMany({where:{clusterId:id,deletedAt:null},select:{id:true}});
    const records = routeRecords(id,routes,new Set(outlets.map(o=>o.id)));
    await tx.clusterRoute.deleteMany({ where: { clusterId: id } });
    if (routes && routes.length > 0) {
      const routesData = records;
      await tx.clusterRoute.createMany({ data: routesData });
    }
  });

  invalidateClusterCache(id);
  return { success: true };
};
