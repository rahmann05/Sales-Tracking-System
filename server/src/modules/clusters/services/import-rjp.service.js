import {assertClusterTrade} from './cluster-trade-policy.service.js';
import {createHash} from 'node:crypto';
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
import {recordOutletChange} from '../../outlets/services/outlet-change-policy.service.js';
import {actorSnapshot} from '../../outlets/services/outlet-review-policy.service.js';
export async function importRjp(raw,user,impactToken){
  const rows=importRows.parse(raw);
  if(!['ADMIN','SUPERVISOR'].includes(user.role))throw new AppError('Tidak berwenang mengimpor wilayah',403);
  if(new Set(rows.map(r=>r.outletCode)).size!==rows.length)throw new AppError('Kode outlet duplikat dalam berkas',400);
  const radius=await getDynamicConfig('DEFAULT_OUTLET_RADIUS_METERS',50);
  const result=await prisma.$transaction(async tx=>{
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('planning:territories'))`;
    const requestHash=createHash('sha256').update(JSON.stringify(rows)).digest('hex');
    const receipt=impactToken?await tx.auditEvent.findFirst({where:{entityType:'RJP_IMPORT',entityId:impactToken,actorId:user.id||null,action:'RJP_IMPORT_APPLIED'},orderBy:{createdAt:'desc'}}):null;
    if(receipt){
      if(receipt.after.requestHash!==requestHash)throw new AppError('Pratinjau ini sudah diterapkan untuk isian berbeda. Periksa kembali berkas impor.',409);
      return receipt.after.result;
    }
    const preview=await previewRjpImport(rows,user,tx);
    if(preview.token!==impactToken)throw new AppError('Tinjau kembali perubahan impor sebelum menerapkan. Data atau pilihan impor mungkin sudah berubah.',409);
    const affected=new Set();
    let clusterCount=0;
    for(const r of rows){
      if(preview.changes.find(c=>c.outletCode===r.outletCode)?.action==='SKIP')continue;
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`import-cluster:${r.clusterName}`}))`;
      let cluster=await tx.cluster.findFirst({where:{...(r.clusterCode?{code:r.clusterCode}:{name:r.clusterName}),deletedAt:null}});
      if(cluster&&user.role==='SUPERVISOR'&&cluster.supervisorId!==user.id)throw new AppError('Klaster impor berada di luar tim Anda',403);
      if(!cluster){cluster=await tx.cluster.create({data:{code:await resolveBusinessCode('CLUSTER',r.clusterCode,{db:tx}),name:r.clusterName,region:r.area,...(user.role==='SUPERVISOR'?{supervisorId:user.id}:{})}});clusterCount++;}
      const existing=await tx.outlet.findUnique({where:{outletCode:r.outletCode},include:{cluster:true}});
      affected.add(cluster.id);if(existing)affected.add(existing.clusterId);
      if(existing&&(existing.deletedAt||(user.role==='SUPERVISOR'&&existing.cluster.supervisorId!==user.id)))throw new AppError(`Kode ${r.outletCode} sudah dipakai di luar klaster aktif Anda`,409);
      await assertClusterTrade(tx,cluster.id,existing?.type || 'GENERAL_TRADE',existing?.id);
      const data={name:r.customerName,address:r.address,clusterId:cluster.id,latitude:r.latitude,longitude:r.longitude,itineraryCode:r.callFrequency};
      if(existing) {
        const audit=await recordOutletChange(tx,existing,data,{actor:user,reason:'Impor RJP setelah pratinjau dampak disetujui',source:'IMPORT',updatedAt:existing.updatedAt.toISOString()});
        await tx.outlet.update({where:{id:existing.id},data:{...data,...audit}});
      }
      else {
        await assertCodeAvailable(CODE_ENTITIES.find(e=>e.key==='OUTLET'),r.outletCode,tx);
        const outlet=await tx.outlet.create({data:{...data,outletCode:r.outletCode,radiusMeters:radius,source:'IMPORT',locationEvidence:{source:'IMPORT',actor:actorSnapshot(user),at:new Date().toISOString()}}});
        await tx.outletChange.create({data:{outletId:outlet.id,actor:actorSnapshot(user),reason:'Pembuatan master melalui impor RJP',source:'IMPORT',before:{},after:data}});
      }
    }
    await tx.clusterRoute.deleteMany({where:{clusterId:{in:[...affected]}}});
    await synchronizeOutletCounts(tx,[...affected]);
    const applied={importedOutletsCount:preview.summary.created+preview.summary.updated,importedClustersCount:clusterCount,summary:preview.summary};
    await tx.auditEvent.create({data:{entityType:'RJP_IMPORT',entityId:preview.token,action:'RJP_IMPORT_APPLIED',actorId:user.id||null,actorName:user.name||null,before:{},after:{requestHash,result:applied,choices:rows.map(r=>({outletCode:r.outletCode,importAction:r.importAction})),changes:preview.changes}}});
    return applied;
  },{timeout:60000});
  invalidateClusterCache();cacheInvalidate(CACHE_KEYS.ALL_OUTLETS);broadcastCacheInvalidation('outlets');broadcastCacheInvalidation('clusters');return result;
}
