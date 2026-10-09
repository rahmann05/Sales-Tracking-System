import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { assertSalesAccess, assertOutletAccess } from '../../../utils/team-scope.js';
import { getDynamicConfig } from '../../config/config.service.js';
import { createNotification } from '../../notifications/notifications.service.js';
export async function reconcilePjp(tx,id) {
  const stops=await tx.pjpStop.findMany({where:{pjpId:id},include:{attendances:true,routeChanges:true}});
  const done=stops.every(s=>['FINISHED','INCOMPLETE'].includes(s.visitSession?.state)||s.status==='SKIPPED'||s.attendances.some(a=>a.type==='OUT')||(s.status==='CLOSED_REPORTED'&&s.routeChanges.some(r=>['APPROVED','ACKNOWLEDGED'].includes(r.status))));
  await tx.pjp.update({where:{id},data:{status:done?'COMPLETED':'IN_PROGRESS'}});
}
export async function decideRoute(actorId,requestId,action,replacementOutletId) {
  const actor=await prisma.user.findUnique({where:{id:actorId}});
  if(!actor||!['ADMIN','SUPERVISOR'].includes(actor.role))throw new AppError('Tidak berwenang memutuskan rute',403);
  const requireAdmin=await getDynamicConfig('REROUTE_REQUIRE_ADMIN_APPROVAL',false);
  const result=await prisma.$transaction(async tx=>{
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`route-change:${requestId}`}))`;
    const r=await tx.routeChangeRequest.findUnique({where:{id:requestId},include:{pjp:{include:{stops:true}}}});
    if(!r)throw new AppError('Pengajuan tidak ditemukan',404);
    await assertSalesAccess(actor,r.reportedBy,tx);
    if(r.status!=='PENDING_APPROVAL')throw new AppError('Pengajuan sudah diputuskan',409);
    const pendingAdmin=r.type==='REROUTE'&&Boolean(r.handledBy)&&Boolean(r.replacementOutletId);
    if(pendingAdmin&&actor.role!=='ADMIN')throw new AppError('Menunggu keputusan admin',403);
    if(action==='APPROVE'&&!pendingAdmin)throw new AppError('Belum ada usulan reroute supervisor',409);
    const result = await (async () => {
    if(action==='REJECT') {
      const record=await tx.routeChangeRequest.update({where:{id:requestId},data:{status:'REJECTED',approvedBy:actorId}});
      await tx.pjpStop.update({where:{id:r.pjpStopId},data:{status:'PENDING'}});
      await reconcilePjp(tx,r.pjpId);return {routeChangeRequest:record};
    }
    const target=action==='APPROVE'?r.replacementOutletId:replacementOutletId;
    if(action!=='SKIP') {
      if(!target)throw new AppError('Pilih toko pengganti',400);
      await assertOutletAccess(actor,target,tx);
      if(!await tx.outlet.findFirst({where:{id:target,deletedAt:null},select:{id:true}}))throw new AppError('Outlet pengganti tidak aktif',404);
      if(r.pjp.stops.some(s=>s.outletId===target))throw new AppError('Toko pengganti sudah ada pada PJP',409);
    }
    if(action==='REROUTE'&&requireAdmin&&actor.role!=='ADMIN')return {routeChangeRequest:await tx.routeChangeRequest.update({where:{id:requestId},data:{type:'REROUTE',handledBy:actorId,replacementOutletId:target}})};
    await tx.pjpStop.update({where:{id:r.pjpStopId},data:{status:'SKIPPED'}});
    const record=await tx.routeChangeRequest.update({where:{id:requestId},data:{type:action==='SKIP'?'SKIP':'REROUTE',handledBy:r.handledBy||actorId,approvedBy:actorId,status:action==='SKIP'?'ACKNOWLEDGED':'APPROVED',replacementOutletId:action==='SKIP'?null:target}});
    let createdPjpStop;
    if(action!=='SKIP')createdPjpStop=await tx.pjpStop.create({data:{pjpId:r.pjpId,outletId:target,sequence:Math.max(0,...r.pjp.stops.map(s=>s.sequence))+1,status:'PENDING'},include:{outlet:true}});
    await reconcilePjp(tx,r.pjpId);return {routeChangeRequest:record,createdPjpStop};
    })();
  await createNotification(result.routeChangeRequest.reportedBy,'ROUTE_CHANGE_DECIDED','Keputusan perubahan rute',result.createdPjpStop?`Toko pengganti ${result.createdPjpStop.outlet.name} ditambahkan ke PJP.`:`Status pengajuan: ${result.routeChangeRequest.status}`,{pjpId:result.routeChangeRequest.pjpId},tx);
  return result;
  });
  return result;
}
