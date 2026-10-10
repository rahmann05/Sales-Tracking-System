import {assertEvidenceImages} from '../../../utils/evidence-images.js';
import {wibDateKey} from '../../../../../shared/visit-metrics.mjs';
/** reportClosedOutlet - single-responsibility service (extracted from route-change.service.js). */
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { createBulkNotificationByRoles } from "../../notifications/notifications.service.js";
import { ROLES, ROUTE_CHANGE_STATUS, NOTIFICATION_TYPES } from "../../../utils/constants.js";
import {newRouteWorkflow,routeWorkflowKey} from './route-workflow.service.js';
import {getDynamicConfig} from '../../config/config.service.js';
import {routeChangeReviewGaps} from '../../../../../shared/route-change-workflow.mjs';
import {reviewPeople} from '../../config/services/approval-readiness.service.js';

/**
 * Step 1 - Sales reports a closed outlet.
 * Type is NOT set yet (Sales doesn't decide REROUTE vs SKIP).
 * Status = PENDING_APPROVAL (waiting for Supervisor action).
 * The RouteChangeType field defaults to SKIP as DB requires a value,
 * but will be overwritten when Supervisor acts.
 */
export const reportClosedOutlet = async (salesId, pjpStopId, reason = null, photoUrl = null) => {
  if(await getDynamicConfig('CLOSED_OUTLET_REQUIRE_PHOTO',false)&&!photoUrl?.trim())throw new AppError('Foto toko tutup wajib dilampirkan sesuai aturan pengajuan.',422);
  if(await getDynamicConfig('CLOSED_OUTLET_REQUIRE_REASON',false)&&(!reason||reason.trim().length<5))throw new AppError('Alasan toko tutup minimal lima karakter.',422);
  const stop = await prisma.pjpStop.findUnique({
    where: { id: pjpStopId },
    include: { pjp: true, outlet: true },
  });

  if (!stop) throw new AppError('Stop PJP tidak ditemukan', 404);
  if (stop.pjp.userId !== salesId) {
    throw new AppError('Anda hanya dapat melaporkan outlet tutup pada PJP Anda sendiri', 403);
  }

  if(wibDateKey(stop.pjp.date)!==wibDateKey())throw new AppError('Laporan hanya untuk PJP hari ini',400);
  await assertEvidenceImages({photoUrl},{entity:stop});
  if(stop.status!=='PENDING')throw new AppError('Toko sudah diproses',409);
  if(await prisma.attendance.findFirst({where:{pjpStopId,type:'OUT'}}))throw new AppError('Kunjungan sudah selesai',409);
  // Check if there's already an open/pending request for this stop
  const existingRequest = await prisma.routeChangeRequest.findFirst({
    where: { pjpStopId, status: ROUTE_CHANGE_STATUS.PENDING_APPROVAL },
  });
  if (existingRequest) {
    throw new AppError('Sudah ada laporan outlet tutup yang sedang menunggu tindakan Supervisor', 409);
  }

  const request = await prisma.$transaction(async tx=>{
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('approval:actors'))`;
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('planning:territories'))`;
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`closed:${pjpStopId}`}))`;
    if(await tx.routeChangeRequest.findFirst({where:{pjpStopId,status:'PENDING_APPROVAL'}}))throw new AppError('Pengajuan sudah ada',409);
    const current=await tx.pjpStop.findUnique({where:{id:pjpStopId},include:{attendances:true}});
    if(current.status!=='PENDING'||current.attendances.some(a=>a.type==='OUT')||['FINISHED','INCOMPLETE'].includes(current.visitSession?.state))throw new AppError('Kunjungan sudah berubah; muat ulang sebelum melapor.',409);
    await tx.pjpStop.update({where:{id:pjpStopId},data:{status:'CLOSED_REPORTED'}});
    const request = await tx.routeChangeRequest.create({data:{pjpId:stop.pjpId,pjpStopId,type:'SKIP',reportedBy:salesId,reason,photoUrl,status:'PENDING_APPROVAL'},include:{pjpStop:{include:{outlet:true}}}});
    const workflow=await newRouteWorkflow();
    const gaps=routeChangeReviewGaps({...request,workflow},await reviewPeople(tx));
    if(gaps.length)throw new AppError(`Laporan belum dapat diajukan: pemeriksa ${gaps.join(', ')} aktif belum tersedia. Minta Admin memperbaiki penugasan tim.`,409);
    await tx.systemConfig.create({data:{key:routeWorkflowKey(request.id),value:workflow}});

  await createBulkNotificationByRoles(
    workflow.mode==='ADMIN'?[ROLES.ADMIN]:[ROLES.SUPERVISOR],
    NOTIFICATION_TYPES.ROUTE_CHANGE_REPORTED,
    'Laporan Outlet Tutup',
    `Sales melaporkan outlet "${stop.outlet.name}" tutup. Pilih tindakan: Reroute atau Skip.`,
    { routeChangeRequestId: request.id }, tx
  );

  return {...request,workflow};
  });
  return request;
};
