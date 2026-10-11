import {issueScope} from '../delivery/services/operational-issues.service.js';
import {canHandleIssue} from '../../../../shared/operational-issues.mjs';
import {tripNextWork,presentAttention,canWorkTrip} from '../../../../shared/operational-attention.mjs';
import {attentionHistory} from './attention-history.service.js';
import {followUpReviewers} from '../../../../shared/follow-up-policy.mjs';
import {reviewPeople} from '../config/services/approval-readiness.service.js';
import {addSlaHours} from '../../../../shared/business-clock.mjs';
import {outletReviewOwners} from '../outlets/services/outlet-review-assignment.service.js';
import {reviewScope} from '../outlets/services/outlet-review-policy.service.js';
import {orderReviewRole} from '../../../../shared/approval-workflow.mjs';
import {prisma} from '../../config/prisma.js';
import {followUpScope} from '../staff-attendance/follow-up.service.js';
import {fulfillment} from '../../../../shared/delivery-operations.mjs';
import {packingBalance} from '../../../../shared/packing.mjs';
import {paginateAttention} from '../../../../shared/attention-queue.mjs';
import {applyAttentionSla} from '../../../../shared/attention-sla.mjs';
import {loadAttentionPolicy} from './attention-sla.service.js';
import {exceptionAttentionRows} from './attention-exceptions.service.js';
import {AppError} from '../../utils/errors.js';
import {loadOrderReviewAssignments} from '../orders/services/order-review-assignment.service.js';
import {outletLocationAttentionRows} from './outlet-location-attention.service.js';
import {canDomainAction} from '../../../../shared/domain-permissions.mjs';

export async function collectAttentionRows(user,policy={}) {
 if(!['ADMIN','SUPERVISOR','KEPALA_GUDANG'].includes(user?.role))throw new AppError('Tidak berwenang membuka antrean pekerjaan',403);
 const spv=user.role==='SUPERVISOR',warehouse=user.role==='KEPALA_GUDANG';
 const stopSelect={status:true,allocatedItems:true,rejectedItems:true,reusableItems:true,returnInspection:true,allocatedCartons:true,returnReceivedAt:true,reusableCartons:true};
 const [orders,packings,routes,issues,activities,people]=await Promise.all([
  prisma.order.findMany({where:{deletedAt:null,status:{in:spv?['PENDING_APPROVAL']:['PENDING_APPROVAL','APPROVED']},...(spv?{createdByUser:{supervisorId:user.id,deletedAt:null}}:{})},select:{id:true,code:true,status:true,customerSnapshot:true,policySnapshot:true,history:true,createdBy:true,createdAt:true,promisedAt:true,createdByUser:{select:{supervisorId:true,deletedAt:true,supervisor:{select:{id:true,name:true,role:true,deletedAt:true}}}},items:{select:{id:true,quantity:true,cancelledQuantity:true}},pjpStop:{select:{outlet:{select:{name:true}}}}}}),
  spv?[]:prisma.packingList.findMany({select:{id:true,code:true,status:true,createdAt:true,releasedAt:true,sourceOrderId:true,sourceOrderIds:true,totalCartons:true,items:true,outlet:{select:{name:true}},deliveryStops:{select:stopSelect}}}),
  spv?[]:prisma.deliveryRoute.findMany({where:{closedAt:null,cancelledAt:null},select:{id:true,code:true,status:true,policySnapshot:true,createdAt:true,onHold:true,departedAt:true,returnedAt:true,plannedStartAt:true,plannedEndAt:true,preparation:true,stops:{select:{id:true,rejectedCartons:true,returnInspection:true,outlet:{select:{name:true}}}},driverId:true,driver:{select:{name:true}}}}),
  !spv&&user.permissions?.can_monitor_delivery===false?[]:prisma.deliveryIssue.findMany({where:{AND:[{status:'OPEN'},await issueScope(prisma,user)]}}),
  warehouse?[]:prisma.staffActivity.findMany({where:{AND:[await followUpScope(user),{OR:[{followUp:{path:['status'],equals:'OPEN'}},{followUp:{path:['status'],equals:'SUBMITTED'}}]}]},select:{id:true,userId:true,outletName:true,checkInAt:true,followUp:true,policySnapshot:true}}),
  prisma.user.findMany({where:{deletedAt:null,...(spv?{OR:[{id:user.id},{supervisorId:user.id}]}:{role:{in:warehouse?['ADMIN','KEPALA_GUDANG','SUPIR']:['ADMIN','KEPALA_GUDANG','SUPIR','SALES','SUPERVISOR']}})},select:{id:true,name:true,role:true,supervisorId:true}}),
 ]);
 const blocked=warehouse?[]:await prisma.staffActivity.findMany({where:{checklist:{path:['autoFollowUp','status'],equals:'BLOCKED'},...(spv?{userId:user.id}:{})},select:{id:true,userId:true,outletName:true,checklist:true,followUp:true}});
 const reviewers=await reviewPeople(prisma);
 const rows=await exceptionAttentionRows(user),name=id=>people.find(p=>p.id===id)?.name||null;
 if(canDomainAction(user,'SYSTEM')){
  const cases=await prisma.systemConfig.findMany({where:{key:{startsWith:'_AUTO_DELEGATION_CASE:'},OR:[{value:{path:['state'],equals:'BLOCKED'}},{value:{path:['state'],equals:'RETRY'}}]},orderBy:{updatedAt:'asc'}});
  for(const row of cases)rows.push({key:row.key,category:'EXCEPTION',stage:'AUTO_DELEGATION',title:`Auto-delegasi · ${row.value.label}`,since:row.value.updatedAt,ownerId:user.id,ownerName:user.name,responsibleRole:'ADMIN',needsReview:true,nextAction:row.value.lastError||'Menunggu pemindaian ulang. Periksa aturan, sakelar global dan status worker.',target:'SYSTEM_CONFIG'});
 }
 const reviewAssignments=await loadOrderReviewAssignments(orders.filter(order=>order.status==='PENDING_APPROVAL'));
 for(const o of orders){
  if(o.status==='APPROVED'&&['FULFILLED','CLOSED_WITH_CANCELLATION'].includes(fulfillment(o,packings).fulfillmentStatus))continue;
  const required=orderReviewRole(o),supervisor=o.createdByUser?.supervisor,teamOwner=required!=='ADMIN'&&o.status==='PENDING_APPROVAL'&&supervisor?.role==='SUPERVISOR'&&!supervisor.deletedAt?supervisor:null;
  const balance=fulfillment(o,packings);
  if(o.status==='APPROVED'&&!balance.fulfillmentLines.some(line=>line.unpacked>0))continue;
  rows.push({key:`order:${o.id}`,category:'ORDER',stage:o.status==='PENDING_APPROVAL'?'ORDER_APPROVAL':'ORDER_FULFILLMENT',title:`${o.code||o.id} · ${o.pjpStop?.outlet?.name||o.customerSnapshot?.name||'Order'}`,since:o.createdAt,dueAt:o.status==='APPROVED'?o.promisedAt:null,ownerId:teamOwner?.id,ownerName:teamOwner?.name,ownerSource:teamOwner?'TEAM_SUPERVISOR':null,responsibleRole:o.status==='PENDING_APPROVAL'?(required==='BOTH'?'ADMIN / SPV':required):'ADMIN',nextAction:o.status==='PENDING_APPROVAL'?'Periksa dan putuskan order':'Buat dokumen untuk barang yang belum tercakup packing list',target:o.status==='PENDING_APPROVAL'?'APPROVAL':'PACKING_ORDER',reference:{orderId:o.id}});
 }
 for(const p of packings){
  if(p.status!=='DRAFT'&&packingBalance(p).remainingCartons<=0)continue;
  rows.push({key:`packing:${p.id}`,category:'PACKING',stage:p.status==='DRAFT'?'PACKING_DRAFT':'PACKING_ALLOCATION',title:`${p.code} · ${p.outlet.name}`,since:p.releasedAt||p.createdAt,responsibleRole:p.status==='DRAFT'?'ADMIN':'KEPALA GUDANG',nextAction:p.status==='DRAFT'?'Lengkapi dan serahkan dokumen':'Jadwalkan muatan yang belum masuk perjalanan',target:'PACKING',reference:{packingListId:p.id}});
 }
 for(const r of routes){
  const work=tripNextWork(r);
  rows.push({key:`trip:${r.id}`,category:work.stage==='RETURN_INSPECTION'?'RETURN':'TRIP',title:r.code,since:r.returnedAt||r.departedAt||r.createdAt,dueAt:work.dueAt||(r.returnedAt?null:r.departedAt?r.plannedEndAt:r.plannedStartAt),...work,actionTitle:work.nextAction,actionableForUser:canWorkTrip(user,work),target:work.stage==='RETURN_INSPECTION'?'DELIVERY':'ROUTE',reference:{routeId:r.id,...(work.stopId?{stopId:work.stopId}:{})}});
 }
 for(const i of issues)rows.push({key:`issue:${i.id}`,category:'ISSUE',title:i.title,since:i.createdAt,dueAt:i.dueAt,ownerId:i.ownerId,ownerName:name(i.ownerId),responsibleRole:i.responsibleRole||'KEPALA_GUDANG',actionTitle:'Tangani masalah / keluhan',actionableForUser:canHandleIssue(user,i)&&(!i.ownerId||i.ownerId===user.id||user.role==='ADMIN'),nextAction:i.reason,target:'ISSUE',reference:{...(i.routeId?{routeId:i.routeId}:{}),...(i.orderId?{orderId:i.orderId}:{}),...(i.packingListId?{packingListId:i.packingListId}:{})},issue:i});
 for(const a of blocked)if(!a.followUp)rows.push({key:`auto-followup:${a.id}`,category:'VISIT',stage:'AUTO_FOLLOW_UP',title:`${a.outletName||'Supervisi'} · tugas otomatis belum terbentuk`,since:a.checklist.autoFollowUp.at,ownerId:a.userId,ownerName:name(a.userId),responsibleRole:'ADMIN / SPV',nextAction:'Perbaiki penugasan dan bentuk tugas dari temuan yang tersimpan',target:'AUTO_FOLLOW_UP',activityId:a.id,blockedFollowUp:a.checklist.autoFollowUp});
 for(const a of activities){const f=a.followUp,review=f.status==='SUBMITTED',pic=people.find(p=>p.id===f.ownerId),eligible=review?followUpReviewers(pic,reviewers,f.reviewerMode||'BOTH'):[],reviewer=eligible.find(person=>person.role==='SUPERVISOR')||eligible[0];
  rows.push({key:`visit:${a.id}`,category:'VISIT',stage:review?'FOLLOW_UP_REVIEW':'FOLLOW_UP',title:a.outletName||'Arahan kunjungan',since:review?f.submission?.at:f.createdAt||a.checkInAt,dueDate:f.dueDate,ownerId:review?reviewer?.id:f.ownerId,ownerName:review?reviewer?.name:f.ownerName||name(f.ownerId),...(review?{actionableForUser:eligible.some(person=>person.id===user.id)}:{}),ownerSource:reviewer?'TEAM_SUPERVISOR':null,responsibleRole:review?'SPV / ADMIN':'SALES / SPV',nextAction:review?'Periksa hasil dan bukti, lalu terima atau minta perbaikan':f.note,target:'FOLLOW_UP',activityId:a.id,status:f.status,followUp:f,policySnapshot:a.policySnapshot});}
 const locationRows=await outletLocationAttentionRows(user,policy);
 const outletReviews=warehouse||user.permissions?.can_validate_outlet===false?[]:await prisma.outletReview.findMany({where:{status:{in:['OPEN','WAITING_FIELD']},outlet:await reviewScope(user,prisma)},include:{outlet:{include:{cluster:true}},fieldTasks:{where:{status:{in:['OPEN','SUBMITTED']}},take:1}}});
 for(const review of outletReviews){
  const task=review.fieldTasks?.[0],submitted=task?.status==='SUBMITTED',owner=task?people.find(p=>p.id===(submitted?task.reviewerId:task.ownerId)):(await outletReviewOwners(prisma,review.outlet)).find(p=>p.id===review.ownerId);
  rows.push({key:`outlet-review:${review.id}`,category:'OUTLET_REVIEW',stage:'OUTLET_REVIEW',status:submitted?'SUBMITTED':review.status,needsReview:!task||submitted,title:`${review.outlet.name} · pemeriksaan opsional`,since:task?.updatedAt||review.createdAt,dueAt:task?.dueAt||review.dueAt,...(submitted&&Number(task.policySnapshot?.values?.OUTLET_FIELD_REVIEW_SLA_HOURS??24)>0?{reviewDueAt:addSlaHours(task.updatedAt,task.policySnapshot?.values?.OUTLET_FIELD_REVIEW_SLA_HOURS??24,task.policySnapshot?.values||{}).toISOString()}:{}),ownerId:owner?.id||null,ownerName:owner?.name||null,responsibleRole:task&&!submitted?'SALES':'ADMIN / SPV',nextAction:submitted?'Periksa bukti Sales dan usulan koreksi':task?'Tunggu hasil pemeriksaan Sales':review.workflow?.technical==='ERROR'?'Periksa konfigurasi/kuota dan ulangi Google':'Bandingkan bukti dan putuskan kasus',target:'OUTLET_REVIEW',reference:{outletReviewId:review.id}});
 }
 for(const location of locationRows){
  const review=outletReviews.find(r=>r.outletId===location.reference.outletId);
  const existing=review&&rows.find(r=>r.reference?.outletReviewId===review.id);
  if(existing)existing.locationAlert=location.locationAlert;
  else rows.push(location);
 }
 return {rows:rows.map(row=>{
   const order=orders.find(order=>order.id===row.reference?.orderId),required=orderReviewRole(order);
   const saved=row.stage==='ORDER_APPROVAL'?reviewAssignments.get(row.reference?.orderId):null;
   const assignment=saved&&(!['ADMIN','SUPERVISOR'].includes(required)||saved.ownerRole===required)?saved:null;
   const supervisor=assignment?orders.find(order=>order.id===row.reference?.orderId)?.createdByUser?.supervisor:null;
   const fallback=required!=='ADMIN'&&supervisor?.role==='SUPERVISOR'&&!supervisor.deletedAt?supervisor:null;
   const assigned=assignment?{approvalAssignment:assignment,ownerId:assignment.ownerId?(assignment.ownerValid?assignment.ownerId:null):fallback?.id,ownerName:assignment.ownerId?(assignment.ownerValid?assignment.ownerCurrentName||assignment.ownerName:null):fallback?.name,ownerSource:assignment.ownerId?'MANUAL_REVIEWER':fallback?'TEAM_SUPERVISOR':null,dueAt:assignment.dueAt||null}:{};
   const merged={...row,...assigned,needsReview:row.needsReview||row.stage==='ORDER_APPROVAL'||row.status==='SUBMITTED'};
   if(row.target==='EXCEPTION')merged.actionableForUser=row.canDecide===true;
   if(merged.stage==='ORDER_APPROVAL'&&!assignment?.ownerId)merged.actionableForUser=required==='BOTH'?['ADMIN','SUPERVISOR'].includes(user.role):required===user.role;
   if(assignment?.ownerValid===false)merged.actionableForUser=user.role==='ADMIN';
   return presentAttention(applyAttentionSla(merged,policy),user);
 }),people:people.filter(p=>['ADMIN','KEPALA_GUDANG','SUPIR'].includes(p.role))};
}
export async function getAttention(user,query={}){
 if(!['ADMIN','SUPERVISOR','KEPALA_GUDANG'].includes(user?.role))throw new AppError('Tidak berwenang membuka antrean pekerjaan',403);
 if(query.filter==='HISTORY')return attentionHistory(user,{page:1,limit:25,...query});
 const policy=await loadAttentionPolicy(),{rows,people}=await collectAttentionRows(user,policy);
 return {...paginateAttention(rows,{...query,actorId:user.id}),generatedAt:new Date().toISOString(),people,policyNote:'SLA memakai jam kalender/jam kerja WIB sesuai pengaturan dan kebijakan saat ini untuk pekerjaan tanpa tenggat eksplisit. Nol berarti belum aktif. PIC dari tim SPV adalah penanggung jawab berdasarkan keanggotaan saat ini; penugasan pemeriksa order oleh Admin didahulukan.'};
}
