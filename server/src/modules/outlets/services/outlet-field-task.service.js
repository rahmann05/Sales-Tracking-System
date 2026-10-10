import {broadcastCacheInvalidation} from '../../../config/socket.js';
import {z} from 'zod';
import {randomUUID} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {prisma} from '../../../config/prisma.js';
import {AppError} from '../../../utils/errors.js';
import {reviewActor,fieldActors} from './outlet-review-access.service.js';
import {lockOutlet,reviewOutlet,actorSnapshot} from './outlet-review-policy.service.js';
import {policySnapshot} from '../../config/services/process-policy.service.js';
import {effectivePolicy} from '../../config/services/policy-resolver.service.js';
import {withPolicy} from '../../config/services/policy-context.service.js';
import {outletIssues} from '../../../../../shared/outlet-validation.mjs';
import {wibDateKey} from '../../../../../shared/visit-metrics.mjs';
import {addFieldPjpVisit,updateFieldPjpResult,fieldScheduleActive} from './outlet-field-pjp.service.js';
import {getDynamicConfig} from '../../config/config.service.js';
import {createNotification} from '../../notifications/services/create-notification.service.js';
import {addSlaHours} from '../../../../../shared/business-clock.mjs';
import {actionNames} from '../../../../../shared/business-actions.mjs';
import {invalidateOutletCache} from './outlets.helpers.js';
const assignment=z.object({revision:z.number().int().positive(),ownerId:z.string().min(1),reviewerId:z.string().min(1),instructions:z.string().trim().min(10).max(2000),dueAt:z.string().datetime().optional(),pjpStopId:z.string().optional(),manualPjpCode:z.string().trim().max(128).optional()}).strict();
const evidence=z.object({requestId:z.string().uuid(),outcome:z.enum(['FOUND','NOT_FOUND','MOVED','CLOSED']),name:z.string().trim().max(200),address:z.string().trim().max(1000),note:z.string().trim().min(10).max(4000),latitude:z.number().finite().min(-90).max(90).nullable(),longitude:z.number().finite().min(-180).max(180).nullable(),accuracyMeters:z.number().positive().max(100000).nullable(),capturedAt:z.string().datetime().nullable(),photo:z.string().max(2800000).optional()}).strict();
export const fieldActionInput=z.object({action:z.enum(actionNames('OUTLET_FIELD')),revision:z.number().int().positive(),reason:z.string().trim().min(10).max(2000).optional(),evidence:evidence.optional()}).strict();
export async function assignOutletField(outletId,id,raw,user){
 const b=assignment.parse(raw);
 const result=await prisma.$transaction(async db=>{
  await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('approval:actors'))`;const actor=await reviewActor(db,user,'can_assign_outlet_review');await lockOutlet(db,outletId);const outlet=await reviewOutlet(db,actor,outletId);
  const r=await db.outletReview.findUnique({where:{id}});if(!r||r.outletId!==outletId||r.revision!==b.revision||['COMPLETED','CANCELLED'].includes(r.status))throw new AppError('Kasus berubah atau selesai.',409);
  if(await getDynamicConfig('OUTLET_FIELD_ENABLED',true)===false)throw new AppError('Tugas lapangan baru dinonaktifkan.',409);
  const actors=await fieldActors(db,outlet),owner=actors.sales.find(p=>p.id===b.ownerId),reviewer=actors.reviewers.find(p=>p.id===b.reviewerId);
  if(!owner||!reviewer||owner.id===reviewer.id)throw new AppError('Pilih Sales dan pemeriksa aktif berizin dalam wilayah.',422);
  if(b.pjpStopId&&!await db.pjpStop.findFirst({where:{id:b.pjpStopId,outletId,pjp:{userId:owner.id}}}))throw new AppError('Kunjungan tidak sesuai outlet/PIC.',422);
  const prior=await db.outletFieldTask.findFirst({where:{reviewId:id,status:{in:['OPEN','SUBMITTED']}}});if(prior?.status==='SUBMITTED')throw new AppError('Periksa hasil yang sudah dikirim sebelum mengalihkan tugas.',409);
  const ownerPolicy=await effectivePolicy(owner,Date.now(),{fresh:true});
  if(ownerPolicy.values.FEATURE_PJP_MODE!=='ACTIVE')throw new AppError('PJP baru sedang dinonaktifkan untuk Sales ini. Aktifkan sebelum menugaskan kunjungan validasi.',409);
  const snapshot=policySnapshot(ownerPolicy),entry={action:prior?'REASSIGN':'ASSIGN',actor:actorSnapshot(actor),at:new Date().toISOString(),instructions:b.instructions,ownerId:owner.id,reviewerId:reviewer.id};
  const data={policySnapshot:snapshot,schedule:{mode:snapshot.values.OUTLET_FIELD_PJP_MODE||'TODAY_ONLY',assignedOn:wibDateKey()},ownerId:owner.id,reviewerId:reviewer.id,instructions:b.instructions,dueAt:b.dueAt?new Date(b.dueAt):addSlaHours(new Date(),snapshot.values.OUTLET_FIELD_SLA_HOURS||48,snapshot.values),pjpStopId:b.pjpStopId||null,history:[...(prior?.history||[]),entry]};
  const task=prior?await db.outletFieldTask.update({where:{id:prior.id},data:{...data,revision:{increment:1}}}):await db.outletFieldTask.create({data:{...data,reviewId:id}});
  if(prior&&prior.ownerId!==owner.id)await updateFieldPjpResult(db,prior,'REASSIGN');
  const stop=await withPolicy(ownerPolicy,()=>addFieldPjpVisit(db,task,outlet,new Date(),b.manualPjpCode));
  await db.outletReview.update({where:{id},data:{status:'WAITING_FIELD',revision:{increment:1},workflow:{...r.workflow,stage:'WAITING_FIELD'}}});
  await createNotification(owner.id,'OUTLET_FIELD_ASSIGNED','Pemeriksaan outlet',`${outlet.name}: ${b.instructions}`,{tab:'sales-follow-up',outletFieldTask:task.id},db);
  await db.auditEvent.create({data:{entityType:'OUTLET_FIELD_TASK',entityId:task.id,action:entry.action,actorId:actor.id,actorName:actor.name,before:prior?{revision:prior.revision,ownerId:prior.ownerId,reviewerId:prior.reviewerId}:{},after:{...entry,schedule:data.schedule,pjpStopId:stop?.id}}});return {...task,pjpStopId:stop?.id||task.pjpStopId};
 },{timeout:15000});invalidateOutletCache();broadcastCacheInvalidation('pjp');return result;
}
export async function listOutletFieldTasks(user,status='ALL'){
 const actor=await reviewActor(prisma,user,user.role==='SALES'?'can_submit_outlet_field':'can_review_outlet_field');
 if(!['ALL','OPEN','SUBMITTED','DONE','CANCELLED'].includes(status))throw new AppError('Status tugas tidak valid.',400);
 return prisma.outletFieldTask.findMany({where:{...(status==='ALL'?{}:{status}),...(actor.role==='SALES'?{ownerId:actor.id}:actor.role==='SUPERVISOR'?{reviewerId:actor.id}:{}),review:{outlet:actor.role==='SUPERVISOR'?{cluster:{supervisorId:actor.id}}:{}}},include:{review:{select:{outletId:true,reason:true,outlet:{select:{name:true,outletCode:true,googleLocation:true,phone:true,clusterId:true,address:true,latitude:true,longitude:true}}}}},orderBy:[{createdAt:'desc'},{id:'asc'}],take:100});
}
export async function getOutletFieldTask(id,user){
 const actor=await reviewActor(prisma,user,user.role==='SALES'?'can_submit_outlet_field':'can_review_outlet_field');
 const task=await prisma.outletFieldTask.findFirst({where:{id,...(actor.role==='SALES'?{ownerId:actor.id}:actor.role==='SUPERVISOR'?{reviewerId:actor.id,review:{outlet:{cluster:{supervisorId:actor.id}}}}:{})},include:{review:{select:{outletId:true,reason:true,status:true,outlet:{select:{name:true,outletCode:true,googleLocation:true,phone:true,clusterId:true,address:true,latitude:true,longitude:true}}}}}});
 if(!task)throw new AppError('Tugas tidak ditemukan dalam penugasan Anda.',404);return task;
}
export async function actOutletField(id,raw,user){
 const b=fieldActionInput.parse(raw);
 const result=await prisma.$transaction(async db=>{
  await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('approval:actors'))`;
  const actor=await reviewActor(db,user,b.action==='SUBMIT'?'can_submit_outlet_field':b.action==='CANCEL'?'can_assign_outlet_review':'can_review_outlet_field');
  let t=await db.outletFieldTask.findUnique({where:{id},include:{review:{include:{outlet:{include:{cluster:true}}}}}});if(!t)throw new AppError('Tugas tidak ditemukan.',404);
  await lockOutlet(db,t.review.outletId);t=await db.outletFieldTask.findUnique({where:{id},include:{review:true}});
  if(b.action==='SUBMIT'&&t.evidence?.requestId===b.evidence?.requestId){if(!isDeepStrictEqual(t.evidence,b.evidence))throw new AppError('Identitas pengiriman digunakan untuk bukti berbeda.',409);if(t.ownerId!==actor.id)throw new AppError('Tugas bukan milik Anda.',403);return t;}
  if(t.revision!==b.revision||['DONE','CANCELLED'].includes(t.status)||['COMPLETED','CANCELLED'].includes(t.review.status))throw new AppError('Tugas berubah atau selesai. Muat ulang.',409);
  const r=t.review,event={action:b.action,actor:actorSnapshot(actor),reason:b.reason||b.evidence?.note,at:new Date().toISOString()},data={revision:{increment:1},history:[...t.history,event]};
  if(b.action==='SUBMIT'){
   if(actor.id!==t.ownerId||actor.role!=='SALES')throw new AppError('Hanya Sales PIC dapat mengirim hasil.',403);
   if(t.status!=='OPEN'||!b.evidence)throw new AppError('Tugas tidak menerima hasil baru.',409);
   if(t.schedule?.assignedOn&&!fieldScheduleActive(t))throw new AppError('Penugasan hanya untuk hari sebelumnya. Minta SPV menugaskan ulang agar masuk PJP hari ini.',409);
   const e=b.evidence,v=t.policySnapshot.values,hasGps=Number.isFinite(e.latitude)&&Number.isFinite(e.longitude);
   if((e.latitude==null)!==(e.longitude==null))throw new AppError('Koordinat harus berpasangan.',422);
   if(v.OUTLET_FIELD_REQUIRE_GPS!==false&&!hasGps)throw new AppError('GPS lapangan wajib diambil.',422);
   if(hasGps&&(!e.capturedAt||!e.accuracyMeters||e.accuracyMeters>(v.OUTLET_FIELD_GPS_MAX_ACCURACY||100)||Date.now()-Date.parse(e.capturedAt)>(v.OUTLET_FIELD_GPS_MAX_AGE_MINUTES||15)*60000||Date.parse(e.capturedAt)>Date.now()+30000))throw new AppError('GPS terlalu lama, tidak akurat atau waktunya tidak valid. Ambil ulang di lokasi.',422);
   if(v.OUTLET_FIELD_REQUIRE_PHOTO!==false&&!e.photo)throw new AppError('Foto lapangan wajib diisi.',422);
   if(e.photo&&!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(e.photo))throw new AppError('Foto harus JPEG/PNG/WebP maksimal 2 MB.',422);
   if(e.outcome==='FOUND'&&(!e.name||e.address.length<5))throw new AppError('Nama papan toko dan alamat aktual wajib untuk hasil ditemukan.',422);
   if(e.outcome==='FOUND'&&outletIssues({name:e.name,address:e.address,latitude:e.latitude,longitude:e.longitude}).includes('INCOMPLETE_ADDRESS'))throw new AppError('Alamat aktual belum cukup lengkap. Isi jalan/patokan toko serta wilayah, bukan hanya nama kota/kecamatan.',422);
   data.status='SUBMITTED';data.evidence=e;
   data.history=[...t.history,{...event,evidence:e}];
   await createNotification(t.reviewerId,'OUTLET_FIELD_SUBMITTED','Bukti outlet perlu diperiksa',e.note,{tab:'outlet-validation',outletReview:r.id},db);
  }else{
   if(!b.reason)throw new AppError('Alasan keputusan wajib diisi.',422);
   await reviewOutlet(db,actor,r.outletId,true);
   if(b.action!=='CANCEL'&&(actor.id!==t.reviewerId&&actor.role!=='ADMIN'||actor.id===t.ownerId))throw new AppError('Hanya pemeriksa terpilih atau Admin berbeda yang dapat memutuskan.',403);
   if(b.action!=='CANCEL'&&t.status!=='SUBMITTED')throw new AppError('Bukti belum dikirim.',409);
   data.status=b.action==='ACCEPT'?'DONE':b.action==='RETURN'?'OPEN':'CANCELLED';
   await createNotification(t.ownerId,'OUTLET_FIELD_REVIEWED','Hasil pemeriksaan outlet',b.reason,{tab:'sales-follow-up',outletFieldTask:id},db);
  }
  const updated=await db.outletFieldTask.update({where:{id},data});
  await updateFieldPjpResult(db,updated,b.action);
  let proposal;
  if(b.action==='ACCEPT'&&t.evidence?.outcome==='FOUND'){
   const outlet=await db.outlet.findUnique({where:{id:r.outletId}}),changes=Object.fromEntries(['name','address','latitude','longitude'].filter(k=>t.evidence[k]!=null&&t.evidence[k]!==outlet[k]).map(k=>[k,t.evidence[k]]));
   if(Object.keys(changes).length)proposal={changes,reference:`Bukti lapangan ${id}; ${b.reason}`,taskId:id,baseUpdatedAt:outlet.updatedAt.toISOString(),proposedBy:t.ownerId,status:'PENDING',at:event.at};
  }
  await db.outletReview.update({where:{id:r.id},data:{revision:{increment:1},...(proposal?{proposal}:{}),workflow:{...r.workflow,stage:b.action==='SUBMIT'?'SUBMITTED':b.action==='RETURN'?'WAITING_FIELD':'REVIEW'}}});
  await db.auditEvent.create({data:{entityType:'OUTLET_FIELD_TASK',entityId:id,action:b.action,actorId:actor.id,actorName:actor.name,before:{revision:t.revision,status:t.status},after:{...event,submissionId:b.evidence?.requestId||t.evidence?.requestId||randomUUID()}}});return updated;
 },{timeout:15000});invalidateOutletCache();broadcastCacheInvalidation('pjp');return result;
}
