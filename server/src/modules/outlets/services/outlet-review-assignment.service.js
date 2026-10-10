import {reviewActor} from './outlet-review-access.service.js';
import {resolveIdentity} from '../../roles/role-assignment.service.js';
import {z} from 'zod';
import {prisma} from '../../../config/prisma.js';
import {AppError} from '../../../utils/errors.js';
import {lockOutlet,reviewOutlet,actorSnapshot} from './outlet-review-policy.service.js';
import {capturePolicySnapshot} from '../../config/services/process-policy.service.js';
import {addSlaHours} from '../../../../../shared/business-clock.mjs';
export async function outletReviewOwners(db,outlet){
 const users=await db.user.findMany({where:{deletedAt:null,OR:[{role:'ADMIN'},...(outlet.cluster?.supervisorId?[{id:outlet.cluster.supervisorId,role:'SUPERVISOR'}]:[])]},select:{id:true,name:true,role:true,roleCode:true,permissions:true}});
 return (await Promise.all(users.map(resolveIdentity))).filter(u=>u.permissions?.can_validate_outlet===true&&['can_run_outlet_review','can_apply_outlet_review','can_assign_outlet_review'].some(k=>u.permissions[k]===true)).map(({id,name,role})=>({id,name,role}));
}
export async function initialReviewAssignment(db,outlet,actor){
 const snapshot=await capturePolicySnapshot(),values=snapshot.values,owners=await outletReviewOwners(db,outlet);
 const owner=values.OUTLET_REVIEW_DEFAULT_OWNER==='REQUESTER'?owners.find(u=>u.id===actor.id):values.OUTLET_REVIEW_DEFAULT_OWNER==='TEAM_SUPERVISOR'?owners.find(u=>u.id===outlet.cluster?.supervisorId):null;
 const now=new Date(),hours=values.OUTLET_REVIEW_SLA_HOURS||0;
 return {ownerId:owner?.id||null,dueAt:hours>0?addSlaHours(now,hours,values):null,policySnapshot:snapshot,assignment:{ownerId:owner?.id||null,ownerName:owner?.name||null,source:owner?'POLICY':'ADMIN_QUEUE',at:now.toISOString(),actor:actorSnapshot(actor)}};
}
export async function assignOutletReview(outletId,id,raw,actor){
 const body=z.object({revision:z.number().int().positive(),ownerId:z.string().min(1).nullable(),dueAt:z.string().datetime({offset:true}).nullable(),reason:z.string().trim().min(5).max(2000)}).strict().parse(raw);
 return prisma.$transaction(async tx=>{
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('approval:actors'))`;actor=await reviewActor(tx,actor,'can_assign_outlet_review');
  await lockOutlet(tx,outletId);const outlet=await reviewOutlet(tx,actor,outletId);
  const review=await tx.outletReview.findUnique({where:{id}});
  if(!review||review.outletId!==outletId)throw new AppError('Kasus tidak ditemukan',404);
  if(['COMPLETED','CANCELLED'].includes(review.status)||review.revision!==body.revision)throw new AppError('Kasus berubah atau selesai. Muat ulang sebelum menetapkan PIC.',409);
  const owner=(await outletReviewOwners(tx,outlet)).find(u=>u.id===body.ownerId);
  if(body.ownerId&&!owner)throw new AppError('PIC harus Admin atau Supervisor aktif yang bertanggung jawab atas wilayah outlet dan memiliki akses pemeriksaan',400);
  const entry={ownerId:owner?.id||null,ownerName:owner?.name||null,dueAt:body.dueAt,reason:body.reason,actor:actorSnapshot(actor),at:new Date().toISOString()};
  const updated=await tx.outletReview.update({where:{id},data:{ownerId:body.ownerId,dueAt:body.dueAt?new Date(body.dueAt):null,revision:{increment:1},assignment:{...entry,history:[...(review.assignment?.history||[]),entry]}}});
  await tx.auditEvent.create({data:{entityType:'OUTLET_REVIEW',entityId:id,action:'ASSIGN',actorId:actor.id,actorName:actor.name,before:{ownerId:review.ownerId,dueAt:review.dueAt},after:entry}});
  return updated;
 });
}
