import {getDynamicConfig} from '../../config/config.service.js';
import {assertClusterTrade} from '../../clusters/services/cluster-trade-policy.service.js';
/** createOutlet - single-responsibility service (extracted from outlets.service.js). */
import { prisma } from '../../../config/prisma.js';
import { invalidateOutletCache } from './outlets.helpers.js';
import { resolveBusinessCode } from '../../config/services/business-code.service.js';
import {synchronizeOutletCounts} from '../../clusters/services/cluster-assignment-policy.service.js';
import {invalidateClusterCache} from '../../clusters/services/clusters.helpers.js';
import {assertNoUnreviewedDuplicate} from './outlet-duplicates.service.js';
import {actorSnapshot} from './outlet-review-policy.service.js';
import {assertOutletLegal,assertOutletTrade,assertRequestReplay} from './outlet-data-policy.service.js';


export const createOutlet = async (raw,actor) => {
  const {duplicateReason,...data}=raw;
  assertOutletLegal(data);
  if(!data.subChannel)data.subChannel=data.channel==='MODERN_TRADE'?'CHAIN_MINIMARKET':'TOKO_RETAIL';
  assertOutletTrade(data);
  if(data.locationEvidence)data.locationEvidence={...data.locationEvidence,actor:actorSnapshot(actor),at:new Date().toISOString()};
  if(data.channel)data.type=data.channel;
  if(data.radiusMeters==null)data.radiusMeters=await getDynamicConfig('DEFAULT_OUTLET_RADIUS_METERS',50);
  const result = await prisma.$transaction(async tx=>{
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('planning:territories'))`;
    if(data.requestId) {const existing=await tx.outlet.findUnique({where:{requestId:data.requestId},include:{changes:{orderBy:{createdAt:'asc'},take:1}}});if(existing)return assertRequestReplay(existing,data,actor,existing.changes[0]?.actor?.id);}
    if(actor)await assertNoUnreviewedDuplicate(tx,data,actor,duplicateReason);
    await assertClusterTrade(tx,data.clusterId,data.type || data.channel || 'GENERAL_TRADE');
    const outletCode=await resolveBusinessCode('OUTLET',data.outletCode,{db:tx});
    const outlet=await tx.outlet.create({data:{...data,outletCode}});
    await tx.outletChange.create({data:{outletId:outlet.id,actor:actorSnapshot(actor),reason:duplicateReason || 'Pembuatan master outlet',source:'MASTER',before:{},after:{name:outlet.name,address:outlet.address,latitude:outlet.latitude,longitude:outlet.longitude,clusterId:outlet.clusterId}}});
    await synchronizeOutletCounts(tx,[data.clusterId]);
    await tx.clusterRoute.deleteMany({where:{clusterId:data.clusterId}});
    return outlet;
  });
  invalidateOutletCache();
  invalidateClusterCache(data.clusterId);
  return result;
};
