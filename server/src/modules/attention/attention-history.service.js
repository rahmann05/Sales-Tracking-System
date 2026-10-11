import {issueScope} from '../delivery/services/operational-issues.service.js';
import {prisma} from '../../config/prisma.js';
import {followUpScope} from '../staff-attendance/follow-up.service.js';
import {presentAttention} from '../../../../shared/operational-attention.mjs';
import {paginateAttention} from '../../../../shared/attention-queue.mjs';

// History comes from persisted outcomes, not the open-work queue.
export async function attentionHistory(user,query){
 const since=new Date(Date.now()-30*86400000),spv=user.role==='SUPERVISOR',warehouse=user.role==='KEPALA_GUDANG';
 const [orders,packings,routes,issues,activities]=await Promise.all([
  warehouse?[]:prisma.order.findMany({where:{deletedAt:null,approvedAt:{gte:since},...(spv?{createdByUser:{supervisorId:user.id,deletedAt:null}}:{})},select:{id:true,code:true,status:true,approvedAt:true,rejectionReason:true,customerSnapshot:true}}),
  spv?[]:prisma.packingList.findMany({where:{releasedAt:{gte:since}},select:{id:true,code:true,releasedAt:true,outlet:{select:{name:true}}}}),
  spv?[]:prisma.deliveryRoute.findMany({where:{OR:[{closedAt:{gte:since}},{cancelledAt:{gte:since}}]},select:{id:true,code:true,closedAt:true,cancelledAt:true}}),
  !spv&&user.permissions?.can_monitor_delivery===false?[]:prisma.deliveryIssue.findMany({where:{AND:[{status:'DONE',resolvedAt:{gte:since}},await issueScope(prisma,user)]}}),
  warehouse?[]:prisma.staffActivity.findMany({where:{AND:[await followUpScope(user),{followUp:{path:['status'],equals:'DONE'}}]},select:{id:true,outletName:true,followUp:true}})
 ]);
 const rows=[
  ...orders.map(o=>({key:`history:order:${o.id}`,category:'ORDER',title:o.code,actionTitle:o.status==='REJECTED'?'Order ditolak':'Order disetujui',nextAction:o.rejectionReason||'Keputusan order telah tersimpan.',since:o.approvedAt,target:'APPROVAL',reference:{orderId:o.id}})),
  ...packings.map(p=>({key:`history:packing:${p.id}`,category:'PACKING',title:`${p.code} · ${p.outlet?.name||''}`,actionTitle:'Dokumen diserahkan ke gudang',nextAction:'Lihat dokumen dan perkembangan pengirimannya.',since:p.releasedAt,target:'PACKING',reference:{packingListId:p.id}})),
  ...routes.map(r=>({key:`history:trip:${r.id}`,category:'TRIP',title:r.code,actionTitle:r.closedAt?'Perjalanan ditutup':'Perjalanan dibatalkan',nextAction:'Lihat hasil dan riwayat perjalanan.',since:r.closedAt||r.cancelledAt,target:'ROUTE',reference:{routeId:r.id}})),
  ...issues.map(i=>({key:`history:issue:${i.id}`,category:'ISSUE',title:i.title,actionTitle:'Masalah selesai',nextAction:i.resolution,since:i.resolvedAt,target:'ISSUE',reference:{routeId:i.routeId,packingListId:i.packingListId,orderId:i.orderId},issue:i})),
  ...activities.map(a=>({key:`history:visit:${a.id}`,category:'VISIT',title:a.outletName||'Arahan selesai',actionTitle:'Arahan selesai',nextAction:a.followUp.completionNote||a.followUp.submission?.note||a.followUp.note,since:a.followUp.review?.at||a.followUp.completedAt||a.followUp.history?.at(-1)?.at,target:'FOLLOW_UP',activityId:a.id,followUp:a.followUp})).filter(r=>new Date(r.since)>=since)
 ].map(r=>presentAttention({...r,completed:true,actionableForUser:false},user));
 rows.sort((a,b)=>new Date(b.since)-new Date(a.since)||a.key.localeCompare(b.key));
 const result=paginateAttention(rows,{...query,filter:'HISTORY'},Date.now());
 // Keep newest outcomes first; the open queue's age ordering is not a history order.
 const search=(query.search||'').toLocaleLowerCase('id-ID');
 const matching=rows.filter(r=>(query.category==='ALL'||!query.category||r.category===query.category)&&(!search||`${r.title} ${r.actionTitle} ${r.nextAction}`.toLocaleLowerCase('id-ID').includes(search)));
 return {...result,total:matching.length,rows:matching.slice((query.page-1)*query.limit,query.page*query.limit),generatedAt:new Date().toISOString(),people:[],historyDays:30};
}
