import {z} from 'zod';
import {randomUUID} from 'node:crypto';
import {prisma} from '../../../config/prisma.js';
import {AppError} from '../../../utils/errors.js';
import {reviewActor} from './outlet-review-access.service.js';
import {reviewScope} from './outlet-review-policy.service.js';
import {openOutletReview} from './outlet-reviews.service.js';
import {validateOutlet} from './validate-outlet.service.js';
import {effectivePolicy} from '../../config/services/policy-resolver.service.js';
import {withPolicy} from '../../config/services/policy-context.service.js';
import {getDynamicConfig} from '../../config/config.service.js';
import {actionNames} from '../../../../../shared/business-actions.mjs';
const input=z.object({requestId:z.string().uuid(),outletIds:z.array(z.string().min(1)).min(1).max(100),reason:z.string().trim().min(10).max(2000)}).strict();
export const jobActionInput=z.object({action:z.enum(actionNames('OUTLET_BATCH')),reason:z.string().trim().min(5).max(1000)}).strict();
const jobLock=async(db,id)=>db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`outlet-job:${id}`}))`;
export async function startValidationJob(raw,user){
 const b=input.parse(raw),actor=await reviewActor(prisma,user,'can_run_outlet_review');
 if(new Set(b.outletIds).size!==b.outletIds.length||b.outletIds.length>await getDynamicConfig('OUTLET_REVIEW_BATCH_LIMIT',30))throw new AppError('Daftar outlet duplikat atau melebihi batas batch.',422);
 if(await prisma.outlet.count({where:{id:{in:b.outletIds},...await reviewScope(actor,prisma)}})!==b.outletIds.length)throw new AppError('Sebagian outlet di luar wilayah.',403);
 return prisma.$transaction(async db=>{
  await jobLock(db,b.requestId);const old=await db.outletValidationJob.findUnique({where:{requestId:b.requestId}});
  if(old){if(old.actorId!==actor.id||JSON.stringify(old.items.map(i=>i.outletId).sort())!==JSON.stringify([...b.outletIds].sort())||old.reason!==b.reason)throw new AppError('Identitas batch dipakai untuk isi berbeda.',409);return old;}
  return db.outletValidationJob.create({data:{requestId:b.requestId,actorId:actor.id,reason:b.reason,items:b.outletIds.map(outletId=>({outletId,state:'WAITING',attempts:0}))}});
 });
}
export async function validationJobs(user){await reviewActor(prisma,user,'can_run_outlet_review');return prisma.outletValidationJob.findMany({where:{actorId:user.id},orderBy:{createdAt:'desc'},take:20});}
export async function changeValidationJob(id,raw,user){
 const b=jobActionInput.parse(raw);await reviewActor(prisma,user,'can_run_outlet_review');
 return prisma.$transaction(async db=>{await jobLock(db,id);const job=await db.outletValidationJob.findFirst({where:{id,actorId:user.id}});if(!job)throw new AppError('Batch tidak ditemukan.',404);
  const items=job.items.map(i=>b.action==='RETRY'&&i.state==='FAILED'&&i.attempts<3?{...i,state:'WAITING'}:i);
  if(b.action!=='STOP'&&job.leaseUntil&&+job.leaseUntil>Date.now())throw new AppError('Tunggu outlet yang sedang diproses.',409);
  return db.outletValidationJob.update({where:{id},data:{status:b.action==='STOP'?(job.leaseToken?'STOPPING':'PAUSED'):'QUEUED',items}});
 });
}
export async function runValidationJobs(){
 const row=await prisma.outletValidationJob.findFirst({where:{status:{in:['QUEUED','RUNNING','STOPPING']},OR:[{leaseUntil:null},{leaseUntil:{lt:new Date()}}]},orderBy:{createdAt:'asc'}});if(!row)return {processed:0};
 const claim=await prisma.$transaction(async db=>{
  await jobLock(db,row.id);const job=await db.outletValidationJob.findUnique({where:{id:row.id}});
  if(!['QUEUED','RUNNING','STOPPING'].includes(job.status)||job.leaseUntil&&+job.leaseUntil>Date.now())return null;
  const recovered=job.items.map(i=>i.state==='RUNNING'&&i.attempts>=3?{...i,state:'FAILED',error:'Pemeriksaan terputus tiga kali. Tinjau kasus secara individual.'}:i.state==='RUNNING'?{...i,state:'WAITING'}:i);
  if(job.status==='STOPPING'){await db.outletValidationJob.update({where:{id:job.id},data:{items:recovered,status:'PAUSED',leaseToken:null,leaseUntil:null}});return null;}
  const index=recovered.findIndex(i=>i.state==='WAITING');
  if(index<0){await db.outletValidationJob.update({where:{id:job.id},data:{items:recovered,status:'DONE',leaseToken:null,leaseUntil:null}});return null;}
  const token=randomUUID(),items=recovered.map((i,n)=>n===index?{...i,state:'RUNNING',attempts:i.attempts+1}:i);
  await db.outletValidationJob.update({where:{id:job.id},data:{items,status:'RUNNING',leaseToken:token,leaseUntil:new Date(Date.now()+900000)}});return {job:{...job,items},index,token};
 });if(!claim)return {processed:0};
 let result;
 try{
  const actor=await reviewActor(prisma,{id:row.actorId},'can_run_outlet_review'),policy=await effectivePolicy(actor,Date.now(),{fresh:true});
  if(policy.values.FEATURE_OUTLET_REVIEW_MODE!=='ACTIVE')throw new AppError('Pekerjaan baru validasi sedang dijeda.',409);
  result=await withPolicy(policy,async()=>{const item=claim.job.items[claim.index],review=await openOutletReview(item.outletId,{reason:claim.job.reason},actor);const run=await validateOutlet(item.outletId,{reviewId:review.id,revision:review.revision},actor);return {state:run.code==='ERROR'?'FAILED':'DONE',code:run.code,reviewId:review.id,calls:run.calls};});
 }catch(e){result={state:'FAILED',error:e.isOperational?e.message:'Pemeriksaan belum berhasil. Coba ulang atau periksa konfigurasi layanan.'};}
 await prisma.$transaction(async db=>{await jobLock(db,row.id);const job=await db.outletValidationJob.findUnique({where:{id:row.id}});if(job.leaseToken!==claim.token)return;const items=job.items.map((i,n)=>n===claim.index?{...i,...result}:i),pending=items.some(i=>i.state==='WAITING');await db.outletValidationJob.update({where:{id:row.id},data:{items,leaseToken:null,leaseUntil:null,status:job.status==='STOPPING'?'PAUSED':pending?'QUEUED':'DONE'}});});return {processed:1};
}
