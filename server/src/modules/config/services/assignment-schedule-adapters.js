import {createHash} from 'node:crypto';
import {AppError} from '../../../utils/errors.js';
import {assignFollowUp} from '../../staff-attendance/follow-up-assignment.service.js';
import {assignReturnInspection} from '../../delivery/services/return-assignment.service.js';
import {assignOutletReview} from '../../outlets/services/outlet-review-assignment.service.js';
import {saveOrderReviewAssignment} from '../../orders/services/order-review-assignment.service.js';
import {ASSIGNMENT_KINDS} from '../../../../../shared/assignment-schedules.mjs';
import {routeAction} from '../../delivery/services/operations.service.js';
import {assignTeam} from '../../teams/teams.service.js';
import {assignRouteReview} from '../../route-changes/services/route-review-assignment.service.js';
import {attachRouteWorkflows} from '../../route-changes/services/route-workflow.service.js';
import {routeChangeWorkflow} from '../../../../../shared/route-change-workflow.mjs';
import {assertOrderOperation} from '../../orders/services/order-operation-permissions.js';
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export {ASSIGNMENT_KINDS};
const rights={ROUTE_REVIEW:'can_assign_route_review',FOLLOW_UP:'can_assign_follow_up',RETURN:'can_monitor_delivery',ORDER_REVIEW:'can_approve_order',OUTLET_REVIEW:'can_assign_outlet_review',PREPARATION:'can_trip_assign_preparation',TEAM:'can_view_team'};
export function assertScheduleActor(actor,kind){
 if(kind==='ORDER_REVIEW')assertOrderOperation(actor,'ASSIGN_REVIEW');
 if(!actor||actor.deletedAt||actor.role!=='ADMIN'||actor.permissions?.[rights[kind]]===false)throw new AppError('Admin aktif dengan izin proses diperlukan untuk menjadwalkan penugasan.',403);
}
export async function assignmentState(db,kind,id){
 let data,label,finished=false,revision=0,ownerId=null,dueAt=null,context={};
 if(kind==='TEAM'){
  data=await db.user.findUnique({where:{id},include:{assignedClusters:{select:{id:true}},pjpTemplates:{select:{id:true}}}});
  if(!data||data.role!=='SALES'||data.deletedAt)throw new AppError('Sales aktif tidak ditemukan.',404);
  label=`Tim ${data.name}`;ownerId=data.supervisorId;context={updatedAt:data.updatedAt.toISOString(),clusterId:data.clusterId,clusters:data.assignedClusters.map(row=>row.id).sort(),templates:data.pjpTemplates.map(row=>row.id).sort()};
 }else if(kind==='FOLLOW_UP'){
  data=await db.staffActivity.findUnique({where:{id}});
  if(!data?.followUp)throw new AppError('Tindak lanjut tidak ditemukan.',404);
  const f=data.followUp;label=`${data.outletName||'Tindak lanjut'} · ${f.instruction||f.note||id}`;finished=f.status!=='OPEN';revision=f.revision||0;ownerId=f.ownerId;dueAt=f.dueDate;context={status:f.status};
 }else if(kind==='RETURN'){
  data=await db.deliveryStop.findUnique({where:{id},include:{deliveryRoute:true}});
  if(!data)throw new AppError('Tujuan pengiriman tidak ditemukan.',404);
  const task=data.deliveryRoute.preparation?.returnTasks?.[id];label=`Retur · ${data.deliveryRoute.code||id}`;finished=!(data.rejectedCartons>0)||Boolean(data.returnInspection||data.deliveryRoute.cancelledAt);revision=task?.revision||0;ownerId=task?.ownerId||null;dueAt=task?.dueAt||null;
 }else if(kind==='ORDER_REVIEW'){
  data=await db.order.findUnique({where:{id}});
  if(!data)throw new AppError('Order tidak ditemukan.',404);
  const task=(await db.systemConfig.findUnique({where:{key:`_ORDER_REVIEW:${id}`}}))?.value;label=`Order ${data.code||id}`;finished=Boolean(data.deletedAt)||data.status!=='PENDING_APPROVAL';revision=task?.revision||0;ownerId=task?.ownerId||null;dueAt=task?.dueAt||null;context={status:data.status,stage:data.history?.filter(e=>['SPV_APPROVED','APPROVED'].includes(e.action)).length||0};
 }else if(kind==='ROUTE_REVIEW'){
  const found=await db.routeChangeRequest.findUnique({where:{id},include:{pjpStop:{select:{outlet:{select:{name:true}}}}}});if(!found)throw new AppError('Laporan toko tutup tidak ditemukan.',404);
  [data]=await attachRouteWorkflows(db,[found]);const flow=routeChangeWorkflow(data),task=data.workflow?.assignment?.stage===flow.stage?data.workflow.assignment:null;
  label=`Toko tutup ${data.pjpStop.outlet.name} · ${flow.stage==='ADMIN'?'keputusan Admin':'keputusan awal'}`;finished=data.status!=='PENDING_APPROVAL';revision=data.workflow?.assignmentRevision||0;ownerId=task?.ownerId||null;dueAt=task?.dueAt||null;context={stage:flow.stage,mode:flow.mode,reportedBy:data.reportedBy,proposalActor:flow.proposal?.actorId||null,validUntil:task?.validUntil||null};
 }else if(kind==='PREPARATION'){
  const [routeId,stage]=id.split(':');if(!['PICK','CHECK','LOAD'].includes(stage))throw new AppError('Tahap persiapan tidak valid.',400);
  data=await db.deliveryRoute.findUnique({where:{id:routeId}});if(!data)throw new AppError('Trip tidak ditemukan.',404);
  const task=data.preparation?.tasks?.[stage];label=`${data.code||routeId} · ${stage}`;finished=data.status!=='DRAFT'||Boolean(data.cancelledAt||data.closedAt||data.preparation?.[stage]);revision=task?.revision||0;ownerId=task?.ownerId||null;dueAt=task?.dueAt||null;context={routeId,stage};
 }else if(kind==='OUTLET_REVIEW'){
  data=await db.outletReview.findUnique({where:{id},include:{outlet:{select:{name:true}}}});
  if(!data)throw new AppError('Kasus validasi tidak ditemukan.',404);
  label=`Validasi ${data.outlet.name}`;finished=['COMPLETED','CANCELLED'].includes(data.status);revision=data.revision;ownerId=data.ownerId;dueAt=data.dueAt?.toISOString()||null;context={outletId:data.outletId,assignment:data.assignment?.at||null};
 }else throw new AppError('Jenis penugasan tidak tersedia.',400);
 return {label,revision,ownerId,dueAt,finished,context,fingerprint:hash({ownerId,dueAt,revision:kind==='OUTLET_REVIEW'?null:revision,finished,context:kind==='TEAM'?{...context,updatedAt:null}:context})};
}
export async function applyAssignment(db,job,state,actor,{restore=false,validateOnly=false}={}){
 assertScheduleActor(actor,job.kind);
 const target=restore?job.before:job.target,reason=restore?`Akhir delegasi ${job.id}: ${job.reason}`:`Jadwal ${job.id}: ${job.reason}`;
 const options={db,validateOnly,restoreDeadline:restore};
 if(job.kind==='TEAM')return assignTeam(job.entityId,{supervisorId:target.ownerId,updatedAt:state.context.updatedAt,reason:reason.slice(0,500)},actor,options);
 if(job.kind==='FOLLOW_UP')return assignFollowUp(job.entityId,actor,{ownerId:target.ownerId,revision:state.revision,dueDate:target.dueAt,reason},options);
 if(job.kind==='ROUTE_REVIEW')return assignRouteReview(job.entityId,{ownerId:target.ownerId,revision:state.revision,stage:state.context.stage,dueAt:target.dueAt,reason},actor,{...options,scheduled:true,validUntil:restore?job.before.context.validUntil:job.endsAt});
 const payload={ownerId:target.ownerId,revision:state.revision,dueAt:target.dueAt,reason};
 if(job.kind==='RETURN')return assignReturnInspection(job.entityId,payload,actor,options);
 if(job.kind==='ORDER_REVIEW')return saveOrderReviewAssignment(job.entityId,payload,actor,options);
 if(job.kind==='PREPARATION')return routeAction(state.context.routeId,{action:'ASSIGN_PREPARATION',stage:state.context.stage,ownerId:target.ownerId,assignmentRevision:state.revision,dueAt:target.dueAt,note:reason},actor,0,options);
 return assignOutletReview(state.context.outletId,job.entityId,payload,actor,options);
}
