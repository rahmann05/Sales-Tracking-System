import {assertClusterTrade} from '../../clusters/services/cluster-trade-policy.service.js';
/** createOutlet - single-responsibility service (extracted from outlets.service.js). */
import { prisma } from '../../../config/prisma.js';
import { invalidateOutletCache } from './outlets.helpers.js';
import { resolveBusinessCode } from '../../config/services/business-code.service.js';
import {synchronizeOutletCounts} from '../../clusters/services/cluster-assignment-policy.service.js';
import {invalidateClusterCache} from '../../clusters/services/clusters.helpers.js';


export const createOutlet = async (data) => {
  const result = await prisma.$transaction(async tx=>{
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('planning:territories'))`;
    await assertClusterTrade(tx,data.clusterId,data.type || data.channel || 'GENERAL_TRADE');
    const outletCode=await resolveBusinessCode('OUTLET',data.outletCode,{db:tx});
    const outlet=await tx.outlet.create({data:{...data,outletCode}});
    await synchronizeOutletCounts(tx,[data.clusterId]);
    await tx.clusterRoute.deleteMany({where:{clusterId:data.clusterId}});
    return outlet;
  });
  invalidateOutletCache();
  invalidateClusterCache(data.clusterId);
  return result;
};
