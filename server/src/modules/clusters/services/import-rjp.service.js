import {assertClusterTrade} from './cluster-trade-policy.service.js';
import {z} from 'zod';
import {prisma} from '../../../config/prisma.js';
import {AppError} from '../../../utils/errors.js';
import {getDynamicConfig} from '../../config/config.service.js';
import {invalidateClusterCache} from './clusters.helpers.js';
import {broadcastCacheInvalidation} from '../../../config/socket.js';
import {cacheInvalidate} from '../../../utils/cacheHelper.js';
import {CACHE_KEYS} from '../../../config/cache.js';
import {resolveBusinessCode,assertCodeAvailable} from '../../config/services/business-code.service.js';
import {CODE_ENTITIES} from '../../../../../shared/coding.mjs';
const row=z.object({clusterName:z.string().trim().min(1),clusterCode:z.string().trim().max(128).optional(),outletCode:z.string().trim().min(1),customerName:z.string().trim().min(1),address:z.string().trim().min(1),area:z.string().trim().min(1),latitude:z.number().min(-90).max(90),longitude:z.number().min(-180).max(180),callFrequency:z.enum(['F1','F2','F4']).optional()});
export async function importRjp(raw,user){
  const rows=z.array(row).min(1).max(1000).parse(raw);
  if(new Set(rows.map(r=>r.outletCode)).size!==rows.length)throw new AppError('Kode outlet duplikat dalam berkas',400);
  const radius=await getDynamicConfig('DEFAULT_OUTLET_RADIUS_METERS',50);
  const result=await prisma.$transaction(async tx=>{
    let clusterCount=0;
    for(const r of rows){
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`import-cluster:${r.clusterName}`}))`;
      let cluster=await tx.cluster.findFirst({where:{name:r.clusterName,deletedAt:null}});
      if(cluster&&user.role==='SUPERVISOR'&&cluster.supervisorId!==user.id)throw new AppError('Klaster impor berada di luar tim Anda',403);
      if(!cluster){cluster=await tx.cluster.create({data:{code:await resolveBusinessCode('CLUSTER',r.clusterCode,{db:tx}),name:r.clusterName,region:r.area,...(user.role==='SUPERVISOR'?{supervisorId:user.id}:{})}});clusterCount++;}
      const existing=await tx.outlet.findUnique({where:{outletCode:r.outletCode},include:{cluster:true}});
      if(existing&&(existing.deletedAt||(user.role==='SUPERVISOR'&&existing.cluster.supervisorId!==user.id)))throw new AppError(`Kode ${r.outletCode} sudah dipakai di luar klaster aktif Anda`,409);
      await assertClusterTrade(tx,cluster.id,existing?.type || 'GENERAL_TRADE',existing?.id);
      const data={name:r.customerName,address:r.address,clusterId:cluster.id,latitude:r.latitude,longitude:r.longitude,itineraryCode:r.callFrequency};
      if(existing)await tx.outlet.update({where:{id:existing.id},data:{...data,validationStatus:'UNVALIDATED',validationConfidence:null,validatedAt:null,googleSuggestedLat:null,googleSuggestedLng:null,validationDetails:{coordinateHistory:existing.validationDetails?.coordinateHistory || []}}});
      else {
        await assertCodeAvailable(CODE_ENTITIES.find(e=>e.key==='OUTLET'),r.outletCode,tx);
        await tx.outlet.create({data:{...data,outletCode:r.outletCode,radiusMeters:radius}});
      }
    }
    return {importedOutletsCount:rows.length,importedClustersCount:clusterCount};
  },{timeout:60000});
  invalidateClusterCache();cacheInvalidate(CACHE_KEYS.ALL_OUTLETS);broadcastCacheInvalidation('outlets');broadcastCacheInvalidation('clusters');return result;
}
