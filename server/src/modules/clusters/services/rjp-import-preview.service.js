import {createHash} from 'node:crypto';
import {z} from 'zod';
import {prisma} from '../../../config/prisma.js';
import {AppError} from '../../../utils/errors.js';
import {wibDayRange} from '../../../../../shared/visit-metrics.mjs';
export const importRows=z.array(z.object({clusterName:z.string().trim().min(1),clusterCode:z.string().trim().max(128).optional(),outletCode:z.string().trim().min(1),customerName:z.string().trim().min(1),address:z.string().trim().min(1),area:z.string().trim().min(1),latitude:z.number().min(-90).max(90),longitude:z.number().min(-180).max(180),callFrequency:z.enum(['F1','F2','F4']).optional()})).min(1).max(1000);
export async function previewRjpImport(raw,user,db=prisma){
 const rows=importRows.parse(raw);
 if(!['ADMIN','SUPERVISOR'].includes(user.role))throw new AppError('Tidak berwenang mengimpor wilayah',403);
 if(new Set(rows.map(r=>r.outletCode)).size!==rows.length)throw new AppError('Kode outlet duplikat dalam berkas',400);
 const [outlets,clusters]=await Promise.all([
  db.outlet.findMany({where:{outletCode:{in:rows.map(r=>r.outletCode)}},include:{cluster:true},orderBy:{id:'asc'}}),
  db.cluster.findMany({where:{deletedAt:null,OR:[{name:{in:rows.map(r=>r.clusterName)}},{code:{in:rows.map(r=>r.clusterCode).filter(Boolean)}}]},orderBy:{id:'asc'}}),
 ]);
 const changes=rows.map(r=>{
  const matches=clusters.filter(c=>r.clusterCode?c.code===r.clusterCode:c.name===r.clusterName);
  if(matches.length>1)throw new AppError(`Nama cluster ${r.clusterName} tidak unik. Gunakan kode cluster.`,400);
  const target=matches[0],old=outlets.find(o=>o.outletCode===r.outletCode);
  if(target&&user.role==='SUPERVISOR'&&target.supervisorId!==user.id)throw new AppError('Cluster impor berada di luar tim Anda',403);
  if(old&&(old.deletedAt||(user.role==='SUPERVISOR'&&old.cluster.supervisorId!==user.id)))throw new AppError(`Kode ${r.outletCode} berada di luar wilayah aktif Anda`,409);
  return {outletCode:r.outletCode,name:r.customerName,action:old?'UPDATE':'CREATE',from:old?.cluster.name||'Outlet baru',to:r.clusterName,moved:!!old&&old.clusterId!==target?.id,coordinatesChanged:!!old&&(old.latitude!==r.latitude||old.longitude!==r.longitude)};
 });
 const ids=outlets.map(o=>o.id),[templates,drafts,pjps]=await Promise.all([
  db.pjpTemplateStop.findMany({where:{outletId:{in:ids}},select:{id:true,pjpTemplateId:true},orderBy:{id:'asc'}}),
  db.pjpPlan.findMany({where:{status:'DRAFT'},select:{id:true,name:true,revision:true,rules:true},orderBy:{id:'asc'}}),
  db.pjpStop.findMany({where:{outletId:{in:ids},pjp:{type:'SALES',date:{gte:wibDayRange().gte}}},select:{id:true,pjpId:true},orderBy:{id:'asc'}}),
 ]);
 const affectedDrafts=drafts.filter(p=>p.rules.some(r=>ids.includes(r.outletId))).map(({rules,...p})=>p),impact={templateReferences:templates.length,draftPlans:affectedDrafts,publishedPjps:new Set(pjps.map(p=>p.pjpId)).size};
 return {token:createHash('sha256').update(JSON.stringify({rows,outlets:outlets.map(o=>({id:o.id,updatedAt:o.updatedAt,clusterId:o.clusterId})),clusters:clusters.map(c=>({id:c.id,updatedAt:c.updatedAt})),templates,affectedDrafts,pjps})).digest('hex'),changes,impact,summary:{created:changes.filter(c=>c.action==='CREATE').length,updated:changes.filter(c=>c.action==='UPDATE').length,moved:changes.filter(c=>c.moved).length,coordinatesChanged:changes.filter(c=>c.coordinatesChanged).length}};
}
