import {prisma} from '../../../config/prisma.js';
import {AppError} from '../../../utils/errors.js';
import {getPlan,previewPlan} from './planning.service.js';
import {publishBody} from './planning-schema.js';
import {wibDateKey,wibDayRange} from '../../../../../shared/visit-metrics.mjs';
import {resolveBusinessCode,getCodePolicy} from '../../config/services/business-code.service.js';
import {captureReportAssignment} from '../../reports/services/report-assignment.service.js';
import {broadcastCacheInvalidation} from '../../../config/socket.js';
export async function publishPlan(id,raw,actor){
 const body=publishBody.parse(raw);
 const result=await prisma.$transaction(async tx=>{
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('planning:territories'))`;
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`pjp-plan:${id}`}))`;
  const plan=await getPlan(id,actor,tx);
  if(plan.status==='PUBLISHED')return {plan,count:plan.history.findLast(h=>h.action==='PUBLISH')?.count||0,replayed:true};
  if(plan.revision!==body.revision)throw new AppError('Draft telah berubah. Tinjau ulang sebelum menerbitkan.',409);
  if(plan.startsOn<wibDateKey())throw new AppError('Penerbitan tidak boleh membuat PJP pada tanggal yang sudah lewat. Ubah periode draft.',400);
  for(const userId of [...new Set(plan.rules.map(r=>r.userId))].sort())await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`team:${userId}`}))`;
  const review=await previewPlan(plan,actor,tx),days=review.days.filter(d=>d.outletIds.length);
  if(review.problems.length)throw new AppError(review.problems.slice(0,5).map(p=>p.message).join(' '),409);
  if(!days.length)throw new AppError('Tidak ada kunjungan yang jatuh tempo dalam periode ini.',400);
  if((review.warnings.length||review.uncovered.length)&&!body.acknowledgeWarnings)throw new AppError('Tinjau dan akui peringatan cakupan/frekuensi sebelum menerbitkan.',400);
  const policy=await getCodePolicy('PJP'),codes=Object.values(body.codes);
  if(new Set(codes).size!==codes.length)throw new AppError('Kode PJP manual duplikat',400);
  let count=0;
  for(const day of days.sort((a,b)=>`${a.userId}:${a.date}`.localeCompare(`${b.userId}:${b.date}`))){
   await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`pjp:${day.userId}:${day.date}`}))`;
   if(await tx.pjp.findFirst({where:{userId:day.userId,type:'SALES',date:wibDayRange(day.date)},select:{id:true}}))throw new AppError(`${day.salesName}: PJP ${day.date} sudah diterbitkan. Gunakan perubahan rute terkontrol.`,409);
   const duplicate=await tx.pjpStop.findFirst({where:{outletId:{in:day.outletIds},pjp:{date:wibDayRange(day.date),type:'SALES'}},select:{outlet:{select:{name:true}}}});
   if(duplicate)throw new AppError(`${duplicate.outlet.name} sudah memiliki kunjungan pada ${day.date}.`,409);
   const person=review.context.sales.find(s=>s.id===day.userId),code=body.codes[`${day.userId}:${day.date}`];
   if(policy.mode==='MANUAL'&&!code)throw new AppError(`Isi kode PJP ${day.salesName} ${day.date}.`,422);
   const context=captureReportAssignment(person,'PJP_PLAN',new Date());
   await tx.pjp.create({data:{...context,reportingContext:{...context.reportingContext,planning:{planId:id,revision:plan.revision,rules:plan.rules.filter(r=>r.userId===day.userId&&day.outletIds.includes(r.outletId)),publishedBy:actor.id}},code:await resolveBusinessCode('PJP',code,{db:tx,date:new Date(`${day.date}T05:00:00Z`)}),userId:day.userId,date:wibDayRange(day.date).gte,type:'SALES',status:'SCHEDULED',stops:{create:day.outletIds.map((outletId,i)=>({outletId,sequence:i+1,status:'PENDING'}))}}});count++;
  }
  const event={at:new Date().toISOString(),action:'PUBLISH',actorId:actor.id,note:body.note,count,acknowledgeWarnings:body.acknowledgeWarnings,uncovered:review.uncovered.map(o=>o.id)};
  const published=await tx.pjpPlan.update({where:{id},data:{status:'PUBLISHED',publishedAt:new Date(),updatedBy:actor.id,revision:plan.revision+1,history:[...plan.history,event]}});
  return {plan:published,count,replayed:false};
 },{timeout:60000});
 broadcastCacheInvalidation('pjp');return result;
}
