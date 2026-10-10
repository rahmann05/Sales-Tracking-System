import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {Prisma} from '@prisma/client';
import {prisma} from '../../../config/prisma.js';
import {AppError} from '../../../utils/errors.js';
import {reviewPeople} from './approval-readiness.service.js';
import {withPolicy} from './policy-context.service.js';
import {effectivePolicy} from './policy-resolver.service.js';
import {getDynamicConfig} from '../config.service.js';
import {policyNotification} from '../../notifications/services/notification-policy.service.js';
import {ASSIGNMENT_KINDS,assignmentState,applyAssignment,assertScheduleActor} from './assignment-schedule-adapters.js';
import {preparationStages} from '../../../../../shared/warehouse-policy.mjs';
import {invalidateClusterCache} from '../../clusters/services/clusters.helpers.js';
const prefix='_ASSIGNMENT_SCHEDULE:';
const schema=z.object({kind:z.enum(Object.keys(ASSIGNMENT_KINDS)),entityId:z.string().min(1),fingerprint:z.string().length(64),ownerId:z.string().min(1),dueAt:z.string().min(10).max(40).nullable(),startsAt:z.string().datetime({offset:true}),endsAt:z.string().datetime({offset:true}).nullable(),reason:z.string().trim().min(5).max(1000)}).strict();
const activeWhere={key:{startsWith:prefix},OR:[{value:{path:['state'],equals:'SCHEDULED'}},{value:{path:['state'],equals:'ACTIVE'}}]};
async function lock(db){await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('approval:actors'))`;await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('assignment:schedules'))`;}
async function actorFor(db,id){return (await reviewPeople(db)).find(person=>person.id===id&&!person.deletedAt);}
async function audit(db,job,action,actor,before={}){await db.auditEvent.create({data:{entityType:'ASSIGNMENT_SCHEDULE',entityId:job.id,action,actorId:actor?.id||job.actorId,actorName:actor?.name||null,before,after:job}});}
export async function assignmentSchedulePreview(kind,entityId,actor){assertScheduleActor(actor,kind);return assignmentState(prisma,kind,entityId);}
export async function assignmentScheduleOptions(kind,actor){
 assertScheduleActor(actor,kind);let records;
 if(kind==='TEAM')records=await prisma.user.findMany({where:{role:'SALES',deletedAt:null},select:{id:true},take:100,orderBy:{name:'asc'}});
 else if(kind==='FOLLOW_UP')records=await prisma.staffActivity.findMany({where:{followUp:{path:['status'],equals:'OPEN'}},select:{id:true},take:100,orderBy:{checkInAt:'asc'}});
 else if(kind==='RETURN')records=await prisma.deliveryStop.findMany({where:{rejectedCartons:{gt:0},returnInspection:{equals:Prisma.DbNull},deliveryRoute:{cancelledAt:null}},select:{id:true},take:100});
 else if(kind==='ORDER_REVIEW')records=await prisma.order.findMany({where:{status:'PENDING_APPROVAL',deletedAt:null},select:{id:true},take:100,orderBy:{createdAt:'asc'}});
 else if(kind==='ROUTE_REVIEW')records=await prisma.routeChangeRequest.findMany({where:{status:'PENDING_APPROVAL'},select:{id:true},take:100,orderBy:{createdAt:'asc'}});
 else if(kind==='PREPARATION'){const routes=await prisma.deliveryRoute.findMany({where:{status:'DRAFT',cancelledAt:null,closedAt:null},select:{id:true,preparation:true,policySnapshot:true},take:50,orderBy:{createdAt:'asc'}});records=routes.flatMap(route=>preparationStages(route.policySnapshot?.values).filter(stage=>!route.preparation?.[stage]).map(stage=>({id:`${route.id}:${stage}`})));}
 else records=await prisma.outletReview.findMany({where:{status:{notIn:['COMPLETED','CANCELLED']}},select:{id:true},take:100,orderBy:{createdAt:'asc'}});
 const people=(await reviewPeople(prisma)).filter(p=>!p.deletedAt&&(kind==='TEAM'?p.role==='SUPERVISOR':kind==='FOLLOW_UP'?p.role==='SALES':['RETURN','PREPARATION'].includes(kind)?['ADMIN','KEPALA_GUDANG'].includes(p.role):['ADMIN','SUPERVISOR'].includes(p.role)));
 return {tasks:await Promise.all(records.map(async row=>({id:row.id,...await assignmentState(prisma,kind,row.id)}))),people:people.filter(p=>kind!=='ROUTE_REVIEW'||p.permissions?.can_review_route_change!==false).map(({id,name,role})=>({id,name,role}))};
}
export async function listAssignmentSchedules(actor){if(actor?.role!=='ADMIN')throw new AppError('Khusus Admin.',403);return (await prisma.systemConfig.findMany({where:{key:{startsWith:prefix}},orderBy:{updatedAt:'desc'},take:100})).map(row=>row.value);}
export async function createAssignmentSchedule(raw,actor){
 const data=schema.parse(raw),now=Date.now(),start=+new Date(data.startsAt),end=data.endsAt?+new Date(data.endsAt):null;
 if(data.kind==='TEAM'&&end!==null)throw new AppError('Transfer tim bertanggal bersifat permanen. Penugasan wilayah dan template masa depan perlu ditinjau pada tim baru.',422);
 if(start<now-60000||start>now+366*86400000||end!==null&&(end<=start||end>start+366*86400000))throw new AppError('Jadwal mulai harus sekarang/masa depan; akhir sesudah mulai, maksimal 366 hari.',422);
 if(!await getDynamicConfig('ASSIGNMENT_SCHEDULE_ENABLED',true))throw new AppError('Penjadwalan penugasan baru dinonaktifkan.',403);
 return prisma.$transaction(async db=>{
  await lock(db);actor=await actorFor(db,actor.id);assertScheduleActor(actor,data.kind);
  const state=await assignmentState(db,data.kind,data.entityId);
  if(state.finished||state.fingerprint!==data.fingerprint)throw new AppError('Penugasan berubah atau tugas tidak lagi terbuka. Periksa ulang.',409);
  if(data.ownerId===state.ownerId)throw new AppError('Pilih petugas pengganti yang berbeda.',422);
  const pending=await db.systemConfig.findMany({where:activeWhere});
  if(pending.some(row=>row.value.kind===data.kind&&row.value.entityId===data.entityId))throw new AppError('Tugas ini sudah memiliki jadwal aktif. Batalkan jadwal sebelumnya.',409);
  const job={id:randomUUID(),kind:data.kind,entityId:data.entityId,label:state.label,actorId:actor.id,actorName:actor.name,state:'SCHEDULED',startsAt:new Date(start).toISOString(),endsAt:end===null?null:new Date(end).toISOString(),reason:data.reason,target:{ownerId:data.ownerId,dueAt:data.dueAt},before:state,createdAt:new Date().toISOString(),history:[]};
  await applyAssignment(db,job,state,actor,{validateOnly:true});
  // A temporary delegation must have a restorable original assignment.
  if(end!==null){if(['FOLLOW_UP','PREPARATION'].includes(data.kind)&&(!state.ownerId||!state.dueAt))throw new AppError('Delegasi sementara memerlukan PIC dan tenggat awal.',422);await applyAssignment(db,job,state,actor,{restore:true,validateOnly:true});}
  await db.systemConfig.create({data:{key:prefix+job.id,value:job}});await audit(db,job,'SCHEDULE',actor);return job;
 },{timeout:30000});
}
async function transition(db,row,job,state,note,actor){
 const next={...job,state,lastError:state==='FAILED'||state==='NEEDS_ATTENTION'?note:null,history:[...job.history,{state,at:new Date().toISOString(),note}]};
 await db.systemConfig.update({where:{key:row.key},data:{value:next}});await audit(db,next,state,actor,job);
 if(['FAILED','NEEDS_ATTENTION'].includes(state)){
  const people=await reviewPeople(db);for(const recipient of people.filter(p=>!p.deletedAt&&p.role==='ADMIN'))await policyNotification(db,{data:{userId:recipient.id,type:'ASSIGNMENT_SCHEDULE_FAILED',title:'Penugasan terjadwal perlu diperiksa',message:`${job.label}: ${note}`,payload:{scheduleId:job.id,state}}});
 }
 return next;
}
export async function cancelAssignmentSchedule(id,reason,actor){
 if(typeof reason!=='string'||reason.trim().length<5||reason.length>1000)throw new AppError('Alasan pembatalan minimal lima karakter.',422);
 return prisma.$transaction(async db=>{
  await lock(db);actor=await actorFor(db,actor.id);
  const row=await db.systemConfig.findUnique({where:{key:prefix+id}});if(!row)throw new AppError('Jadwal tidak ditemukan.',404);
  const job=row.value;assertScheduleActor(actor,job.kind);
  if(job.state!=='SCHEDULED')throw new AppError('Hanya jadwal yang belum berjalan dapat dibatalkan. Tugas aktif dialihkan melalui editor proses.',409);
  return transition(db,row,job,'CANCELLED',reason.trim(),actor);
 });
}
export async function retryAssignmentSchedule(id,reason,actor){
 if(typeof reason!=='string'||reason.trim().length<5||reason.length>1000)throw new AppError('Alasan pemeriksaan ulang minimal lima karakter.',422);
 return prisma.$transaction(async db=>{
  await lock(db);actor=await actorFor(db,actor.id);const row=await db.systemConfig.findUnique({where:{key:prefix+id}});
  if(!row)throw new AppError('Jadwal tidak ditemukan.',404);const job=row.value;assertScheduleActor(actor,job.kind);
  if(!['FAILED','NEEDS_ATTENTION'].includes(job.state))throw new AppError('Jadwal tidak memerlukan pengulangan.',409);
  return transition(db,row,{...job,actorId:actor.id,actorName:actor.name},job.state==='FAILED'?'SCHEDULED':'ACTIVE',`Diperiksa ulang oleh ${actor.name}: ${reason.trim()}`,actor);
 });
}
export async function runAssignmentSchedules(now=Date.now(),{ids}={}){
 const at=new Date(now).toISOString();
 const where={key:ids?{in:ids.map(id=>prefix+id)}:{startsWith:prefix},OR:[{AND:[{value:{path:['state'],equals:'SCHEDULED'}},{value:{path:['startsAt'],lte:at}}]},{AND:[{value:{path:['state'],equals:'ACTIVE'}},{value:{path:['endsAt'],lte:at}}]}]};
 const rows=await prisma.systemConfig.findMany({where,orderBy:{updatedAt:'asc'},take:100});let changed=0;
 for(const candidate of rows){
  try{await prisma.$transaction(async db=>{
   await lock(db);const row=await db.systemConfig.findUnique({where:{key:candidate.key}}),job=row?.value;
   if(!job||!['SCHEDULED','ACTIVE'].includes(job.state))return;
   const expiry=job.state==='ACTIVE';if(!expiry&&+new Date(job.startsAt)>now||expiry&&(!job.endsAt||+new Date(job.endsAt)>now))return;
   let actor=await actorFor(db,job.actorId);const state=await assignmentState(db,job.kind,job.entityId);
   if(state.finished){await transition(db,row,job,'FINISHED','Tugas telah dikirim, selesai atau ditutup; hasil tidak diubah.',actor);changed++;return;}
   const expected=expiry?job.appliedFingerprint:job.before.fingerprint;
   if(state.fingerprint!==expected){await transition(db,row,job,'SUPERSEDED','Penugasan atau tahap berubah setelah jadwal dibuat; perubahan terbaru dipertahankan.',actor);changed++;return;}
   if(!expiry&&job.endsAt&&+new Date(job.endsAt)<=now){await transition(db,row,job,'EXPIRED','Jendela delegasi telah lewat sebelum worker berjalan; tidak menugaskan terlambat.',actor);changed++;return;}
   if(expiry){const people=await reviewPeople(db);actor=people.find(person=>{try{assertScheduleActor(person,job.kind);return true;}catch{return false;}});}
   assertScheduleActor(actor,job.kind);
   await withPolicy(await effectivePolicy(actor),()=>applyAssignment(db,job,state,actor,{restore:expiry}));
   const applied=await assignmentState(db,job.kind,job.entityId);
   await transition(db,row,{...job,appliedFingerprint:applied.fingerprint},expiry?'RESTORED':job.endsAt?'ACTIVE':'APPLIED',expiry?'PIC awal dipulihkan.':'Penugasan terjadwal diterapkan.',actor);changed++;
  },{timeout:30000});}catch(error){
   // The work and transition rolled back together; retain a visible failure, never fake success.
   await prisma.$transaction(async db=>{await lock(db);const row=await db.systemConfig.findUnique({where:{key:candidate.key}});if(row&&+row.updatedAt===+candidate.updatedAt&&['SCHEDULED','ACTIVE'].includes(row.value.state))await transition(db,row,row.value,row.value.state==='ACTIVE'?'NEEDS_ATTENTION':'FAILED',String(error.message).slice(0,1000));});
  }
 }
 if(changed)invalidateClusterCache();return {changed};
}
