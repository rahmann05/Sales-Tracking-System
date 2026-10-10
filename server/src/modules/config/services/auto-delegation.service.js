import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {Prisma} from '@prisma/client';
import {prisma} from '../../../config/prisma.js';
import {AppError} from '../../../utils/errors.js';
import {reviewPeople} from './approval-readiness.service.js';
import {assertDomainAction} from '../../../middlewares/domain-permission.middleware.js';
import {assignmentState,applyAssignment,assertScheduleActor} from './assignment-schedule-adapters.js';
import {effectivePolicy} from './policy-resolver.service.js';
import {withPolicy} from './policy-context.service.js';
import {AUTO_DELEGATION_KINDS,AUTO_DELEGATION_TRIGGERS,delegationTrigger,delegationDeadline,delegationStage,delegationBlock} from '../../../../../shared/auto-delegation.mjs';
import {parsePagination} from '../../../utils/pagination.js';
const rulesPrefix='_AUTO_DELEGATION_RULE:',casesPrefix='_AUTO_DELEGATION_CASE:';
const input=z.object({id:z.string().uuid().optional(),revision:z.number().int().nonnegative(),name:z.string().trim().min(3).max(100),kind:z.enum(Object.keys(AUTO_DELEGATION_KINDS)),trigger:z.enum(Object.keys(AUTO_DELEGATION_TRIGGERS)),enabled:z.boolean(),priority:z.number().int().min(1).max(100),candidateIds:z.array(z.string().uuid()).min(1).max(10),graceMinutes:z.number().int().min(0).max(43200),durationMinutes:z.number().int().min(0).max(43200),dueInHours:z.number().int().min(1).max(8760),maxTransfers:z.number().int().min(1).max(10),cooldownMinutes:z.number().int().min(1).max(43200),startsAt:z.string().datetime().nullable(),endsAt:z.string().datetime().nullable(),reason:z.string().trim().min(5).max(500)}).strict();
async function lock(db){await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('approval:actors'))`;await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('assignment:schedules'))`;}
async function admin(db,user,kind){const actor=(await reviewPeople(db)).find(p=>p.id===user?.id);assertDomainAction(actor,'SYSTEM');if(kind)assertScheduleActor(actor,kind);return actor;}
async function put(db,key,value){return db.systemConfig.upsert({where:{key},create:{key,value},update:{value}});}
async function audit(db,id,action,actor,before,after){await db.auditEvent.create({data:{entityType:'AUTO_DELEGATION',entityId:id,action,actorId:actor?.id||null,actorName:actor?.name||null,before,after}});}
export async function autoDelegationCenter(user,query={}){
 await admin(prisma,user);
 const {page,limit,skip,take}=parsePagination(query),status=query.status||'ALL';
 if(!['ALL','BLOCKED','APPLIED','RETRY','FINISHED','SUPERSEDED','UNAVAILABLE'].includes(status))throw new AppError('Status auto-delegasi tidak valid.',422);
 const where={key:{startsWith:casesPrefix},...(status==='ALL'?{}:{value:{path:['state'],equals:status}})};
 const [rules,records,total,people]=await Promise.all([prisma.systemConfig.findMany({where:{key:{startsWith:rulesPrefix}},orderBy:{key:'asc'}}),prisma.systemConfig.findMany({where,orderBy:[{updatedAt:'desc'},{key:'asc'}],skip,take}),prisma.systemConfig.count({where}),reviewPeople(prisma)]);
 const scheduleIds=records.map(r=>r.value.scheduleId).filter(Boolean),schedules=scheduleIds.length?await prisma.systemConfig.findMany({where:{key:{in:scheduleIds.map(id=>'_ASSIGNMENT_SCHEDULE:'+id)}}}):[];
 return {rules:rules.map(r=>r.value),records:records.map(r=>({...r.value,delegationState:schedules.find(s=>s.value.id===r.value.scheduleId)?.value.state||null})),people:people.filter(p=>!p.deletedAt).map(({id,name,role})=>({id,name,role})),pagination:{page,limit,total,pages:Math.max(1,Math.ceil(total/limit))}};
}
export async function saveAutoDelegation(raw,user){
 const b=input.parse(raw);
 if(new Set(b.candidateIds).size!==b.candidateIds.length)throw new AppError('Petugas pengganti tidak boleh berulang.',422);
 if(b.enabled&&(b.startsAt&&b.endsAt&&Date.parse(b.endsAt)<=Date.parse(b.startsAt)||b.endsAt&&Date.parse(b.endsAt)<=Date.now()))throw new AppError('Akhir masa berlaku harus sesudah awal dan belum lewat.',422);
 return prisma.$transaction(async db=>{
  await lock(db);const actor=await admin(db,user,b.enabled?b.kind:null),key=rulesPrefix+(b.id||randomUUID()),old=(await db.systemConfig.findUnique({where:{key}}))?.value;
  if((old?.revision||0)!==b.revision||b.id&&!old)throw new AppError('Aturan berubah atau tidak ditemukan. Muat ulang.',409);
  if(old&&old.kind!==b.kind)throw new AppError('Jenis proses aturan tidak dapat diganti; buat aturan baru.',422);
  const people=await reviewPeople(db);
  if(b.enabled&&b.candidateIds.some(id=>!people.some(p=>p.id===id&&!p.deletedAt)))throw new AppError('Petugas pengganti harus akun aktif.',422);
  const value={...b,id:key.slice(rulesPrefix.length),revision:b.revision+1,actorId:actor.id,actorName:actor.name,updatedAt:new Date().toISOString()};
  await put(db,key,value);await audit(db,value.id,'SAVE_RULE',actor,old||{},value);return value;
 });
}
export async function retryAutoDelegation(key,reason,user){
 if(typeof key!=='string'||!key.startsWith(casesPrefix)||typeof reason!=='string'||reason.trim().length<5||reason.length>500)throw new AppError('Kasus dan alasan pemeriksaan ulang tidak valid.',422);
 return prisma.$transaction(async db=>{
  await lock(db);const old=(await db.systemConfig.findUnique({where:{key}}))?.value;if(!old)throw new AppError('Kasus tidak ditemukan.',404);
  const actor=await admin(db,user,old.kind),state=await assignmentState(db,old.kind,old.entityId);
  if(state.finished)throw new AppError('Tugas telah selesai; tidak dapat diaktifkan ulang.',409);
  const active=await db.systemConfig.findMany({where:{key:{startsWith:'_ASSIGNMENT_SCHEDULE:'},value:{path:['state'],equals:'ACTIVE'}}});
  if(active.some(r=>r.value.kind===old.kind&&r.value.entityId===old.entityId))throw new AppError('Delegasi sementara masih berjalan. Tunggu pemulihan atau alihkan melalui proses.',409);
  const next={...old,state:'RETRY',lastFingerprint:state.fingerprint,lastError:null,retryReason:reason.trim(),updatedAt:new Date().toISOString()};
  // A retry acknowledges manual changes, but never clears the transfer count or visited owners.
  await put(db,key,next);await audit(db,key,'RETRY',actor,old,next);return next;
 });
}
export async function autoDelegationTaskPage(db,kind,after,take){
 const paging={select:{id:true},orderBy:{id:'asc'},take,...(after?{cursor:{id:after},skip:1}:{})};
 if(kind==='FOLLOW_UP')return db.staffActivity.findMany({...paging,where:{followUp:{path:['status'],equals:'OPEN'}}});
 if(kind==='RETURN')return db.deliveryStop.findMany({...paging,where:{rejectedCartons:{gt:0},returnInspection:{equals:Prisma.DbNull},deliveryRoute:{cancelledAt:null}}});
 if(kind==='ORDER_REVIEW')return db.order.findMany({...paging,where:{status:'PENDING_APPROVAL',deletedAt:null}});
 if(kind==='ROUTE_REVIEW')return db.routeChangeRequest.findMany({...paging,where:{status:'PENDING_APPROVAL'}});
 if(kind==='OUTLET_REVIEW')return db.outletReview.findMany({...paging,where:{status:{notIn:['COMPLETED','CANCELLED']}}});
 return db.deliveryRoute.findMany({...paging,where:{status:'DRAFT',cancelledAt:null,closedAt:null}});
}
async function recordCase(db,key,old,detail,actor){
 const signature=JSON.stringify([detail.state,detail.lastError,detail.ruleId,detail.lastFingerprint]);
 if(old?.signature===signature)return;
 const next={...old,...detail,key,signature,updatedAt:new Date().toISOString()};await put(db,key,next);await audit(db,key,detail.state,actor,old||{},next);
}
async function processTask(db,kind,id,rules,now){
 await lock(db);const state=await assignmentState(db,kind,id);if(state.finished)return false;
 const key=casesPrefix+kind+':'+id+':'+delegationStage(state),old=(await db.systemConfig.findUnique({where:{key}}))?.value;
 const active=await db.systemConfig.findMany({where:{key:{startsWith:'_ASSIGNMENT_SCHEDULE:'},OR:[{value:{path:['state'],equals:'SCHEDULED'}},{value:{path:['state'],equals:'ACTIVE'}}]}});
 if(active.some(r=>r.value.kind===kind&&r.value.entityId===id))return false;
 const people=await reviewPeople(db),owner=people.find(p=>p.id===state.ownerId&&!p.deletedAt);
 for(const rule of rules){
  const actor=people.find(p=>p.id===rule.actorId);let policy,error;
  try{assertDomainAction(actor,'SYSTEM');assertScheduleActor(actor,kind);policy=await effectivePolicy(actor,now,{fresh:true});}catch(e){if(!(e instanceof AppError))throw e;error=e.message;}
  if(policy?.values.AUTO_DELEGATION_ENABLED===false)continue;
  let available=Boolean(owner);
  if(available&&!error){try{await withPolicy(policy,()=>applyAssignment(db,{id:'eligibility',kind,entityId:id,before:state,target:state,endsAt:null,reason:'Pemeriksaan kelayakan PIC'},state,actor,{restore:true,validateOnly:true}));}catch(e){if(!(e instanceof AppError)&&!(e instanceof z.ZodError))throw e;available=false;}}
  if(!delegationTrigger(rule,state,available,now))continue;
  const detail={kind,entityId:id,stage:delegationStage(state),label:state.label,ruleId:rule.id,ruleName:rule.name,lastFingerprint:old?.lastFingerprint||state.fingerprint,transfers:old?.transfers||0};
  error=error||delegationBlock(rule,state,old,now);
  if(rule.durationMinutes&&['FOLLOW_UP','PREPARATION'].includes(kind)&&(!state.ownerId||!state.dueAt))error='Delegasi sementara memerlukan PIC dan tenggat awal yang dapat dipulihkan.';
  if(error){await recordCase(db,key,old,{...detail,state:'BLOCKED',lastError:error},actor);return false;}
  const job={id:randomUUID(),kind,entityId:id,label:state.label,actorId:actor.id,actorName:actor.name,startsAt:new Date(now).toISOString(),endsAt:rule.durationMinutes?new Date(now+rule.durationMinutes*60000).toISOString():null,reason:`Otomatis ${rule.name}: ${rule.reason}`,target:{ownerId:null,dueAt:delegationDeadline(kind,rule.dueInHours,now)},before:state,createdAt:new Date().toISOString(),history:[],autoRuleId:rule.id};
  let selected=null;const failures=[];
  for(const candidateId of rule.candidateIds){
   if(candidateId===state.ownerId||(old?.visitedOwnerIds||[]).includes(candidateId))continue;
   job.target.ownerId=candidateId;
   try{await withPolicy(policy,()=>applyAssignment(db,job,state,actor,{validateOnly:true}));if(job.endsAt)await withPolicy(policy,()=>applyAssignment(db,job,state,actor,{restore:true,validateOnly:true}));selected=candidateId;break;}catch(e){if(!(e instanceof AppError)&&!(e instanceof z.ZodError))throw e;failures.push(String(e.message).slice(0,250));}
  }
  if(!selected){await recordCase(db,key,old,{...detail,state:'BLOCKED',lastError:'Tidak ada pengganti yang memenuhi scope/izin/tahap atau semua sudah pernah menangani tugas ini. '+failures.join(' | ').slice(0,1000)},actor);return false;}
  await withPolicy(policy,()=>applyAssignment(db,job,state,actor));const applied=await assignmentState(db,kind,id);
  const saved={...job,state:job.endsAt?'ACTIVE':'APPLIED',appliedFingerprint:applied.fingerprint};await put(db,'_ASSIGNMENT_SCHEDULE:'+job.id,saved);await audit(db,job.id,'AUTO_ASSIGN',actor,{},saved);
  await recordCase(db,key,old,{...detail,state:'APPLIED',lastError:null,transfers:(old?.transfers||0)+1,lastAppliedAt:new Date(now).toISOString(),lastFingerprint:applied.fingerprint,scheduleId:job.id,ownerId:selected,visitedOwnerIds:[...new Set([...(old?.visitedOwnerIds||[]),state.ownerId,selected].filter(Boolean))]},actor);return true;
 }
 return false;
}
async function reconcileCases(take,{ruleIds,entityIds}){
 const cursorKey='_AUTO_DELEGATION_RECONCILE_CURSOR',after=entityIds?null:(await prisma.systemConfig.findUnique({where:{key:cursorKey}}))?.value?.after;
 const rows=await prisma.systemConfig.findMany({where:{key:{startsWith:casesPrefix,...(after?{gt:after}:{})},AND:[{OR:['BLOCKED','RETRY','APPLIED'].map(state=>({value:{path:['state'],equals:state}}))},...(entityIds?[{OR:entityIds.flatMap(id=>[id,...['PICK','CHECK','LOAD'].map(stage=>id+':'+stage)]).map(id=>({value:{path:['entityId'],equals:id}}))}]:[])]},orderBy:{key:'asc'},take});
 for(const row of rows){if(ruleIds&&!ruleIds.includes(row.value.ruleId))continue;
  await prisma.$transaction(async db=>{
   await lock(db);const old=(await db.systemConfig.findUnique({where:{key:row.key}}))?.value;if(!old||!['BLOCKED','RETRY','APPLIED'].includes(old.state))return;
   let terminal=null;
   try{const state=await assignmentState(db,old.kind,old.entityId);if(state.finished)terminal='FINISHED';else if(delegationStage(state)!==(old.stage||row.key.split(':').at(-1)))terminal='SUPERSEDED';}catch(e){if(!(e instanceof AppError)||e.statusCode!==404)throw e;terminal='UNAVAILABLE';}
   if(terminal)await recordCase(db,row.key,old,{state:terminal,lastError:null},null);
  },{timeout:30000});
 }
 if(!entityIds)await put(prisma,cursorKey,{after:rows.length===take?rows.at(-1).key:null});
}
export async function runAutoDelegation(now=Date.now(),{ruleIds,entityIds}={}){
 const system=await effectivePolicy({role:'ADMIN'},now,{fresh:true});
 const take=Number(system.values.AUTO_DELEGATION_SCAN_LIMIT||50);
 await reconcileCases(take,{ruleIds,entityIds});
 if(!system.values.AUTO_DELEGATION_ENABLED)return {disabled:true};
 const all=await prisma.systemConfig.findMany({where:{key:{startsWith:rulesPrefix}}});
 const rules=all.map(r=>r.value).filter(r=>r.enabled&&(!ruleIds||ruleIds.includes(r.id))&&(!r.startsAt||Date.parse(r.startsAt)<=now)&&(!r.endsAt||Date.parse(r.endsAt)>now)).sort((a,b)=>a.priority-b.priority||a.id.localeCompare(b.id));
 let changed=0,scanned=0;
 for(const kind of Object.keys(AUTO_DELEGATION_KINDS)){
  const current=rules.filter(r=>r.kind===kind);if(!current.length)continue;
  const cursorKey='_AUTO_DELEGATION_CURSOR:'+kind,after=entityIds?null:(await prisma.systemConfig.findUnique({where:{key:cursorKey}}))?.value?.after;
  const page=entityIds?entityIds.map(id=>({id})):await autoDelegationTaskPage(prisma,kind,after,take);
  for(const row of page){
   const ids=kind==='PREPARATION'?['PICK','CHECK','LOAD'].map(stage=>row.id+':'+stage):[row.id];
   for(const id of ids){scanned++;try{if(await prisma.$transaction(db=>processTask(db,kind,id,current,now),{timeout:30000}))changed++;}catch(e){if(!(e instanceof AppError)||e.statusCode!==404)throw e;/* Deleted work is skipped; infrastructure and unexpected business failures fail the monitored run. */}}
  }
  if(!entityIds)await put(prisma,cursorKey,{after:page.length===take?page.at(-1).id:null});
 }
 return {changed,scanned};
}
