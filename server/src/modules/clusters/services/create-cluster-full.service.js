/** createClusterFull - single-responsibility service (extracted from clusters.service.js). */
import { validateAssignments, validateOutletAssignments, routeRecords, synchronizeOutletCounts } from './cluster-assignment-policy.service.js';
import { prisma } from '../../../config/prisma.js';
import { cacheInvalidate } from '../../../utils/cacheHelper.js';
import { CACHE_KEYS } from '../../../config/cache.js';
import { broadcastCacheInvalidation } from '../../../config/socket.js';
import { invalidateClusterCache } from './clusters.helpers.js';
import { resolveBusinessCode } from '../../config/services/business-code.service.js';
import {requireClusterImpact} from './cluster-impact.service.js';


export const createClusterFull = async (data, actor) => {
  const { outletIds, routes, assignedSalesId, assignedSpvId, supervisorId, color, colorHex, impactToken, ...rest } = data;

  const validSalesId = assignedSalesId && assignedSalesId.trim() !== '' ? assignedSalesId : null;
  const finalSpvId = supervisorId || assignedSpvId || null;
  const clusterColorHex = colorHex || color || '#3b82f6';

  const affected=new Set();
  const result = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('planning:territories'))`;
    await requireClusterImpact(tx,{outletIds,supervisorId:finalSpvId,assignedSalesId:validSalesId},actor,impactToken);
    await validateAssignments(tx,data,actor);
    const outlets = await validateOutletAssignments(tx,outletIds || [],actor);
    outlets.forEach(outlet=>affected.add(outlet.clusterId));
    await tx.clusterRoute.deleteMany({where:{clusterId:{in:[...affected]}}});
    // 1. Create Cluster
    const cluster = await tx.cluster.create({
      data: {
        ...rest,
        code: await resolveBusinessCode('CLUSTER',data.code,{db:tx}),
        colorHex: clusterColorHex,
        assignedSalesId: validSalesId,
        supervisorId: finalSpvId,
        outletCount: outletIds?.length || 0,
      }
    });

    // 2. Assign Outlets to Cluster
    if (outletIds && outletIds.length > 0) {
      await tx.outlet.updateMany({
        where: { id: { in: outletIds } },
        data: { clusterId: cluster.id }
      });
    }

    // 3. Create Routes
    if (routes && routes.length > 0) {
      const routesData = routeRecords(cluster.id,routes,new Set(outletIds || []));
      await tx.clusterRoute.createMany({ data: routesData });
    }

    if (validSalesId) await tx.user.updateMany({where:{id:validSalesId,clusterId:null},data:{clusterId:cluster.id}});
    await synchronizeOutletCounts(tx,[cluster.id,...outlets.map(o=>o.clusterId)]);
    return cluster;
  });

  // Invalidate Caches
  invalidateClusterCache();
  for(const clusterId of affected)invalidateClusterCache(clusterId);
  cacheInvalidate(CACHE_KEYS.ALL_OUTLETS);
  broadcastCacheInvalidation('outlets');

  return result;
};
