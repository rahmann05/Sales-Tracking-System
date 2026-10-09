/** deleteOutlet - single-responsibility service (extracted from outlets.service.js). */
import { prisma } from '../../../config/prisma.js';
import { invalidateOutletCache } from './outlets.helpers.js';
import {synchronizeOutletCounts} from '../../clusters/services/cluster-assignment-policy.service.js';
import {invalidateClusterCache} from '../../clusters/services/clusters.helpers.js';


export const deleteOutlet = async (id) => {
  const result = await prisma.$transaction(async tx=>{
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('planning:territories'))`;
    const outlet=await tx.outlet.update({where:{id},data:{deletedAt:new Date()}});
    await synchronizeOutletCounts(tx,[outlet.clusterId]);
    await tx.clusterRoute.deleteMany({where:{clusterId:outlet.clusterId}});
    return outlet;
  });
  invalidateOutletCache();
  invalidateClusterCache(result.clusterId);
  return result;
};
