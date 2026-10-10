import {prisma} from '../../../config/prisma.js';
import {AppError} from '../../../utils/errors.js';
import {getPlan} from './planning.service.js';
import {cancelScheduleBody} from './planning-schema.js';
import {teamPlanningPolicy} from './planning-policy.service.js';
import {wibDateKey} from '../../../../../shared/visit-metrics.mjs';
import {broadcastCacheInvalidation} from '../../../config/socket.js';
export async function cancelPublishedPlan(id,raw,actor){
 const body=cancelScheduleBody.parse(raw);
 const result=await prisma.$transaction(async tx=>{
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('planning:territories'))`;
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`pjp-plan:${id}`}))`;
  const plan=await getPlan(id,actor,tx),last=plan.history.at(-1);
  if(last?.action==='CANCEL_PUBLISHED'&&last.revision===body.revision&&last.actorId===actor.id&&last.note===body.note)return plan;
  if(plan.status!=='PUBLISHED'||plan.revision!==body.revision)throw new AppError('Rencana berubah atau tidak lagi berstatus diterbitkan. Muat ulang.',409);
  const {values}=await teamPlanningPolicy(plan.supervisorId);
  if(values.PJP_ALLOW_CANCEL_PUBLISHED===false)throw new AppError('Pembatalan PJP terbit dinonaktifkan untuk tim ini.',409);
  if(values.PJP_PUBLISH_ROLE!=='BOTH'&&values.PJP_PUBLISH_ROLE!==actor.role)throw new AppError('Role Anda tidak dapat membatalkan penerbitan tim ini.',403);
  const pjps=await tx.pjp.findMany({where:{reportingContext:{path:['planning','planId'],equals:id}},orderBy:{id:'asc'}});
  const cancelled=[],retained=[];
  for(const pjp of pjps){
   await tx.$queryRaw`SELECT id FROM "Pjp" WHERE id=${pjp.id} FOR UPDATE`;
   await tx.$queryRaw`SELECT id FROM "PjpStop" WHERE "pjpId"=${pjp.id} FOR UPDATE`;
   const current=await tx.pjp.findUnique({where:{id:pjp.id},include:{stops:{include:{_count:{select:{attendances:true,orders:true,routeChanges:true}}}},_count:{select:{routeChanges:true,derivedPjps:true}}}});
   const active=current.status!=='SCHEDULED'||wibDateKey(current.date)<wibDateKey()||current._count.routeChanges||current._count.derivedPjps||current.stops.some(s=>s.status!=='PENDING'||s.visitSession||s.validationTaskId||s.validationResult||s._count.attendances||s._count.orders||s._count.routeChanges);
   const record={id:current.id,code:current.code,userId:current.userId,date:wibDateKey(current.date),stops:current.stops.map(s=>({id:s.id,outletId:s.outletId,sequence:s.sequence}))};
   if(active){retained.push({...record,reason:'Tanggal lampau atau memiliki aktivitas/relasi operasional.'});continue;}
   // Only empty agendas are removed; immutable plan history keeps their identifiers and reason.
   await tx.pjp.delete({where:{id:current.id}});cancelled.push(record);
  }
  if(!cancelled.length)throw new AppError('Tidak ada PJP tanpa aktivitas yang dapat dibatalkan. PJP lampau/beraktivitas tetap dipertahankan.',409);
  return tx.pjpPlan.update({where:{id},data:{status:'CANCELLED',revision:plan.revision+1,updatedBy:actor.id,history:[...plan.history,{action:'CANCEL_PUBLISHED',at:new Date().toISOString(),actorId:actor.id,note:body.note,revision:body.revision,cancelled,retained}]}});
 },{isolationLevel:'Serializable',timeout:60000});
 broadcastCacheInvalidation('pjp');return result;
}
