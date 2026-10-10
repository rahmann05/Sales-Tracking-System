import {ensureSalesPjpForDate} from '../../pjp/services/pjp.helpers.js';
import {reviewActor} from './outlet-review-access.service.js';
import {prisma} from '../../../config/prisma.js';
import {AppError} from '../../../utils/errors.js';
import {wibDateKey,wibDayRange} from '../../../../../shared/visit-metrics.mjs';
import {captureReportAssignment,REPORT_USER_SELECT} from '../../reports/services/report-assignment.service.js';
import {resolveBusinessCode,getCodePolicy} from '../../config/services/business-code.service.js';
import {effectivePolicy} from '../../config/services/policy-resolver.service.js';
import {withPolicy} from '../../config/services/policy-context.service.js';
import {broadcastCacheInvalidation} from '../../../config/socket.js';

export function fieldScheduleActive(task,date=new Date()){
 const key=wibDateKey(date),s=task.schedule;
 return Boolean(s?.assignedOn&&s.assignedOn<=key&&(s.mode==='UNTIL_COMPLETE'||s.assignedOn===key));
}
export async function addFieldPjpVisit(db,task,outlet,now=new Date(),manualCode){
 if(!fieldScheduleActive(task,now))return null;
 const key=wibDateKey(now);
 await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`pjp:${task.ownerId}:${key}`}))`;
 const existing=await db.pjpStop.findFirst({where:{validationTaskId:task.id,pjp:{userId:task.ownerId,date:wibDayRange(now)}}});
 if(existing)return {...existing,added:false};
 const owner=await db.user.findFirst({where:{id:task.ownerId,role:'SALES',deletedAt:null},select:REPORT_USER_SELECT});
 if(!owner||owner.supervisorId!==outlet.cluster?.supervisorId)throw new AppError('Tim Sales tidak sesuai wilayah tugas validasi.',409);
 let pjp=await db.pjp.findFirst({where:{userId:owner.id,type:'SALES',date:wibDayRange(now)},orderBy:{createdAt:'asc'}});
 if(!pjp)pjp=await ensureSalesPjpForDate(db,owner.id,now,manualCode);
 if(!pjp){
  if((await getCodePolicy('PJP')).mode==='MANUAL'&&!manualCode)throw new AppError('Belum ada PJP hari ini. Isi kode PJP manual atau siapkan PJP terlebih dahulu.',422);
  pjp=await db.pjp.create({data:{...captureReportAssignment(owner,'OUTLET_VALIDATION',now),userId:owner.id,type:'SALES',date:wibDayRange(now).gte,code:await resolveBusinessCode('PJP',manualCode,{db,date:now}),status:'SCHEDULED'}});
 }
 const regular=await db.pjpStop.findFirst({where:{pjpId:pjp.id,outletId:outlet.id,validationTaskId:null}});
 const result={state:task.status==='SUBMITTED'?'WAITING_REVIEW':task.status==='DONE'?'ACCEPTED':'PENDING',assignedOn:key,taskId:task.id,mode:task.schedule.mode};
 let stop;
 if(regular)stop=await db.pjpStop.update({where:{id:regular.id},data:{validationTaskId:task.id,validationResult:result}});
 else{
  const last=await db.pjpStop.aggregate({where:{pjpId:pjp.id},_max:{sequence:true}});
  stop=await db.pjpStop.create({data:{pjpId:pjp.id,outletId:outlet.id,sequence:(last._max.sequence||0)+1,validationTaskId:task.id,validationOnly:true,validationResult:result,status:'PENDING'}});
 }
 if(pjp.status==='COMPLETED')await db.pjp.update({where:{id:pjp.id},data:{status:'IN_PROGRESS'}});
 await db.outletFieldTask.update({where:{id:task.id},data:{pjpStopId:stop.id}});
 return {...stop,added:true};
}
export async function updateFieldPjpResult(db,task,action,now=new Date()){
 const where={validationTaskId:task.id,pjp:{date:wibDayRange(now)}};
 const rows=await db.pjpStop.findMany({where});
 for(const stop of rows){
  const state={SUBMIT:'WAITING_REVIEW',ACCEPT:'ACCEPTED',RETURN:'RETURNED',CANCEL:'CANCELLED',REASSIGN:'REASSIGNED'}[action];
  await db.pjpStop.update({where:{id:stop.id},data:{validationResult:{...stop.validationResult,state,at:now.toISOString(),...(action==='SUBMIT'?{requestId:task.evidence?.requestId,submittedAt:now.toISOString()}:{})},...(stop.validationOnly?{status:action==='SUBMIT'||action==='ACCEPT'&&Boolean(stop.validationResult?.submittedAt)?'VISITED':action==='ACCEPT'?'PENDING':action==='RETURN'?'PENDING':'SKIPPED'}:{})}});
 }
}
export async function finishFieldPjpAgenda(db,reviewId,now=new Date()){
 const stops=await db.pjpStop.findMany({where:{validationTask:{reviewId},pjp:{date:{gte:wibDayRange(now).gte}}}});
 for(const stop of stops){
  if(['CANCELLED','REASSIGNED'].includes(stop.validationResult?.state))continue;
  const visited=Boolean(stop.validationResult?.submittedAt);
  await db.pjpStop.update({where:{id:stop.id},data:{validationResult:{...stop.validationResult,state:visited?'COMPLETE':'RESOLVED',resolvedAt:now.toISOString()},...(stop.validationOnly?{status:visited?'VISITED':'SKIPPED'}:{})}});
 }
}
export async function rollOutletFieldPjps(now=new Date()){
 const candidates=await prisma.outletFieldTask.findMany({where:{status:{in:['OPEN','SUBMITTED','DONE']},schedule:{path:['mode'],equals:'UNTIL_COMPLETE'},review:{status:{notIn:['COMPLETED','CANCELLED']}},validationVisits:{none:{pjp:{date:wibDayRange(now)}}}},select:{id:true,ownerId:true},take:500});
 let added=0,blocked=0;
 for(const row of candidates){
  const actor=await prisma.user.findUnique({where:{id:row.ownerId},select:{id:true,role:true,supervisorId:true,deletedAt:true}});if(!actor||actor.deletedAt)continue;
  try{await withPolicy(await effectivePolicy(actor,Date.now(),{fresh:true}),()=>prisma.$transaction(async db=>{
   await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('approval:actors'))`;
   await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('planning:territories'))`;
   await reviewActor(db,{id:row.ownerId},'can_submit_outlet_field');
   const task=await db.outletFieldTask.findUnique({where:{id:row.id},include:{review:{include:{outlet:{include:{cluster:true}},fieldTasks:{orderBy:{createdAt:'desc'},take:1,select:{id:true}}}}}});
   if(!task||task.review.fieldTasks[0]?.id!==task.id||['COMPLETED','CANCELLED'].includes(task.review.status)||!['OPEN','SUBMITTED','DONE'].includes(task.status))return;
   const stop=await addFieldPjpVisit(db,task,task.review.outlet,now);if(stop?.added)added++;
  },{timeout:15000}));}catch(e){blocked++;if(!e.isOperational)throw e;}
 }
 if(added)broadcastCacheInvalidation('pjp');return {added,blocked};
}
