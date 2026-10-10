import {randomUUID} from 'node:crypto';
import {prisma} from '../../../config/prisma.js';
import {AppError} from '../../../utils/errors.js';
import {updateOutletSchema} from '../outlets.schema.js';
import {updateOutlet} from './update-outlet.service.js';
import {reviewPeople} from '../../config/services/approval-readiness.service.js';
import {reviewOutlet,lockOutlet} from './outlet-review-policy.service.js';
import {effectivePolicy} from '../../config/services/policy-resolver.service.js';
import {withPolicy} from '../../config/services/policy-context.service.js';
import {invalidateOutletCache} from './outlets.helpers.js';
import {invalidateClusterCache} from '../../clusters/services/clusters.helpers.js';
const prefix='_OUTLET_CHANGE_QUEUE:';
async function actorFor(db,user){
 const actor=(await reviewPeople(db)).find(p=>p.id===user?.id&&!p.deletedAt);
 if(!actor||!['ADMIN','SUPERVISOR'].includes(actor.role)||actor.permissions.can_manage_outlets!==true)throw new AppError('Izin mengelola master outlet tidak tersedia.',403);
 return actor;
}
async function audit(db,job,action,actor,before={}){await db.auditEvent.create({data:{entityType:'OUTLET_CHANGE_QUEUE',entityId:job.id,action,actorId:actor?.id||job.actorId,actorName:actor?.name||job.actorName,before,after:job}});}
export async function queueOutletChange(id,raw,user){
 const {effectiveAt,...body}=raw||{};
 const input=updateOutletSchema.parse({params:{id},body}).body;
 const at=effectiveAt?new Date(effectiveAt):new Date();
 if(!Number.isFinite(+at)||+at<Date.now()-60000||+at>Date.now()+366*86400000)throw new AppError('Waktu penerapan harus sekarang atau mendatang, maksimal 366 hari.',422);
 return prisma.$transaction(async db=>{
  await lockOutlet(db,id);const actor=await actorFor(db,user);const outlet=await reviewOutlet(db,actor,id);
  const policy=await effectivePolicy(actor);
  if(policy.values.FEATURE_OUTLET_MASTER_MODE!=='ACTIVE'||policy.values.OUTLET_DEFERRED_CHANGE_ENABLED===false)throw new AppError('Perubahan master outlet tertunda baru dinonaktifkan.',403);
  const pending=await db.systemConfig.count({where:{key:{startsWith:prefix},AND:[{value:{path:['outletId'],equals:id}},{value:{path:['state'],equals:'PENDING'}}]}});
  if(pending)throw new AppError('Outlet sudah memiliki perubahan tertunda. Batalkan usulan lama sebelum membuat usulan baru.',409);
  await updateOutlet(id,input,actor,{db,validateOnly:true});
  const job={id:randomUUID(),outletId:id,label:outlet.name,actorId:actor.id,actorName:actor.name,state:'PENDING',effectiveAt:at.toISOString(),createdAt:new Date().toISOString(),input,lastError:null};
  await db.systemConfig.create({data:{key:prefix+job.id,value:job}});await audit(db,job,'QUEUE',actor);return job;
 },{timeout:30000});
}
export async function listOutletChanges(id,user){
 const actor=await actorFor(prisma,user);await reviewOutlet(prisma,actor,id,true);
 return (await prisma.systemConfig.findMany({where:{key:{startsWith:prefix},value:{path:['outletId'],equals:id}},orderBy:{updatedAt:'desc'},take:20})).map(r=>r.value);
}
export async function cancelOutletChange(id,jobId,reason,user){
 if(typeof reason!=='string'||reason.trim().length<5||reason.length>1000)throw new AppError('Alasan pembatalan minimal lima karakter.',422);
 return prisma.$transaction(async db=>{
  await lockOutlet(db,id);const actor=await actorFor(db,user);await reviewOutlet(db,actor,id,true);
  const row=await db.systemConfig.findUnique({where:{key:prefix+jobId}}),job=row?.value;
  if(!job||job.outletId!==id)throw new AppError('Usulan tidak ditemukan.',404);
  if(job.state!=='PENDING')throw new AppError('Hanya usulan tertunda dapat dibatalkan.',409);
  const next={...job,state:'CANCELLED',cancelReason:reason.trim(),finishedAt:new Date().toISOString()};
  await db.systemConfig.update({where:{key:row.key},data:{value:next}});await audit(db,next,'CANCEL',actor,job);return next;
 });
}
export async function runOutletChanges(now=Date.now(),{ids}={}){
 const rows=await prisma.systemConfig.findMany({where:{key:ids?{in:ids.map(id=>prefix+id)}:{startsWith:prefix},AND:[{value:{path:['state'],equals:'PENDING'}},{value:{path:['effectiveAt'],lte:new Date(now).toISOString()}}]},orderBy:{updatedAt:'asc'},take:100});
 let applied=0;
 for(const candidate of rows){
  try{
   const result=await prisma.$transaction(async db=>{
    await lockOutlet(db,candidate.value.outletId);const row=await db.systemConfig.findUnique({where:{key:candidate.key}}),job=row?.value;
    if(job?.state!=='PENDING'||+new Date(job.effectiveAt)>now)return null;
    const actor=await actorFor(db,{id:job.actorId});await reviewOutlet(db,actor,job.outletId);
    const outlet=await withPolicy(await effectivePolicy(actor),()=>updateOutlet(job.outletId,job.input,actor,{db}));
    const next={...job,state:'APPLIED',finishedAt:new Date().toISOString(),lastError:null};
    await db.systemConfig.update({where:{key:row.key},data:{value:next}});await audit(db,next,'APPLY',actor,job);return outlet;
   },{timeout:30000});
   if(result){applied++;invalidateOutletCache();invalidateClusterCache(result.clusterId);}
  }catch(error){
   // Busy work is retried; conflicts and revoked access require a fresh, explicit proposal.
   await prisma.$transaction(async db=>{
    await lockOutlet(db,candidate.value.outletId);const row=await db.systemConfig.findUnique({where:{key:candidate.key}});
    if(row?.value.state!=='PENDING'||+row.updatedAt!==+candidate.updatedAt)return;
    const job=row.value,busy=error.code==='OUTLET_BUSY';
    if(busy&&job.lastError===error.message)return;
    const next={...job,state:busy?'PENDING':'FAILED',lastError:error.message,...(!busy?{finishedAt:new Date().toISOString()}:{} )};
    await db.systemConfig.update({where:{key:row.key},data:{value:next}});await audit(db,next,busy?'WAIT':'FAIL',null,job);
   });
  }
 }
 return applied;
}
