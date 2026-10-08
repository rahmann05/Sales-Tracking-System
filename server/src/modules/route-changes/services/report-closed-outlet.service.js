import {wibDateKey} from '../../../../../shared/visit-metrics.mjs';
/** reportClosedOutlet - single-responsibility service (extracted from route-change.service.js). */
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { createBulkNotificationByRoles } from "../../notifications/notifications.service.js";
import { ROLES, ROUTE_CHANGE_STATUS, NOTIFICATION_TYPES } from "../../../utils/constants.js";

/**
 * Step 1 - Sales reports a closed outlet.
 * Type is NOT set yet (Sales doesn't decide REROUTE vs SKIP).
 * Status = PENDING_APPROVAL (waiting for Supervisor action).
 * The RouteChangeType field defaults to SKIP as DB requires a value,
 * but will be overwritten when Supervisor acts.
 */
export const reportClosedOutlet = async (salesId, pjpStopId, reason = null, photoUrl = null) => {
  const stop = await prisma.pjpStop.findUnique({
    where: { id: pjpStopId },
    include: { pjp: true, outlet: true },
  });

  if (!stop) throw new AppError('Stop PJP tidak ditemukan', 404);
  if (stop.pjp.userId !== salesId) {
    throw new AppError('Anda hanya dapat melaporkan outlet tutup pada PJP Anda sendiri', 403);
  }

  if(wibDateKey(stop.pjp.date)!==wibDateKey())throw new AppError('Laporan hanya untuk PJP hari ini',400);
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
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`closed:${pjpStopId}`}))`;
    if(await tx.routeChangeRequest.findFirst({where:{pjpStopId,status:'PENDING_APPROVAL'}}))throw new AppError('Pengajuan sudah ada',409);
    await tx.pjpStop.update({where:{id:pjpStopId},data:{status:'CLOSED_REPORTED'}});
    const request = await tx.routeChangeRequest.create({data:{pjpId:stop.pjpId,pjpStopId,type:'SKIP',reportedBy:salesId,reason,photoUrl,status:'PENDING_APPROVAL'},include:{pjpStop:{include:{outlet:true}}}});

  await createBulkNotificationByRoles(
    [ROLES.SUPERVISOR],
    NOTIFICATION_TYPES.ROUTE_CHANGE_REPORTED,
    'Laporan Outlet Tutup',
    `Sales melaporkan outlet "${stop.outlet.name}" tutup. Pilih tindakan: Reroute atau Skip.`,
    { routeChangeRequestId: request.id }, tx
  );

  return request;
  });
  return request;
};
