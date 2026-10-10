import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import {assertRouteDecisionScope,routeReplacementScope} from './route-review-scope.service.js';
import {assertSalesAccess} from '../../../utils/team-scope.js';
import { getDynamicConfig } from '../../config/config.service.js';
import { createNotification } from '../../notifications/notifications.service.js';
import {attachRouteWorkflows,routeWorkflowKey} from './route-workflow.service.js';
import {routeChangeWorkflow} from '../../../../../shared/route-change-workflow.mjs';
import {reviewPeople} from '../../config/services/approval-readiness.service.js';
export async function reconcilePjp(tx,id) {
  const stops=await tx.pjpStop.findMany({where:{pjpId:id},include:{attendances:true,routeChanges:true}});
  const done=stops.every(s=>['FINISHED','INCOMPLETE'].includes(s.visitSession?.state)||s.status==='SKIPPED'||s.attendances.some(a=>a.type==='OUT')||(s.status==='CLOSED_REPORTED'&&s.routeChanges.some(r=>['APPROVED','ACKNOWLEDGED'].includes(r.status))));
  await tx.pjp.update({where:{id},data:{status:done?'COMPLETED':'IN_PROGRESS'}});
}
export async function decideRoute(actorId,requestId,action,replacementOutletId,reason=null) {
  if(reason!==null&&(typeof reason!=='string'||reason.trim().length<5||reason.length>2000))throw new AppError('Catatan keputusan minimal lima karakter dan maksimal 2.000 karakter.',422);
  const requireAdmin=await getDynamicConfig('REROUTE_REQUIRE_ADMIN_APPROVAL',false);
  const result=await prisma.$transaction(async tx=>{
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('approval:actors'))`;
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('planning:territories'))`;
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`route-change:${requestId}`}))`;
    const actor=(await reviewPeople(tx)).find(p=>p.id===actorId&&!p.deletedAt);
    if(!actor||!['ADMIN','SUPERVISOR'].includes(actor.role))throw new AppError('Tidak berwenang memutuskan rute',403);
    const found=await tx.routeChangeRequest.findUnique({where:{id:requestId},include:{pjp:{include:{stops:true}}}});
    if(!found)throw new AppError('Pengajuan tidak ditemukan',404);
    const [r]=await attachRouteWorkflows(tx,[found]),flow=routeChangeWorkflow(r,{REROUTE_REQUIRE_ADMIN_APPROVAL:requireAdmin});
    if(r.status!=='PENDING_APPROVAL'){await assertSalesAccess(actor,r.reportedBy,tx);throw new AppError('Pengajuan sudah diputuskan',409);}
    await assertRouteDecisionScope(tx,r,actor);
    const pendingAdmin=Boolean(flow.proposal);
    if(!flow.canDecide(actor))throw new AppError(`Pengajuan menunggu keputusan ${flow.stage==='ADMIN'?'Admin berbeda dari pengusul':'Supervisor'} sesuai aturan saat dilaporkan.`,403);
    if(action==='APPROVE'&&!pendingAdmin)throw new AppError('Belum ada usulan Supervisor untuk disetujui.',409);
    if(pendingAdmin&&!['APPROVE','REJECT'].includes(action))throw new AppError('Putuskan usulan tersimpan; tidak dapat mengganti tindakan pada tahap persetujuan.',409);
    const decidedAction=action==='APPROVE'?flow.proposal.action:action;
    const result = await (async () => {
    if(action==='REJECT') {
      const record=await tx.routeChangeRequest.update({where:{id:requestId},data:{status:'REJECTED',approvedBy:actorId}});
      await tx.pjpStop.update({where:{id:r.pjpStopId},data:{status:'PENDING'}});
      await reconcilePjp(tx,r.pjpId);return {routeChangeRequest:record};
    }
    const target=action==='APPROVE'?flow.proposal.target:replacementOutletId;
    if(decidedAction!=='SKIP') {
      if(!target)throw new AppError('Pilih toko pengganti',400);
      const cluster=await routeReplacementScope(tx,r,actor);
      if(!await tx.outlet.findFirst({where:{id:target,deletedAt:null,cluster},select:{id:true}}))throw new AppError('Outlet pengganti tidak aktif atau di luar wilayah Sales pada pengajuan ini.',403);
      if(r.pjp.stops.some(s=>s.outletId===target))throw new AppError('Toko pengganti sudah ada pada PJP',409);
    }
    if(!pendingAdmin&&(flow.mode==='SEQUENTIAL'||flow.mode==='LEGACY_SEQUENTIAL'&&action==='REROUTE'&&actor.role!=='ADMIN')){
      const workflow={...(r.workflow||{mode:flow.mode}),proposal:{action:decidedAction,actorId,target:target||null,reason,at:new Date().toISOString()}};
      await tx.systemConfig.upsert({where:{key:routeWorkflowKey(r.id)},create:{key:routeWorkflowKey(r.id),value:workflow},update:{value:workflow}});
      const record=await tx.routeChangeRequest.update({where:{id:requestId},data:{type:decidedAction,handledBy:actorId,replacementOutletId:target||null}});
      return {routeChangeRequest:{...record,workflow}};
    }
    await tx.pjpStop.update({where:{id:r.pjpStopId},data:{status:'SKIPPED'}});
    const record=await tx.routeChangeRequest.update({where:{id:requestId},data:{type:decidedAction==='SKIP'?'SKIP':'REROUTE',handledBy:r.handledBy||actorId,approvedBy:actorId,status:decidedAction==='SKIP'?'ACKNOWLEDGED':'APPROVED',replacementOutletId:decidedAction==='SKIP'?null:target}});
    let createdPjpStop;
    if(decidedAction!=='SKIP')createdPjpStop=await tx.pjpStop.create({data:{pjpId:r.pjpId,outletId:target,sequence:Math.max(0,...r.pjp.stops.map(s=>s.sequence))+1,status:'PENDING'},include:{outlet:true}});
    await reconcilePjp(tx,r.pjpId);return {routeChangeRequest:record,createdPjpStop};
    })();
  await tx.auditEvent.create({data:{entityType:'ROUTE_CHANGE',entityId:requestId,action,actorId,actorName:actor.name,before:{status:r.status,workflow:r.workflow||null},after:{status:result.routeChangeRequest.status,type:result.routeChangeRequest.type,replacementOutletId:result.routeChangeRequest.replacementOutletId,workflow:result.routeChangeRequest.workflow||r.workflow||null,reason}}});
  await createNotification(result.routeChangeRequest.reportedBy,'ROUTE_CHANGE_DECIDED','Keputusan perubahan rute',result.createdPjpStop?`Toko pengganti ${result.createdPjpStop.outlet.name} ditambahkan ke PJP.`:`Status pengajuan: ${result.routeChangeRequest.status}`,{pjpId:result.routeChangeRequest.pjpId},tx);
  return result;
  });
  return result;
}
