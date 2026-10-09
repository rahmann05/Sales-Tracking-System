import {assertClusterTrade} from './cluster-trade-policy.service.js';
import {prisma} from '../../../config/prisma.js';
import {AppError} from '../../../utils/errors.js';
import {getDynamicConfig} from '../../config/config.service.js';
import {invalidateClusterCache} from './clusters.helpers.js';
import {broadcastCacheInvalidation} from '../../../config/socket.js';
import {cacheInvalidate} from '../../../utils/cacheHelper.js';
import {CACHE_KEYS} from '../../../config/cache.js';
import {resolveBusinessCode,assertCodeAvailable} from '../../config/services/business-code.service.js';
import {CODE_ENTITIES} from '../../../../../shared/coding.mjs';
import {importRows,previewRjpImport} from './rjp-import-preview.service.js';
import {synchronizeOutletCounts} from './cluster-assignment-policy.service.js';
export async function importRjp(raw,user,impactToken){
  const rows=importRows.parse(raw);
  if(new Set(rows.map(r=>r.outletCode)).size!==rows.length)throw new AppError('Kode outlet duplikat dalam berkas',400);
  const radius=await getDynamicConfig('DEFAULT_OUTLET_RADIUS_METERS',50);
  const result=await prisma.$transaction(async tx=>{
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('planning:territories'))`;
    const preview=await previewRjpImport(rows,user,tx);
    if(preview.summary.updated&&preview.token!==impactToken)throw new AppError('Tinjau kembali perubahan impor sebelum menerapkan. Data mungkin sudah berubah.',409);
    const affected=new Set();
    let clusterCount=0;
    for(const r of rows){
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`import-cluster:${r.clusterName}`}))`;
      let cluster=await tx.cluster.findFirst({where:{...(r.clusterCode?{code:r.clusterCode}:{name:r.clusterName}),deletedAt:null}});
      if(cluster&&user.role==='SUPERVISOR'&&cluster.supervisorId!==user.id)throw new AppError('Klaster impor berada di luar tim Anda',403);
      if(!cluster){cluster=await tx.cluster.create({data:{code:await resolveBusinessCode('CLUSTER',r.clusterCode,{db:tx}),name:r.clusterName,region:r.area,...(user.role==='SUPERVISOR'?{supervisorId:user.id}:{})}});clusterCount++;}
      const existing=await tx.outlet.findUnique({where:{outletCode:r.outletCode},include:{cluster:true}});
      affected.add(cluster.id);if(existing)affected.add(existing.clusterId);
      if(existing&&(existing.deletedAt||(user.role==='SUPERVISOR'&&existing.cluster.supervisorId!==user.id)))throw new AppError(`Kode ${r.outletCode} sudah dipakai di luar klaster aktif Anda`,409);
      await assertClusterTrade(tx,cluster.id,existing?.type || 'GENERAL_TRADE',existing?.id);
      const data={name:r.customerName,address:r.address,clusterId:cluster.id,latitude:r.latitude,longitude:r.longitude,itineraryCode:r.callFrequency};
      if(existing)await tx.outlet.update({where:{id:existing.id},data:{...data,validationStatus:'UNVALIDATED',validationConfidence:null,validatedAt:null,googleSuggestedLat:null,googleSuggestedLng:null,validationDetails:{coordinateHistory:existing.validationDetails?.coordinateHistory || []}}});
      else {
        await assertCodeAvailable(CODE_ENTITIES.find(e=>e.key==='OUTLET'),r.outletCode,tx);
        await tx.outlet.create({data:{...data,outletCode:r.outletCode,radiusMeters:radius}});
      }
    }
    await tx.clusterRoute.deleteMany({where:{clusterId:{in:[...affected]}}});
    await synchronizeOutletCounts(tx,[...affected]);
    return {importedOutletsCount:rows.length,importedClustersCount:clusterCount,summary:preview.summary};
  },{timeout:60000});
  invalidateClusterCache();cacheInvalidate(CACHE_KEYS.ALL_OUTLETS);broadcastCacheInvalidation('outlets');broadcastCacheInvalidation('clusters');return result;
}
