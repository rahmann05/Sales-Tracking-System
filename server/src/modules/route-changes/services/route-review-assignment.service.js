import {z} from 'zod';
import {prisma} from '../../../config/prisma.js';
import {AppError} from '../../../utils/errors.js';
import {inTransaction} from '../../../utils/in-transaction.js';
import {reviewPeople} from '../../config/services/approval-readiness.service.js';
import {getDynamicConfig} from '../../config/config.service.js';
import {policyNotification} from '../../notifications/services/notification-policy.service.js';
import {attachRouteWorkflows,routeWorkflowKey} from './route-workflow.service.js';
import {routeChangeWorkflow,routeChangeReviewGaps} from '../../../../../shared/route-change-workflow.mjs';
const input=z.object({ownerId:z.string().min(1).nullable(),revision:z.number().int().nonnegative(),stage:z.enum(['SUPERVISOR','ADMIN']),dueAt:z.string().datetime({offset:true}).nullable(),reason:z.string().trim().min(5).max(2000)}).strict();
export function assertRouteAssignmentActor(actor){if(!actor||actor.deletedAt||actor.role!=='ADMIN'||actor.permissions?.can_assign_route_review===false)throw new AppError('Admin aktif dengan izin menugaskan pemeriksa rute diperlukan.',403);}
export async function routeReviewAssignmentOptions(id,actor){
 const people=await reviewPeople(prisma);assertRouteAssignmentActor(people.find(p=>p.id===actor.id));
 const found=await prisma.routeChangeRequest.findUnique({where:{id}});if(!found)throw new AppError('Laporan toko tutup tidak ditemukan.',404);
 const [request]=await attachRouteWorkflows(prisma,[found]),flow=routeChangeWorkflow(request);
 return {stage:flow.stage,revision:request.workflow?.assignmentRevision||0,assignment:flow.assignment,people:people.filter(flow.roleEligible).map(({id,name,role})=>({id,name,role}))};
}
export async function assignRouteReview(id,raw,actor,{db=prisma,validateOnly=false,restoreDeadline=false,validUntil=null,scheduled=false}={}){
 const b=input.parse(raw);
 return inTransaction(db,async tx=>{
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('approval:actors'))`;
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`route-change:${id}`}))`;
  const people=await reviewPeople(tx);actor=people.find(p=>p.id===actor.id);assertRouteAssignmentActor(actor);
  const found=await tx.routeChangeRequest.findUnique({where:{id}});if(!found)throw new AppError('Laporan toko tutup tidak ditemukan.',404);
  const [request]=await attachRouteWorkflows(tx,[found]),flow=routeChangeWorkflow(request),workflow=request.workflow||{mode:flow.mode,proposal:flow.proposal};
  if(request.status!=='PENDING_APPROVAL'||flow.stage!==b.stage||(workflow.assignmentRevision||0)!==b.revision)throw new AppError('Tahap atau penugasan rute berubah. Muat ulang sebelum menugaskan.',409);
  if(b.ownerId&&!restoreDeadline&&(!scheduled||validateOnly)&&!await getDynamicConfig('ROUTE_REVIEW_ALLOW_DELEGATION',true))throw new AppError('Penugasan pemeriksa rute baru dinonaktifkan oleh Admin.',403);
  const owner=b.ownerId?people.find(p=>p.id===b.ownerId):null;
  if(b.ownerId&&!flow.roleEligible(owner))throw new AppError('Pengganti harus aktif, berizin dan sesuai tahap; pemohon atau pengusul tidak boleh memeriksa keputusan sendiri.',422);
  if(owner&&(!b.dueAt||!restoreDeadline&&Date.parse(b.dueAt)<=Date.now()))throw new AppError('Tenggat pemeriksa harus di masa depan.',422);
  const before=flow.assignment,assignment=owner?{ownerId:owner.id,ownerName:owner.name,stage:flow.stage,dueAt:b.dueAt,validUntil,assignedBy:actor.id,at:new Date().toISOString()}:null;
  const event={action:owner?'ASSIGN':'RELEASE',actorId:actor.id,at:new Date().toISOString(),reason:b.reason,before,after:assignment};
  const next={...workflow,assignment,assignmentRevision:b.revision+1,assignmentHistory:[...(workflow.assignmentHistory||[]),event]};
  if(routeChangeReviewGaps({...request,workflow:next},people).length)throw new AppError('Penugasan ini meninggalkan tahap rute tanpa pemeriksa aktif. Siapkan petugas sesuai alur terlebih dahulu.',409);
  if(validateOnly)return request;
  await tx.systemConfig.upsert({where:{key:routeWorkflowKey(id)},create:{key:routeWorkflowKey(id),value:next},update:{value:next}});
  await tx.auditEvent.create({data:{entityType:'ROUTE_CHANGE',entityId:id,action:'ASSIGN_REVIEW',actorId:actor.id,actorName:actor.name,before:{assignment:before},after:event}});
  if(owner)await policyNotification(tx,{data:{userId:owner.id,type:'ROUTE_CHANGE_ASSIGNED',title:'Tugas keputusan toko tutup',message:b.reason,payload:{routeChangeRequestId:id}}});
  return {...request,workflow:next};
 });
}
