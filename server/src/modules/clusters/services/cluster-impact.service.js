import {createHash} from 'node:crypto';
import {prisma} from '../../../config/prisma.js';
import {AppError} from '../../../utils/errors.js';
import {validateOutletAssignments} from './cluster-assignment-policy.service.js';
import {wibDayRange} from '../../../../../shared/visit-metrics.mjs';
export async function clusterImpact(raw,actor,db=prisma){
 const {clusterId,outletIds=[],supervisorId,assignedSalesId}=raw;
 if(!['ADMIN','SUPERVISOR'].includes(actor?.role))throw new AppError('Tidak berwenang mengatur wilayah',403);
 const target=clusterId?await db.cluster.findFirst({where:{id:clusterId,deletedAt:null},select:{id:true,name:true,supervisorId:true,assignedSalesId:true,updatedAt:true}}):null;
 if(clusterId&&!target)throw new AppError('Cluster tidak ditemukan',404);
 if(target&&actor.role==='SUPERVISOR'&&target.supervisorId!==actor.id)throw new AppError('Wilayah berada di luar tim Anda',403);
 await validateOutletAssignments(db,outletIds,actor);
 const members=await db.outlet.findMany({where:{deletedAt:null,OR:[{id:{in:outletIds}},...(clusterId?[{clusterId}]:[])]},select:{id:true,name:true,clusterId:true,updatedAt:true,cluster:{select:{name:true,supervisorId:true,assignedSalesId:true}}},orderBy:{id:'asc'}});
 const desired=new Set(outletIds),moves=members.filter(o=>desired.has(o.id)?o.clusterId!==clusterId:o.clusterId===clusterId).map(o=>({id:o.id,name:o.name,from:o.cluster.name,to:desired.has(o.id)?target?.name||'Cluster baru':'Belum Ditugaskan'}));
 const ownerChanged=!!target&&((supervisorId!==undefined&&supervisorId!==target.supervisorId)||(assignedSalesId!==undefined&&assignedSalesId!==target.assignedSalesId));
 const affected=members.filter(o=>moves.some(m=>m.id===o.id)||ownerChanged).map(o=>o.id);
 const [templates,plans,pjps]=await Promise.all([
  db.pjpTemplateStop.findMany({where:{outletId:{in:affected}},select:{outletId:true,pjpTemplate:{select:{id:true,updatedAt:true,user:{select:{name:true}},dayOfWeek:true,weekType:true}}}}),
  db.pjpPlan.findMany({where:{status:'DRAFT'},select:{id:true,name:true,rules:true,revision:true,supervisorId:true}}),
  db.pjpStop.findMany({where:{outletId:{in:affected},pjp:{date:{gte:wibDayRange().gte}}},select:{outletId:true,pjp:{select:{id:true,code:true,date:true,user:{select:{name:true}}}}}}),
 ]);
 const draftPlans=plans.filter(p=>p.rules.some(r=>affected.includes(r.outletId))).map(({rules,...p})=>p);
 const snapshot={target,members,outletIds:[...outletIds].sort(),supervisorId:supervisorId===undefined?target?.supervisorId??null:supervisorId,assignedSalesId:assignedSalesId===undefined?target?.assignedSalesId??null:assignedSalesId,ownerChanged,templates,draftPlans,pjps};
 return {token:createHash('sha256').update(JSON.stringify(snapshot)).digest('hex'),moves,ownerChanged,templates:templates.map(t=>({outletId:t.outletId,salesName:t.pjpTemplate.user.name,dayOfWeek:t.pjpTemplate.dayOfWeek,weekType:t.pjpTemplate.weekType})),draftPlans,publishedPjps:[...new Map(pjps.map(s=>[s.pjp.id,s.pjp])).values()],requiresConfirmation:ownerChanged||moves.some(m=>m.from!=='Belum Ditugaskan')};
}
export async function requireClusterImpact(db,raw,actor,token){
 const review=await clusterImpact(raw,actor,db);
 if(review.requiresConfirmation&&review.token!==token)throw new AppError('Tinjau kembali dampak perubahan wilayah sebelum menyimpan. Data mungkin sudah berubah.',409);
 const affected=review.ownerChanged?await db.outlet.findMany({where:{clusterId:raw.clusterId},select:{id:true}}):review.moves;
 if(affected.length&&await db.outletFieldTask.count({where:{status:{in:['OPEN','SUBMITTED']},review:{outletId:{in:affected.map(o=>o.id)}}}}))throw new AppError('Ada tugas pemeriksaan outlet yang masih berjalan pada wilayah yang berubah. Selesaikan atau batalkan tugas beralasan sebelum memindahkan wilayah/PIC.',409);
 return review;
}
