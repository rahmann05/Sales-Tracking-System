/** updateClusterOutlets - single-responsibility service (extracted from clusters.service.js). */
import { validateOutletAssignments, synchronizeOutletCounts } from './cluster-assignment-policy.service.js';
import { AppError } from '../../../utils/errors.js';
import { prisma } from '../../../config/prisma.js';
import { cacheInvalidate } from '../../../utils/cacheHelper.js';
import { CACHE_KEYS } from '../../../config/cache.js';
import { broadcastCacheInvalidation } from '../../../config/socket.js';
import { invalidateClusterCache } from './clusters.helpers.js';
import {requireClusterImpact} from './cluster-impact.service.js';


export const updateClusterOutlets = async (id, outletIds, actor, impactToken) => {
  // Ini memerlukan un-assign outlet lama dan assign outlet baru.
  // Untuk kesederhanaan saat manual edit, kita tidak otomatis re-generate rute di server.
  // Rute harus di-re-generate client dan dikirim via updateRoutes.
  
  const affected=new Set([id]);
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('planning:territories'))`;
    await requireClusterImpact(tx,{clusterId:id,outletIds},actor,impactToken);
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`cluster-trade:${id}`}))`;
    const target=await tx.cluster.findFirst({where:{id,deletedAt:null},select:{id:true}});
    if(!target)throw new AppError('Kluster tidak ditemukan',404);
    const outlets = await validateOutletAssignments(tx,outletIds,actor);
    let unassignedCluster;
    // Cari outlet yang sebelumnya di cluster ini tapi sekarang tidak ada
    const removedOutlets = await tx.outlet.findMany({
      where: { clusterId: id, deletedAt:null,id: { notIn: outletIds } },
      select: { id: true, type:true },
    });

    for(const type of new Set(removedOutlets.map(outlet=>outlet.type))) {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`unassigned:${type}`}))`;
      unassignedCluster=await tx.cluster.findFirst({where:{name:'Belum Ditugaskan',deletedAt:null,outlets:{none:{deletedAt:null,type:{not:type}}}}});
      if(!unassignedCluster)unassignedCluster=await tx.cluster.create({data:{name:'Belum Ditugaskan',region:type==='MODERN_TRADE'?'Modern Trade':'General Trade'}});
      affected.add(unassignedCluster.id);
      await tx.outlet.updateMany({where:{id:{in:removedOutlets.filter(outlet=>outlet.type===type).map(outlet=>outlet.id)}},data:{clusterId:unassignedCluster.id}});
    }

    // Assign outlet baru
    if (outletIds.length > 0) {
      await tx.outlet.updateMany({
        where: { id: { in: outletIds } },
        data: { clusterId: id }
      });
    }
    outlets.forEach(outlet=>affected.add(outlet.clusterId));
    if(unassignedCluster)affected.add(unassignedCluster.id);
    await tx.clusterRoute.deleteMany({where:{clusterId:{in:[...affected]}}});
    await synchronizeOutletCounts(tx,[...affected]);
  });

  for(const clusterId of affected)invalidateClusterCache(clusterId);
  cacheInvalidate(CACHE_KEYS.ALL_OUTLETS);
  broadcastCacheInvalidation('outlets');
  return { success: true };
};
