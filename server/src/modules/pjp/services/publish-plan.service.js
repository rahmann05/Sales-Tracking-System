import {teamPlanningPolicy} from './planning-policy.service.js';
import {prisma} from '../../../config/prisma.js';
import {AppError} from '../../../utils/errors.js';
import {getPlan,previewPlan} from './planning.service.js';
import {publishBody} from './planning-schema.js';
import {wibDateKey,wibDayRange} from '../../../../../shared/visit-metrics.mjs';
import {resolveBusinessCode,getCodePolicy} from '../../config/services/business-code.service.js';
import {captureReportAssignment} from '../../reports/services/report-assignment.service.js';
import {broadcastCacheInvalidation} from '../../../config/socket.js';
import {assertPublicationReview,publicationFingerprint} from './publication-review.service.js';
import {ruleSalesAt} from '../../../../../shared/pjp-planning.mjs';
export async function publishPlan(id,raw,actor,scheduled=null){
 const body=publishBody.parse(raw);
 const result=await prisma.$transaction(async tx=>{
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('planning:territories'))`;
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`pjp-plan:${id}`}))`;
  const plan=await getPlan(id,actor,tx);
  if(scheduled&&(plan.status!=='SCHEDULED'||plan.publicationSchedule?.token!==scheduled.token||plan.revision!==body.revision))return {plan,count:0,skipped:true};
  if(plan.status==='PUBLISHED')return {plan,count:plan.history.findLast(h=>h.action==='PUBLISH')?.count||0,replayed:true};
  if(!scheduled&&plan.status!=='DRAFT')throw new AppError('Batalkan jadwal penerbitan terlebih dahulu sebelum menerbitkan secara manual.',409);
  if(scheduled&&+plan.scheduledAt>Date.now())throw new AppError('Waktu penerbitan belum tiba.',409);
  const values=(await teamPlanningPolicy(plan.supervisorId)).values,role=values.PJP_PUBLISH_ROLE;
  if(scheduled&&values.PJP_ALLOW_SCHEDULED_PUBLISH===false)throw new AppError('Penerbitan terjadwal dinonaktifkan oleh parameter tim. Tinjau ulang rencana.',409);
  if(role!=='BOTH'&&role!==actor.role)throw new AppError('Kebijakan tim ini tidak mengizinkan role Anda menerbitkan PJP',403);
  if(plan.revision!==body.revision)throw new AppError('Draft telah berubah. Tinjau ulang sebelum menerbitkan.',409);
  if(plan.startsOn<wibDateKey())throw new AppError('Penerbitan tidak boleh membuat PJP pada tanggal yang sudah lewat. Ubah periode draft.',400);
  for(const userId of [...new Set(plan.rules.flatMap(r=>[r.userId,...(r.substitute?[r.substitute.userId]:[])]))].sort())await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`team:${userId}`}))`;
  const review=await previewPlan(plan,actor,tx),policy=await getCodePolicy('PJP'),days=assertPublicationReview(review,body,policy);
  if(scheduled&&publicationFingerprint(plan,review,values,policy)!==plan.publicationSchedule.fingerprint)throw new AppError('Kalender, cakupan, kode atau aturan tim berubah sejak dijadwalkan. Tinjau kalender lalu jadwalkan ulang.',409);
  let count=0;
  for(const day of days.sort((a,b)=>`${a.userId}:${a.date}`.localeCompare(`${b.userId}:${b.date}`))){
   await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`pjp:${day.userId}:${day.date}`}))`;
   if(await tx.pjp.findFirst({where:{userId:day.userId,type:'SALES',date:wibDayRange(day.date)},select:{id:true}}))throw new AppError(`${day.salesName}: PJP ${day.date} sudah diterbitkan. Gunakan perubahan rute terkontrol.`,409);
   const duplicate=await tx.pjpStop.findFirst({where:{outletId:{in:day.outletIds},pjp:{date:wibDayRange(day.date),type:'SALES'}},select:{outlet:{select:{name:true}}}});
   if(duplicate)throw new AppError(`${duplicate.outlet.name} sudah memiliki kunjungan pada ${day.date}.`,409);
   const person=review.context.sales.find(s=>s.id===day.userId),code=body.codes[`${day.userId}:${day.date}`];
   if(policy.mode==='MANUAL'&&!code)throw new AppError(`Isi kode PJP ${day.salesName} ${day.date}.`,422);
   const context=captureReportAssignment(person,'PJP_PLAN',new Date());
   await tx.pjp.create({data:{...context,reportingContext:{...context.reportingContext,planning:{planId:id,revision:plan.revision,rules:plan.rules.filter(r=>ruleSalesAt(r,day.date)===day.userId&&day.outletIds.includes(r.outletId)).map(r=>({...r,primarySalesName:review.context.sales.find(s=>s.id===r.userId)?.name||null,...(r.substitute?{substitute:{...r.substitute,salesName:review.context.sales.find(s=>s.id===r.substitute.userId)?.name||null}}:{})})),publishedBy:actor.id}},code:await resolveBusinessCode('PJP',code,{db:tx,date:new Date(`${day.date}T05:00:00Z`)}),userId:day.userId,date:wibDayRange(day.date).gte,type:'SALES',status:'SCHEDULED',stops:{create:day.outletIds.map((outletId,i)=>({outletId,sequence:i+1,status:'PENDING'}))}}});count++;
  }
  const event={at:new Date().toISOString(),action:'PUBLISH',actorId:actor.id,note:body.note,count,scheduled:!!scheduled,acknowledgeWarnings:body.acknowledgeWarnings,uncovered:review.uncovered.map(o=>o.id),calendar:review.calendar};
  const published=await tx.pjpPlan.update({where:{id},data:{status:'PUBLISHED',publishedAt:new Date(),scheduledAt:null,publicationNextAttemptAt:null,...(scheduled?{publicationSchedule:{...plan.publicationSchedule,state:'PUBLISHED'}}:{}),updatedBy:actor.id,revision:plan.revision+1,history:[...plan.history,event]}});
  return {plan:published,count,replayed:false};
 },{timeout:60000});
 broadcastCacheInvalidation('pjp');return result;
}
