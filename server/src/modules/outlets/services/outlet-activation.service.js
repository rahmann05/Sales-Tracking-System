import { z } from 'zod';
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import {outletOperationalImpact} from './outlet-operational-impact.service.js';
import { reviewScope,lockOutlet } from './outlet-review-policy.service.js';
import { recordOutletChange } from './outlet-change-policy.service.js';
import { synchronizeOutletCounts } from '../../clusters/services/cluster-assignment-policy.service.js';
import { invalidateClusterCache } from '../../clusters/services/clusters.helpers.js';
const request=z.object({updatedAt:z.string().datetime(),reason:z.string().trim().min(10).max(1000)});
export async function changeOutletActivation(id,raw,actor,active) {
  const body=request.parse(raw);
  const result=await prisma.$transaction(async tx=>{
    await lockOutlet(tx,id);const scope=await reviewScope(actor,tx);delete scope.deletedAt;
    const outlet=await tx.outlet.findFirst({where:{id,...scope}});
    if(!outlet)throw new AppError('Outlet tidak ditemukan dalam cakupan Anda',404);
    if(Boolean(outlet.deletedAt)===!active)throw new AppError('Status outlet sudah berubah. Muat ulang.',409);
    if(!active) {
      const impact=await outletOperationalImpact(tx,id);
      if(Object.values(impact).some(n=>n>0))throw new AppError(`Selesaikan atau sesuaikan pekerjaan terlebih dahulu: ${impact.scheduled} stop PJP, ${impact.activeVisits} kunjungan aktif, ${impact.orders} order terbuka, ${impact.deliveries} pengiriman, ${impact.packing} packing list.`,409);
    }
    const data={deletedAt:active?null:new Date()};
    await recordOutletChange(tx,outlet,data,{actor,...body,source:'ACTIVATION'});
    const updated=await tx.outlet.update({where:{id},data});
    await synchronizeOutletCounts(tx,[outlet.clusterId]);await tx.clusterRoute.deleteMany({where:{clusterId:outlet.clusterId}});
    return updated;
  });
  invalidateClusterCache(result.clusterId);return result;
}
