import { prisma } from '../../config/prisma.js';
import {operationalExceptionRows} from './operational-exceptions.service.js';
import {attachRouteWorkflows} from '../route-changes/services/route-workflow.service.js';
import {routeChangeWorkflow} from '../../../../shared/route-change-workflow.mjs';
import {routeReviewScope} from '../route-changes/services/route-review-scope.service.js';

// Match the live authorization scope of the decision endpoints, rather than historical report scope.
export async function exceptionAttentionRows(actor){
  if(!['ADMIN','SUPERVISOR'].includes(actor.role))return [];
  const spv=actor.role==='SUPERVISOR',team=spv?{supervisorId:actor.id,deletedAt:null}:{};
  const person={id:true,name:true,supervisorId:true,supervisor:{select:{id:true,name:true,role:true,deletedAt:true}}};
  const changeScope=await routeReviewScope(prisma,actor,{activeOnly:true});
  const [off,manual,manualOff,unlocks,changes]=await Promise.all([
    prisma.offPjpAttendance.findMany({where:{status:'PENDING',...(spv?{user:team}:{})},select:{id:true,userId:true,outletName:true,createdAt:true,reason:true,latitude:true,longitude:true,photoUrl:true,user:{select:person}}}),
    prisma.attendance.findMany({where:{manualSalesMode:'REQUIRE_APPROVAL',manualSalesStatus:'PENDING',type:'OUT',pjpStop:{orders:{none:{deletedAt:null}}},...(spv?{user:team}:{})},select:{id:true,userId:true,createdAt:true,orderAmount:true,skuSold:true,notes:true,user:{select:person},pjpStop:{select:{outlet:{select:{name:true}}}}}}),
    prisma.offPjpAttendance.findMany({where:{status:'APPROVED',manualSalesMode:'REQUIRE_APPROVAL',manualSalesStatus:'PENDING',...(spv?{user:team}:{})},select:{id:true,userId:true,outletName:true,createdAt:true,validatedAt:true,orderAmount:true,skuSold:true,user:{select:person}}}),
    prisma.outletUnlockRequest.findMany({where:{status:'PENDING_APPROVAL',...(spv?{requestedByUser:team}:{})},select:{id:true,requestedBy:true,createdAt:true,reason:true,outlet:{select:{name:true}},requestedByUser:{select:person}}}),
    prisma.routeChangeRequest.findMany({where:{status:'PENDING_APPROVAL',...changeScope},select:{id:true,reportedBy:true,type:true,handledBy:true,replacementOutletId:true,reason:true,createdAt:true,updatedAt:true,photoUrl:true,reportedByUser:{select:person},pjpStop:{select:{outlet:{select:{name:true}}}},replacementOutlet:{select:{name:true}}}}),
  ]);
  const rows=[];
  const add=(record,kind,person,outletName,since,detail={},adminStage=false)=>{
    const supervisor=person?.supervisor;
    const owner=!adminStage&&supervisor?.role==='SUPERVISOR'&&!supervisor.deletedAt&&supervisor.id!==person.id?supervisor:null;
    rows.push({key:`exception:${kind}:${record.id}`,category:'EXCEPTION',stage:'EXCEPTION',status:'PENDING',needsReview:true,title:`${outletName||'Outlet'} · ${person?.name||'Pemohon'}`,since,
      ownerId:owner?.id,ownerName:owner?.name,ownerSource:owner?'TEAM_SUPERVISOR':null,responsibleRole:adminStage?'ADMIN':'SPV / ADMIN',
      nextAction:kind==='OFF_PJP'?'Periksa bukti kunjungan luar PJP':kind.startsWith('MANUAL')?'Periksa hasil manual tanpa order terperinci':kind==='UNLOCK'?'Putuskan pengecualian absensi':adminStage?'Putuskan usulan reroute dari SPV':'Putuskan toko tutup: skip atau usulkan toko pengganti',
      target:'EXCEPTION',exception:{id:record.id,kind,applicantId:person?.id,applicantName:person?.name,outletName,reason:record.reason||record.notes||null,photoUrl:record.photoUrl||null,...detail},
      canDecide:person?.id!==actor.id&&(!adminStage||actor.role==='ADMIN')&&(kind!=='UNLOCK'||actor.permissions?.can_unlock_absensi!==false)});
  };
  for(const r of off)add(r,'OFF_PJP',r.user,r.outletName,r.createdAt,{latitude:r.latitude,longitude:r.longitude});
  for(const r of manual)add(r,'MANUAL_PJP',r.user,r.pjpStop.outlet.name,r.createdAt,{orderAmount:r.orderAmount,skuSold:r.skuSold});
  for(const r of manualOff)add(r,'MANUAL_OFF_PJP',r.user,r.outletName,r.validatedAt||r.createdAt,{orderAmount:r.orderAmount,skuSold:r.skuSold});
  for(const r of unlocks)add(r,'UNLOCK',r.requestedByUser,r.outlet.name,r.createdAt);
  for(const r of await attachRouteWorkflows(prisma,changes)){const flow=routeChangeWorkflow(r),pendingAdmin=Boolean(flow.proposal);add(r,'ROUTE_CHANGE',r.reportedByUser,r.pjpStop.outlet.name,pendingAdmin?r.updatedAt:r.createdAt,{pendingAdmin,decisionStage:flow.stage,proposedAction:flow.proposal?.action,decisionMode:flow.mode,reviewAssignment:flow.assignment,replacementOutletId:r.replacementOutletId,replacementOutletName:r.replacementOutlet?.name},flow.stage==='ADMIN');const row=rows[rows.length-1];row.canDecide=flow.canDecide(actor);if(flow.assignment){row.ownerId=flow.assignment.ownerId;row.ownerName=flow.assignment.ownerName;row.ownerSource='EXPLICIT_ASSIGNMENT';row.dueAt=flow.assignment.dueAt;}row.nextAction=pendingAdmin?'Putuskan usulan skip/reroute Supervisor':`Putuskan toko tutup melalui ${flow.stage==='ADMIN'?'Admin':'Supervisor'}`;}
  return [...rows,...await operationalExceptionRows(actor)];
}
