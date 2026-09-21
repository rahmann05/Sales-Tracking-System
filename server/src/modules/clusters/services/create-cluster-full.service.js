/** createClusterFull - single-responsibility service (extracted from clusters.service.js). */
import { prisma } from '../../../config/prisma.js';
import { cacheGetOrFetch, cacheInvalidate } from '../../../utils/cacheHelper.js';
import { CACHE_KEYS } from '../../../config/cache.js';
import { broadcastCacheInvalidation } from '../../../config/socket.js';
import { invalidateClusterCache } from './clusters.helpers.js';


export const createClusterFull = async (data) => {
  const { outletIds, routes, assignedSalesId, assignedSpvId, supervisorId, color, colorHex, ...rest } = data;

  const validSalesId = assignedSalesId && assignedSalesId.trim() !== '' ? assignedSalesId : null;
  const finalSpvId = supervisorId || assignedSpvId || null;
  const clusterColorHex = colorHex || color || '#3b82f6';

  const result = await prisma.$transaction(async (tx) => {
    // 1. Create Cluster
    const cluster = await tx.cluster.create({
      data: {
        ...rest,
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
      const routesData = routes.map((r, i) => ({
        clusterId: cluster.id,
        routeIndex: r.routeIndex ?? i,
        isActive: Boolean(r.isActive),
        totalDistanceKm: Number(r.totalDistanceKm || 0),
        outletOrder: r.outletOrder || [],
        overviewPath: r.overviewPath || null,
        startOutletId: r.startOutletId && r.startOutletId.trim() !== '' ? r.startOutletId : null,
      }));
      await tx.clusterRoute.createMany({ data: routesData });
    }

    return cluster;
  });

  if (validSalesId) {
    await prisma.user.update({
      where: { id: validSalesId },
      data: { clusterId: result.id }
    }).catch(e => console.warn('[createClusterFull] User cluster sync notice:', e.message));
  }

  // Invalidate Caches
  invalidateClusterCache();
  cacheInvalidate(CACHE_KEYS.ALL_OUTLETS);
  broadcastCacheInvalidation('outlets');

  return result;
};
