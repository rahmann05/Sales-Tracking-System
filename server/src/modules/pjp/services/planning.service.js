import {prisma} from '../../../config/prisma.js';
import {AppError} from '../../../utils/errors.js';
import {planningBody} from './planning-schema.js';
import {assertPlanManager,planningContext} from './planning-context.service.js';
import {buildPlanCalendar} from '../../../../../shared/pjp-planning.mjs';
import {wibDayRange,wibDateKey} from '../../../../../shared/visit-metrics.mjs';
import {planningCalendar} from './planning-calendar.service.js';
import {teamPlanningPolicy} from './planning-policy.service.js';
import {workingDays} from '../../../../../shared/working-calendar.mjs';
export async function getPlan(id,actor,db=prisma){
 const plan=await db.pjpPlan.findUnique({where:{id}});
 if(!plan)throw new AppError('Rencana tidak ditemukan',404);
 assertPlanManager(actor,plan.supervisorId);return plan;
}
export async function listPlans(actor){
 if(!['ADMIN','SUPERVISOR'].includes(actor.role))throw new AppError('Tidak berwenang',403);
 return prisma.pjpPlan.findMany({where:actor.role==='SUPERVISOR'?{supervisorId:actor.id}:{},orderBy:{updatedAt:'desc'},take:100});
}
export async function previewPlan(raw,actor,db=prisma){
 const plan=planningBody.parse(raw),context=await planningContext(db,actor,plan.supervisorId);
 const policy=await teamPlanningPolicy(plan.supervisorId),values=policy.values,calendar=await planningCalendar(db,plan.startsOn,plan.endsOn,values);
 context.workingDays=workingDays(values.PJP_WORKING_DAYS);context.policy=policy;
 const review=buildPlanCalendar(plan,context.sales,context.outlets,context.workingDays,{...values,...(calendar.workingDates?{workingDates:calendar.workingDates}:{})});
 review.calendar=calendar;
 for(const month of calendar.missing)review.problems.push({code:'CALENDAR_MISSING',message:`Kalender Admin ${month} belum ditetapkan. Isi kalender sebelum penerbitan.`});
 const existing=await db.pjp.findMany({where:{type:'SALES',userId:{in:context.sales.map(s=>s.id)},date:{gte:wibDayRange(plan.startsOn).gte,lte:wibDayRange(plan.endsOn).lte}},select:{id:true,userId:true,date:true,code:true}});
 const scheduled=new Set(review.days.flatMap(day=>day.outletIds.map(id=>`${id}:${day.date}`)));
 const assigned=await db.pjpStop.findMany({where:{outletId:{in:[...new Set(plan.rules.map(r=>r.outletId))]},pjp:{type:'SALES',date:{gte:wibDayRange(plan.startsOn).gte,lte:wibDayRange(plan.endsOn).lte}}},select:{outletId:true,outlet:{select:{name:true}},pjp:{select:{date:true}}}});
 for(const stop of assigned){const date=wibDateKey(stop.pjp.date);if(scheduled.has(`${stop.outletId}:${date}`))review.problems.push({code:'EXISTING_VISIT',outletId:stop.outletId,date,message:`${stop.outlet.name} sudah memiliki PJP terbit pada ${date}. Periksa penugasan yang sudah berjalan.`});}
 return {...review,existing,context};
}
export async function savePlan(id,raw,actor){
 const body=planningBody.parse(raw);assertPlanManager(actor,body.supervisorId);
 return prisma.$transaction(async tx=>{
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`pjp-plan:${id||body.requestId}`}))`;
  if(!id){const previous=await tx.pjpPlan.findUnique({where:{requestId:body.requestId}});if(previous){assertPlanManager(actor,previous.supervisorId);return previous;}}
  await planningContext(tx,actor,body.supervisorId);
  const previous=id?await getPlan(id,actor,tx):null;
  if(previous&&(previous.status!=='DRAFT'||previous.revision!==body.revision))throw new AppError('Rencana sudah berubah atau diterbitkan. Muat ulang sebelum menyimpan.',409);
  if(previous&&previous.supervisorId!==body.supervisorId)throw new AppError('Tim rencana tidak dapat diganti. Buat rencana baru.',409);
  const {revision,note,...data}=body;
  const event={at:new Date().toISOString(),actorId:actor.id,action:previous?'UPDATE':'CREATE',note:note||'Draft rencana',revision:previous?.revision||0,...(previous?{before:{rules:previous.rules,startsOn:previous.startsOn,endsOn:previous.endsOn,name:previous.name}}:{})};
  return previous?tx.pjpPlan.update({where:{id},data:{...data,updatedBy:actor.id,revision:previous.revision+1,history:[...previous.history,event]}}):tx.pjpPlan.create({data:{...data,createdBy:actor.id,updatedBy:actor.id,history:[event]}});
 },{timeout:30000});
}
