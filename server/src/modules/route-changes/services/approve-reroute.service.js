/** approveReroute - single-responsibility service (extracted from route-change.service.js). */
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { createNotification, createBulkNotificationByRoles } from '../../notifications/notifications.service.js';
import { ROLES, ROUTE_CHANGE_TYPE, ROUTE_CHANGE_STATUS, VISIT_STATUS, NOTIFICATION_TYPES } from '../../../utils/constants.js';

/**
 * Step 3 - Manager approves REROUTE. New stop is added to PJP.
 */
export const approveReroute = async (managerId, requestId) => {
  const request = await prisma.routeChangeRequest.findUnique({
    where: { id: requestId },
    include: {
      pjp: { include: { stops: true } },
      pjpStop: true,
      replacementOutlet: true,
    },
  });

  if (!request) throw new AppError('Request perubahan rute tidak ditemukan', 404);
  if (request.type !== ROUTE_CHANGE_TYPE.REROUTE) throw new AppError('Hanya tipe REROUTE yang memerlukan approval', 400);
  if (request.status !== ROUTE_CHANGE_STATUS.PENDING_APPROVAL) {
    throw new AppError(`Request sudah diproses sebelumnya (Status: ${request.status})`, 409);
  }

  const maxSeq = Math.max(...request.pjp.stops.map((s) => s.sequence), 0);

  const [updatedRequest, newPjpStop] = await prisma.$transaction([
    prisma.routeChangeRequest.update({
      where: { id: requestId },
      data: { status: ROUTE_CHANGE_STATUS.APPROVED, approvedBy: managerId },
    }),
    prisma.pjpStop.create({
      data: {
        pjpId: request.pjpId,
        outletId: request.replacementOutletId,
        sequence: maxSeq + 1,
        status: 'PENDING',
      },
      include: { outlet: true },
    }),
  ]);

  await createNotification(
    request.reportedBy,
    NOTIFICATION_TYPES.REROUTE_APPROVED,
    'Perubahan Rute Disetujui',
    `Reroute ke outlet "${request.replacementOutlet.name}" disetujui dan ditambahkan ke rute Anda.`,
    { pjpId: request.pjpId }
  );

  return { routeChangeRequest: updatedRequest, createdPjpStop: newPjpStop };
};
