/** reportClosedOutlet - single-responsibility service (extracted from route-change.service.js). */
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { createNotification, createBulkNotificationByRoles } from '../../notifications/notifications.service.js';
import { ROLES, ROUTE_CHANGE_TYPE, ROUTE_CHANGE_STATUS, VISIT_STATUS, NOTIFICATION_TYPES } from '../../../utils/constants.js';

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

  // Check if there's already an open/pending request for this stop
  const existingRequest = await prisma.routeChangeRequest.findFirst({
    where: { pjpStopId, status: ROUTE_CHANGE_STATUS.PENDING_APPROVAL },
  });
  if (existingRequest) {
    throw new AppError('Sudah ada laporan outlet tutup yang sedang menunggu tindakan Supervisor', 409);
  }

  // Update stop status to CLOSED_REPORTED
  await prisma.pjpStop.update({
    where: { id: pjpStopId },
    data: { status: VISIT_STATUS.CLOSED_REPORTED },
  });

  // Create request — type is SKIP as placeholder until Supervisor decides
  const request = await prisma.routeChangeRequest.create({
    data: {
      pjpId: stop.pjpId,
      pjpStopId,
      type: ROUTE_CHANGE_TYPE.SKIP,
      reportedBy: salesId,
      reason,
      photoUrl,
      status: ROUTE_CHANGE_STATUS.PENDING_APPROVAL,
    },
    include: { pjpStop: { include: { outlet: true } } },
  });

  await createBulkNotificationByRoles(
    [ROLES.SUPERVISOR],
    NOTIFICATION_TYPES.ROUTE_CHANGE_REPORTED,
    'Laporan Outlet Tutup',
    `Sales melaporkan outlet "${stop.outlet.name}" tutup. Pilih tindakan: Reroute atau Skip.`,
    { routeChangeRequestId: request.id }
  );

  return request;
};
