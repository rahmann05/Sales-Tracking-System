import {randomUUID} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {prisma} from '../../../config/prisma.js';
import {AppError} from '../../../utils/errors.js';
import {broadcastCacheInvalidation} from '../../../config/socket.js';
import {scheduleBody,cancelScheduleBody} from './planning-schema.js';
import {getPlan,previewPlan} from './planning.service.js';
import {teamPlanningPolicy} from './planning-policy.service.js';
import {getCodePolicy} from '../../config/services/business-code.service.js';
import {assertPublicationReview,publicationFingerprint} from './publication-review.service.js';
import {resolveIdentity} from '../../roles/role-assignment.service.js';
import {effectivePolicy} from '../../config/services/policy-resolver.service.js';
import {withPolicy} from '../../config/services/policy-context.service.js';
import {featureDecision} from '../../../../../shared/feature-policy.mjs';
import {publishPlan} from './publish-plan.service.js';

export async function schedulePublication(id,raw,actor){
 const body=scheduleBody.parse(raw),at=new Date(body.scheduledAt);
 const result=await prisma.$transaction(async tx=>{
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('planning:territories'))`;
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`pjp-plan:${id}`}))`;
  const plan=await getPlan(id,actor,tx),previous=plan.publicationSchedule;
  // Response lost after commit: only the exact request may reuse the accepted schedule.
  if(plan.status==='SCHEDULED'&&previous?.requestedRevision===body.revision&&previous.actorId===actor.id&&previous.at===at.toISOString()&&isDeepStrictEqual(previous.body,{revision:body.revision,note:body.note,codes:body.codes,acknowledgeWarnings:body.acknowledgeWarnings}))return plan;
  if(plan.status!=='DRAFT'||plan.revision!==body.revision)throw new AppError('Rencana berubah atau sudah dijadwalkan. Muat ulang sebelum menjadwalkan.',409);
  if(+at<=Date.now())throw new AppError('Pilih waktu penerbitan yang akan datang.',400);
  if(+at>=+new Date(`${plan.startsOn}T00:00:00+07:00`)+86400000)throw new AppError('Penerbitan paling lambat pada hari pertama periode rencana (WIB).',400);
  const {values}=await teamPlanningPolicy(plan.supervisorId),role=values.PJP_PUBLISH_ROLE;
  if(values.PJP_ALLOW_SCHEDULED_PUBLISH===false)throw new AppError('Penerbitan terjadwal dinonaktifkan untuk tim ini.',409);
  if(role!=='BOTH'&&role!==actor.role)throw new AppError('Role Anda tidak dapat menerbitkan PJP tim ini.',403);
  const review=await previewPlan(plan,actor,tx),codePolicy=await getCodePolicy('PJP');
  assertPublicationReview(review,body,codePolicy);
  if(codePolicy.mode==='MANUAL'&&await tx.pjp.findFirst({where:{code:{in:Object.values(body.codes)}},select:{id:true}}))throw new AppError('Kode manual sudah digunakan. Ganti sebelum menjadwalkan.',409);
  const payload={revision:body.revision,note:body.note,codes:body.codes,acknowledgeWarnings:body.acknowledgeWarnings};
  return tx.pjpPlan.update({where:{id},data:{status:'SCHEDULED',scheduledAt:at,publicationNextAttemptAt:at,revision:plan.revision+1,updatedBy:actor.id,
   publicationSchedule:{token:randomUUID(),state:'PENDING',actorId:actor.id,at:at.toISOString(),requestedRevision:body.revision,body:payload,fingerprint:publicationFingerprint(plan,review,values,codePolicy)},
   history:[...plan.history,{at:new Date().toISOString(),action:'SCHEDULE',actorId:actor.id,note:body.note,scheduledAt:at.toISOString()}]}});
 },{timeout:60000});
 broadcastCacheInvalidation('pjp');return result;
}

export async function cancelPublication(id,raw,actor){
 const body=cancelScheduleBody.parse(raw);
 const result=await prisma.$transaction(async tx=>{
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`pjp-plan:${id}`}))`;
  const plan=await getPlan(id,actor,tx),last=plan.history.at(-1);
  if(plan.status==='DRAFT'&&last?.action==='CANCEL_SCHEDULE'&&last.actorId===actor.id&&last.note===body.note&&last.revision===body.revision)return plan;
  if(plan.status!=='SCHEDULED'||plan.revision!==body.revision)throw new AppError('Jadwal berubah atau sudah diterbitkan. Muat ulang rencana.',409);
  return tx.pjpPlan.update({where:{id},data:{status:'DRAFT',scheduledAt:null,publicationNextAttemptAt:null,revision:plan.revision+1,updatedBy:actor.id,
   publicationSchedule:{...plan.publicationSchedule,state:'CANCELLED'},history:[...plan.history,{at:new Date().toISOString(),action:'CANCEL_SCHEDULE',actorId:actor.id,note:body.note,revision:body.revision}]}});
 });
 broadcastCacheInvalidation('pjp');return result;
}

async function markFailed(plan,error){
 await prisma.$transaction(async tx=>{
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`pjp-plan:${plan.id}`}))`;
  const current=await tx.pjpPlan.findUnique({where:{id:plan.id}});
  if(current?.status!=='SCHEDULED'||current.revision!==plan.revision||current.publicationSchedule?.token!==plan.publicationSchedule.token)return;
  const reason=error.isOperational?error.message:'Layanan penerbitan gagal. Tinjau ulang kalender dan jadwalkan kembali; tidak ada PJP parsial yang diterbitkan.';
  await tx.pjpPlan.update({where:{id:plan.id},data:{status:'DRAFT',scheduledAt:null,publicationNextAttemptAt:null,revision:current.revision+1,
   publicationSchedule:{...current.publicationSchedule,state:'FAILED',failure:reason},
   history:[...current.history,{at:new Date().toISOString(),action:'SCHEDULE_FAILED',actorId:plan.publicationSchedule.actorId,note:reason}]}});
 });
 broadcastCacheInvalidation('pjp');
}

// Durable DB queue; transaction locks arbitrate workers/cancellation. No PJP is created until all checks pass.
export async function runScheduledPublications({planIds}={}){
 const now=new Date();
 const plans=await prisma.pjpPlan.findMany({where:{status:'SCHEDULED',scheduledAt:{lte:now},OR:[{publicationNextAttemptAt:null},{publicationNextAttemptAt:{lte:now}}],...(planIds?{id:{in:planIds}}:{})},orderBy:{scheduledAt:'asc'},take:25});
 const result={published:0,failed:0,deferred:0,skipped:0};
 for(const plan of plans){
  try{
   const record=await prisma.user.findUnique({where:{id:plan.publicationSchedule?.actorId}});
   if(!record||record.deletedAt)throw new AppError('Akun penerbit tidak aktif. Admin/SPV perlu meninjau dan menjadwalkan ulang.',403);
   const actor=await resolveIdentity(record),policy=await effectivePolicy(actor,Date.now(),{fresh:true});
   if(!featureDecision(policy.values,'/api/v1/pjp/planning/'+plan.id+'/publish','POST').allowed){
    await prisma.pjpPlan.updateMany({where:{id:plan.id,status:'SCHEDULED',revision:plan.revision},data:{publicationNextAttemptAt:new Date(Date.now()+60000)}});
    result.deferred++;continue;
   }
   const response=await withPolicy(policy,()=>publishPlan(plan.id,{...plan.publicationSchedule.body,revision:plan.revision},actor,{token:plan.publicationSchedule.token}));
   if(response.skipped||response.replayed)result.skipped++;else result.published++;
  }catch(error){await markFailed(plan,error);result.failed++;}
 }
 return result;
}
