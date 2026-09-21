/** submitSkip - single-responsibility service (extracted from route-change.service.js). */
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { createNotification, createBulkNotificationByRoles } from '../../notifications/notifications.service.js';
import { ROLES, ROUTE_CHANGE_TYPE, ROUTE_CHANGE_STATUS, VISIT_STATUS, NOTIFICATION_TYPES } from '../../../utils/constants.js';

/**
 * Step 2b - Supervisor chooses SKIP.
 */
export const submitSkip = async (supervisorId, requestId) => {
  const request = await prisma.routeChangeRequest.findUnique({
    where: { id: requestId },
    include: { pjpStop: { include: { outlet: true } } },
  });

  if (!request) throw new AppError('Request perubahan rute tidak ditemukan', 404);
  if (request.status !== ROUTE_CHANGE_STATUS.PENDING_APPROVAL) {
    throw new AppError(`Request sudah diproses sebelumnya (Status: ${request.status})`, 409);
  }

  const [updatedRequest] = await prisma.$transaction([
    prisma.routeChangeRequest.update({
      where: { id: requestId },
      data: { type: ROUTE_CHANGE_TYPE.SKIP, handledBy: supervisorId, status: ROUTE_CHANGE_STATUS.ACKNOWLEDGED },
      include: { pjpStop: { include: { outlet: true } } },
    }),
    prisma.pjpStop.update({
      where: { id: request.pjpStopId },
      data: { status: VISIT_STATUS.SKIPPED },
    }),
  ]);

  await createNotification(
    request.reportedBy,
    NOTIFICATION_TYPES.ROUTE_SKIP_ACKNOWLEDGED,
    'Outlet Dilewati',
    `Outlet "${request.pjpStop.outlet.name}" resmi dilewati oleh Supervisor.`,
    { routeChangeRequestId: updatedRequest.id }
  );

  return updatedRequest;
};
