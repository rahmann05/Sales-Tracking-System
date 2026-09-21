/** rejectReroute - single-responsibility service (extracted from route-change.service.js). */
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { createNotification, createBulkNotificationByRoles } from '../../notifications/notifications.service.js';
import { ROLES, ROUTE_CHANGE_TYPE, ROUTE_CHANGE_STATUS, VISIT_STATUS, NOTIFICATION_TYPES } from '../../../utils/constants.js';

/**
 * Step 3 alt - Manager rejects REROUTE.
 */
export const rejectReroute = async (managerId, requestId) => {
  const request = await prisma.routeChangeRequest.findUnique({
    where: { id: requestId },
    include: { pjpStop: { include: { outlet: true } } },
  });

  if (!request) throw new AppError('Request perubahan rute tidak ditemukan', 404);
  if (request.status !== ROUTE_CHANGE_STATUS.PENDING_APPROVAL) {
    throw new AppError(`Request sudah diproses sebelumnya (Status: ${request.status})`, 409);
  }

  const updatedRequest = await prisma.routeChangeRequest.update({
    where: { id: requestId },
    data: { status: ROUTE_CHANGE_STATUS.REJECTED, approvedBy: managerId },
  });

  await createNotification(
    request.reportedBy,
    NOTIFICATION_TYPES.REROUTE_REJECTED,
    'Perubahan Rute Ditolak',
    `Permintaan reroute untuk outlet "${request.pjpStop.outlet.name}" ditolak oleh Supervisor.`,
    { pjpId: request.pjpId }
  );

  return updatedRequest;
};
