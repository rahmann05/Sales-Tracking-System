import {getDynamicConfig} from '../../config/config.service.js';
import {acceptGoogleLocation,assertOutletLocationIdle} from './outlet-google-location.service.js';
import {broadcastCacheInvalidation} from '../../../config/socket.js';
import {updateFieldPjpResult,finishFieldPjpAgenda} from './outlet-field-pjp.service.js';
import {z} from 'zod';
import {prisma} from '../../../config/prisma.js';
import {AppError} from '../../../utils/errors.js';
import {actionNames} from '../../../../../shared/business-actions.mjs';
import {outletDigitalReadiness,outletDigitalRejectionMessage} from '../../../../../shared/outlet-digital-readiness.mjs';
import {adminOutletDecisionReadiness,OUTLET_ADMIN_DEFAULTS} from '../../../../../shared/outlet-admin-decision.mjs';
import {reviewActor} from './outlet-review-access.service.js';
import {lockOutlet,reviewOutlet,actorSnapshot} from './outlet-review-policy.service.js';
import {recordOutletChange} from './outlet-change-policy.service.js';
import {invalidateOutletCache} from './outlets.helpers.js';
import {createNotification} from '../../notifications/services/create-notification.service.js';
export const digitalDecisionInput=z.object({action:z.enum(actionNames('OUTLET_DIGITAL')),revision:z.number().int().positive(),reason:z.string().trim().min(10).max(2000),acknowledgeWarnings:z.boolean().optional(),runId:z.string().optional(),placeId:z.string().optional(),updatedAt:z.string().datetime().optional(),reference:z.string().trim().max(2000).optional(),changes:z.object({name:z.string().trim().min(2).max(200).optional(),address:z.string().trim().min(5).max(1000).optional(),latitude:z.number().finite().min(-90).max(90).optional(),longitude:z.number().finite().min(-180).max(180).optional()}).strict().optional()}).strict();
export async function decideDigitalOutlet(outletId,id,raw,user){
 const b=digitalDecisionInput.parse(raw),permission=b.action==='PROPOSE'?'can_propose_outlet_review':'can_apply_outlet_review';
 const result=await prisma.$transaction(async db=>{
  await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('approval:actors'))`;
  const actor=await reviewActor(db,user,permission);await lockOutlet(db,outletId);const outlet=await reviewOutlet(db,actor,outletId,b.action==='CANCEL'),r=await db.outletReview.findUnique({where:{id},include:{runs:{orderBy:{createdAt:'desc'},take:10},fieldTasks:{where:{status:{in:['OPEN','SUBMITTED']}}}}});
  if(!r||r.outletId!==outletId||r.revision!==b.revision||['COMPLETED','CANCELLED'].includes(r.status))throw new AppError('Kasus berubah atau selesai. Muat ulang.',409);
  const event={action:b.action,reason:b.reason,actor:actorSnapshot(actor),at:new Date().toISOString()};
  let data={revision:{increment:1}},afterMaster;
  if(b.action==='PROPOSE'){
   if(!b.changes||!Object.keys(b.changes).length||!b.updatedAt||new Date(b.updatedAt).getTime()!==outlet.updatedAt.getTime())throw new AppError('Pilih perubahan dan gunakan revisi master terbaru.',409);
   if(!b.reference||b.reference.length<10)throw new AppError('Referensi sumber internal/lapangan yang mengonfirmasi perubahan wajib diisi.',422);
   if((b.changes.latitude===undefined)!==(b.changes.longitude===undefined))throw new AppError('Koreksi lokasi memerlukan kedua koordinat.',422);
   data.proposal={changes:b.changes,reference:b.reference,baseUpdatedAt:b.updatedAt,proposedBy:actor.id,status:'PENDING',at:event.at};data.workflow={...r.workflow,stage:'REVIEW'};
  }else if(b.action==='APPLY'){
   const p=r.proposal;if(!p||p.status!=='PENDING')throw new AppError('Usulan koreksi belum tersedia.',409);
   if(new Date(p.baseUpdatedAt).getTime()!==outlet.updatedAt.getTime())throw new AppError('Master berubah setelah usulan. Ajukan ulang.',409);
   const audit=await recordOutletChange(db,outlet,p.changes,{actor,reason:b.reason,updatedAt:p.baseUpdatedAt,source:'REVIEW',locationEvidence:{source:p.taskId?'FIELD':'MANUAL'}});
   afterMaster=await db.outlet.update({where:{id:outletId},data:{...p.changes,...audit}});data.proposal={...p,status:'APPLIED',decidedBy:actor.id,decidedAt:event.at};data.workflow={...r.workflow,stage:'REVIEW',resultCode:'UNEXAMINED'};
  }else if(b.action==='RETURN'){
   if(r.proposal?.status!=='PENDING')throw new AppError('Tidak ada usulan menunggu keputusan.',409);
   data.proposal={...r.proposal,status:'RETURNED',decidedBy:actor.id,reason:b.reason};
  }else{
   if(r.fieldTasks.some(t=>t.status==='SUBMITTED'))throw new AppError('Periksa bukti Sales yang sudah dikirim sebelum menutup kasus.',409);
   if(['DIGITAL_KEEP','ADMIN_DIGITAL_KEEP'].includes(b.action)){
    const run=r.runs.find(x=>x.id===b.runId),adminReview=b.action==='ADMIN_DIGITAL_KEEP';
    if(adminReview&&actor.role!=='ADMIN')throw new AppError('Konfirmasi dengan pertimbangan Admin hanya tersedia untuk role Admin.',403);
    if(adminReview&&run&&run.id!==r.runs[0]?.id)throw new AppError('Gunakan hasil pemeriksaan Google terakhir untuk pertimbangan Admin. Muat ulang kasus.',409);
    const policy=adminReview?Object.fromEntries(await Promise.all(Object.entries(OUTLET_ADMIN_DEFAULTS).map(async([key,value])=>[key,await getDynamicConfig(key,value)]))):{};
    const readiness=adminReview?adminOutletDecisionReadiness(run,outlet,actor,policy,{placeId:b.placeId}):outletDigitalReadiness(run,outlet,{placeId:b.placeId});
    if(!readiness.canConfirm)throw new AppError(outletDigitalRejectionMessage(readiness),readiness.current?422:409,readiness.issues);
    if(adminReview&&(!b.acknowledgeWarnings||b.reason.length<20))throw new AppError('Tinjau peta dan perbedaan kandidat, centang pernyataan peninjauan, lalu isi alasan Admin minimal 20 karakter.',422);
    const selectedPlaceId=b.placeId||run.result.selectedPlaceId;
    const googleLocation=await getDynamicConfig('OUTLET_GOOGLE_LOCATION_ENABLED',true)?await acceptGoogleLocation(db,outlet,run,actor,b.reason,{adminReview}):undefined;
    await db.outlet.update({where:{id:outletId},data:{...(googleLocation?{googleLocation}:{}),validationStatus:'VALID',validationDetails:{...outlet.validationDetails,qualityConfirmed:{source:adminReview?'ADMIN_DIGITAL':'DIGITAL',name:outlet.name,address:outlet.address},code:run.result.code,decisionSource:adminReview?'ADMIN_DIGITAL':'DIGITAL',placeId:selectedPlaceId,runId:run.id,expiresAt:run.result.expiresAt,stale:false}}});
    if(adminReview)event.adminReview={policy:readiness.policy,warnings:readiness.warnings,originalCode:run.result.code,acknowledged:true};
    event.runId=run.id;event.placeId=selectedPlaceId;
   }else if(b.action==='FIELD_KEEP'){
    if(outlet.googleLocation)await assertOutletLocationIdle(db,outletId);
    const task=await db.outletFieldTask.findFirst({where:{reviewId:id,status:'DONE'},orderBy:{updatedAt:'desc'}});
    if(!task||!task.evidence)throw new AppError('Bukti lapangan yang diterima belum tersedia.',422);
    if(task.evidence.outcome==='FOUND'&&!['name','address','latitude','longitude'].every(k=>task.evidence[k]==null||task.evidence[k]===outlet[k]))throw new AppError('Terapkan usulan koreksi lapangan sebelum menyelesaikan sebagai terverifikasi.',409);
    await db.outlet.update({where:{id:outletId},data:{...(outlet.googleLocation?{googleLocation:{source:'GOOGLE',status:'SUPERSEDED',placeId:outlet.googleLocation.placeId}}:{}),validationStatus:task.evidence.outcome==='FOUND'?'VALID':'WARNING',validationDetails:{method:'FIELD_REVIEW_V1',code:task.evidence.outcome,decisionSource:'FIELD',taskId:task.id,stale:false,...(task.evidence.outcome==='FOUND'?{qualityConfirmed:{source:'FIELD',name:outlet.name,address:outlet.address}}:{})},...(task.evidence.outcome==='FOUND'&&Number.isFinite(task.evidence.latitude)&&Number.isFinite(task.evidence.longitude)?{locationEvidence:{source:'FIELD',taskId:task.id,accuracyMeters:task.evidence.accuracyMeters,capturedAt:task.evidence.capturedAt,actor:actorSnapshot(actor),at:event.at}}:{})}});event.taskId=task.id;
   }else if(b.action==='INTERNAL_KEEP'){
    if(!b.reference||b.reference.length<10)throw new AppError('Referensi bukti internal wajib diisi.',422);
    await db.outlet.update({where:{id:outletId},data:{validationDetails:{...outlet.validationDetails,decisionSource:'INTERNAL',reference:b.reference,stale:false},validationStatus:'LIKELY_VALID'}});event.reference=b.reference;
   }
   data={...data,status:b.action==='CANCEL'?'CANCELLED':'COMPLETED',closedAt:new Date(),workflow:{...r.workflow,stage:b.action==='CANCEL'?'CANCELLED':'COMPLETED'},decision:{...event,history:[...(r.decision?.history||[]),event]}};
   for(const t of r.fieldTasks){await updateFieldPjpResult(db,t,'CANCEL');await db.outletFieldTask.update({where:{id:t.id},data:{status:'CANCELLED',revision:{increment:1},history:[...t.history,{...event,action:'CASE_CLOSED'}]}});await createNotification(t.ownerId,'OUTLET_FIELD_CANCELLED','Tugas validasi ditutup',b.reason,{tab:'sales-follow-up',outletFieldTask:t.id},db);}
  }
  if(data.status==='COMPLETED')await finishFieldPjpAgenda(db,id);
  const updated=await db.outletReview.update({where:{id},data});
  await db.auditEvent.create({data:{entityType:'OUTLET_REVIEW',entityId:id,action:b.action,actorId:actor.id,actorName:actor.name,before:{revision:r.revision,workflow:r.workflow},after:{...event,revision:updated.revision,masterChanged:!!afterMaster}}});return updated;
 },{timeout:15000});invalidateOutletCache();broadcastCacheInvalidation('pjp');return result;
}
