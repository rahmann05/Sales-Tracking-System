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

export async function collectAttentionRows(user,policy={}) {
 if(!['ADMIN','SUPERVISOR','KEPALA_GUDANG'].includes(user?.role))throw new AppError('Tidak berwenang membuka antrean pekerjaan',403);
 const spv=user.role==='SUPERVISOR',warehouse=user.role==='KEPALA_GUDANG';
 const stopSelect={status:true,allocatedItems:true,rejectedItems:true,reusableItems:true,returnInspection:true,allocatedCartons:true,returnReceivedAt:true,reusableCartons:true};
 const [orders,packings,routes,issues,activities,people]=await Promise.all([
  prisma.order.findMany({where:{deletedAt:null,status:{in:spv?['PENDING_APPROVAL']:['PENDING_APPROVAL','APPROVED']},...(spv?{createdByUser:{supervisorId:user.id,deletedAt:null}}:{})},select:{id:true,code:true,status:true,policySnapshot:true,history:true,createdBy:true,createdAt:true,promisedAt:true,createdByUser:{select:{supervisorId:true,deletedAt:true,supervisor:{select:{id:true,name:true,role:true,deletedAt:true}}}},items:{select:{id:true,quantity:true,cancelledQuantity:true}},pjpStop:{select:{outlet:{select:{name:true}}}}}}),
  spv?[]:prisma.packingList.findMany({select:{id:true,code:true,status:true,createdAt:true,releasedAt:true,sourceOrderId:true,totalCartons:true,items:true,outlet:{select:{name:true}},deliveryStops:{select:stopSelect}}}),
  spv?[]:prisma.deliveryRoute.findMany({where:{closedAt:null,cancelledAt:null},select:{id:true,code:true,createdAt:true,onHold:true,departedAt:true,returnedAt:true,plannedStartAt:true,plannedEndAt:true,preparation:true,stops:{select:{id:true,rejectedCartons:true,returnInspection:true,outlet:{select:{name:true}}}},driverId:true,driver:{select:{name:true}}}}),
  spv?[]:prisma.deliveryIssue.findMany({where:{status:'OPEN'},select:{id:true,title:true,reason:true,ownerId:true,dueAt:true,createdAt:true,orderId:true,packingListId:true,routeId:true}}),
  warehouse?[]:prisma.staffActivity.findMany({where:{AND:[await followUpScope(user),{OR:[{followUp:{path:['status'],equals:'OPEN'}},{followUp:{path:['status'],equals:'SUBMITTED'}}]}]},select:{id:true,userId:true,outletName:true,checkInAt:true,followUp:true,policySnapshot:true}}),
  prisma.user.findMany({where:{deletedAt:null,...(spv?{OR:[{id:user.id},{supervisorId:user.id}]}:{role:{in:warehouse?['ADMIN','KEPALA_GUDANG','SUPIR']:['ADMIN','KEPALA_GUDANG','SUPIR','SALES','SUPERVISOR']}})},select:{id:true,name:true,role:true,supervisorId:true}}),
 ]);
 const orderTasks=spv?await prisma.deliveryIssue.findMany({where:{status:'OPEN',orderId:{in:orders.map(o=>o.id)}},select:{orderId:true,ownerId:true,dueAt:true}}):issues;
 const rows=await exceptionAttentionRows(user),name=id=>people.find(p=>p.id===id)?.name||null;
 const reviewAssignments=await loadOrderReviewAssignments(orders.filter(order=>order.status==='PENDING_APPROVAL'));
 const taskFor=(field,id)=>(spv?orderTasks:issues).filter(i=>i[field]===id).sort((a,b)=>a.dueAt-b.dueAt)[0];
 for(const o of orders){
  if(o.status==='APPROVED'&&['FULFILLED','CLOSED_WITH_CANCELLATION'].includes(fulfillment(o,packings).fulfillmentStatus))continue;
  const task=taskFor('orderId',o.id);
  const required=orderReviewRole(o),supervisor=o.createdByUser?.supervisor,teamOwner=required!=='ADMIN'&&o.status==='PENDING_APPROVAL'&&supervisor?.role==='SUPERVISOR'&&!supervisor.deletedAt?supervisor:null;
  rows.push({key:`order:${o.id}`,category:'ORDER',stage:o.status==='PENDING_APPROVAL'?'ORDER_APPROVAL':'ORDER_FULFILLMENT',title:`${o.code||o.id} · ${o.pjpStop.outlet.name}`,since:o.createdAt,dueAt:o.status==='APPROVED'?o.promisedAt||task?.dueAt:task?.dueAt,ownerId:task?.ownerId||teamOwner?.id,ownerName:name(task?.ownerId)||teamOwner?.name,ownerSource:!task?.ownerId&&teamOwner?'TEAM_SUPERVISOR':null,responsibleRole:o.status==='PENDING_APPROVAL'?(required==='BOTH'?'ADMIN / SPV':required):'ADMIN / KEPALA GUDANG',nextAction:o.status==='PENDING_APPROVAL'?'Periksa dan putuskan order':'Periksa sisa pemenuhan dan rencana kirim',target:o.status==='PENDING_APPROVAL'?'APPROVAL':'DELIVERY',reference:{orderId:o.id}});
 }
 for(const p of packings){
  if(p.status!=='DRAFT'&&packingBalance(p).remainingCartons<=0)continue;
  const task=taskFor('packingListId',p.id);
  rows.push({key:`packing:${p.id}`,category:'PACKING',stage:p.status==='DRAFT'?'PACKING_DRAFT':'PACKING_ALLOCATION',title:`${p.code} · ${p.outlet.name}`,since:p.releasedAt||p.createdAt,ownerId:task?.ownerId,ownerName:name(task?.ownerId),dueAt:task?.dueAt,responsibleRole:p.status==='DRAFT'?'ADMIN':'KEPALA GUDANG',nextAction:p.status==='DRAFT'?'Lengkapi dan lepaskan dokumen':'Alokasikan sisa muatan ke trip',target:'PACKING',reference:{packingListId:p.id}});
 }
 for(const r of routes){
  const task=taskFor('routeId',r.id),inTransit=r.departedAt&&!r.returnedAt;
  rows.push({key:`trip:${r.id}`,category:'TRIP',stage:r.returnedAt?'TRIP_CLOSE':r.departedAt?'TRIP_DELIVERY':'TRIP_START',title:r.code,since:r.returnedAt||r.departedAt||r.createdAt,ownerId:inTransit?r.driverId:task?.ownerId,ownerName:inTransit?r.driver.name:name(task?.ownerId),dueAt:(r.returnedAt?null:r.departedAt?r.plannedEndAt:r.plannedStartAt)||task?.dueAt,responsibleRole:r.returnedAt?'KEPALA GUDANG':r.departedAt?'SUPIR':'KEPALA GUDANG',nextAction:r.onHold?'Tangani alasan trip ditahan':r.returnedAt?'Rekonsiliasi dan tutup trip':r.departedAt?'Pantau perjalanan dan hasil toko':'Selesaikan persiapan lalu berangkatkan',target:'DELIVERY',reference:{routeId:r.id}});
  for(const stop of r.stops||[])if(stop.rejectedCartons>0&&!stop.returnInspection){const task=r.preparation?.returnTasks?.[stop.id],owner=people.find(p=>p.id===task?.ownerId&&['ADMIN','KEPALA_GUDANG'].includes(p.role));rows.push({key:`return:${stop.id}`,category:'RETURN',stage:'RETURN_INSPECTION',needsReview:true,title:`${r.code} · retur ${stop.outlet?.name||''}`,since:task?.assignedAt||r.returnedAt||r.createdAt,dueAt:task?.dueAt,ownerId:owner?.id,ownerName:owner?.name,responsibleRole:'KEPALA GUDANG',nextAction:'Periksa jumlah fisik dan kelayakan barang kembali',target:'DELIVERY',reference:{routeId:r.id,stopId:stop.id}});}
  for(const [stage,task] of Object.entries(r.preparation?.tasks||{}))if(!r.preparation?.[stage])rows.push({key:`prep:${r.id}:${stage}`,category:'PREPARATION',title:`${r.code} · ${stage}`,since:task.assignedAt||r.createdAt,dueAt:task.dueAt,ownerId:task.ownerId,ownerName:task.ownerName,responsibleRole:'KEPALA GUDANG',nextAction:task.note||`Selesaikan ${stage}`,target:'DELIVERY',reference:{routeId:r.id}});
 }
 for(const i of issues)rows.push({key:`issue:${i.id}`,category:'ISSUE',title:i.title,since:i.createdAt,dueAt:i.dueAt,ownerId:i.ownerId,ownerName:name(i.ownerId),responsibleRole:'PIC TINDAK LANJUT',nextAction:i.reason,target:'DELIVERY',issue:i});
 for(const a of activities){const f=a.followUp,review=f.status==='SUBMITTED',pic=people.find(p=>p.id===f.ownerId),reviewer=review?people.find(p=>p.id===pic?.supervisorId&&p.role==='SUPERVISOR'&&p.id!==f.ownerId):null;
  rows.push({key:`visit:${a.id}`,category:'VISIT',stage:review?'FOLLOW_UP_REVIEW':'FOLLOW_UP',title:a.outletName||'Tindak lanjut kunjungan',since:review?f.submission?.at:f.createdAt||a.checkInAt,dueDate:f.dueDate,ownerId:review?reviewer?.id:f.ownerId,ownerName:review?reviewer?.name:f.ownerName||name(f.ownerId),ownerSource:reviewer?'TEAM_SUPERVISOR':null,responsibleRole:review?'SPV / ADMIN':'SALES / SPV',nextAction:review?'Periksa hasil dan bukti, lalu terima atau minta perbaikan':f.note,target:'FOLLOW_UP',activityId:a.id,status:f.status,followUp:f,policySnapshot:a.policySnapshot});}
 const outletReviews=warehouse||user.permissions?.can_validate_outlet===false?[]:await prisma.outletReview.findMany({where:{status:{in:['OPEN','WAITING_FIELD']},outlet:await reviewScope(user,prisma)},include:{outlet:{include:{cluster:true}},fieldTasks:{where:{status:{in:['OPEN','SUBMITTED']}},take:1}}});
 for(const review of outletReviews){
  const task=review.fieldTasks?.[0],submitted=task?.status==='SUBMITTED',owner=task?people.find(p=>p.id===(submitted?task.reviewerId:task.ownerId)):(await outletReviewOwners(prisma,review.outlet)).find(p=>p.id===review.ownerId);
  rows.push({key:`outlet-review:${review.id}`,category:'OUTLET_REVIEW',stage:'OUTLET_REVIEW',status:submitted?'SUBMITTED':review.status,needsReview:!task||submitted,title:`${review.outlet.name} · pemeriksaan opsional`,since:task?.updatedAt||review.createdAt,dueAt:task?.dueAt||review.dueAt,...(submitted&&Number(task.policySnapshot?.values?.OUTLET_FIELD_REVIEW_SLA_HOURS??24)>0?{reviewDueAt:addSlaHours(task.updatedAt,task.policySnapshot?.values?.OUTLET_FIELD_REVIEW_SLA_HOURS??24,task.policySnapshot?.values||{}).toISOString()}:{}),ownerId:owner?.id||null,ownerName:owner?.name||null,responsibleRole:task&&!submitted?'SALES':'ADMIN / SPV',nextAction:submitted?'Periksa bukti Sales dan usulan koreksi':task?'Tunggu hasil pemeriksaan Sales':review.workflow?.technical==='ERROR'?'Periksa konfigurasi/kuota dan ulangi Google':'Bandingkan bukti dan putuskan kasus',target:'OUTLET_REVIEW',reference:{outletReviewId:review.id}});
 }
 return {rows:rows.map(row=>{
   const order=orders.find(order=>order.id===row.reference?.orderId),required=orderReviewRole(order);
   const saved=row.stage==='ORDER_APPROVAL'?reviewAssignments.get(row.reference?.orderId):null;
   const assignment=saved&&(!['ADMIN','SUPERVISOR'].includes(required)||saved.ownerRole===required)?saved:null;
   const supervisor=assignment?orders.find(order=>order.id===row.reference?.orderId)?.createdByUser?.supervisor:null;
   const fallback=required!=='ADMIN'&&supervisor?.role==='SUPERVISOR'&&!supervisor.deletedAt?supervisor:null;
   const assigned=assignment?{approvalAssignment:assignment,ownerId:assignment.ownerId?(assignment.ownerValid?assignment.ownerId:null):fallback?.id,ownerName:assignment.ownerId?(assignment.ownerValid?assignment.ownerCurrentName||assignment.ownerName:null):fallback?.name,ownerSource:assignment.ownerId?'MANUAL_REVIEWER':fallback?'TEAM_SUPERVISOR':null,dueAt:assignment.dueAt||null}:{};
   return applyAttentionSla({...row,...assigned,needsReview:row.needsReview||row.stage==='ORDER_APPROVAL'||row.status==='SUBMITTED'},policy);
 }),people:people.filter(p=>['ADMIN','KEPALA_GUDANG','SUPIR'].includes(p.role))};
}
export async function getAttention(user,query={}){
 const policy=await loadAttentionPolicy(),{rows,people}=await collectAttentionRows(user,policy);
 return {...paginateAttention(rows,{...query,actorId:user.id}),generatedAt:new Date().toISOString(),people,policyNote:'SLA memakai jam kalender/jam kerja WIB sesuai pengaturan dan kebijakan saat ini untuk pekerjaan tanpa tenggat eksplisit. Nol berarti belum aktif. PIC dari tim SPV adalah penanggung jawab berdasarkan keanggotaan saat ini; penugasan pemeriksa order oleh Admin didahulukan.'};
}
