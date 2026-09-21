/** submitReroute - single-responsibility service (extracted from route-change.service.js). */
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { createNotification, createBulkNotificationByRoles } from '../../notifications/notifications.service.js';
import { ROLES, ROUTE_CHANGE_TYPE, ROUTE_CHANGE_STATUS, VISIT_STATUS, NOTIFICATION_TYPES } from '../../../utils/constants.js';

/**
 * Step 2a - Supervisor submits reroute (needs Manager approval).
 */
export const submitReroute = async (supervisorId, requestId, replacementOutletId) => {
  const request = await prisma.routeChangeRequest.findUnique({
    where: { id: requestId },
    include: {
      pjpStop: { include: { outlet: true } },
      pjp: { include: { stops: true } },
    },
  });

  if (!request) throw new AppError('Request perubahan rute tidak ditemukan', 404);
  if (request.status !== 'PENDING_APPROVAL') {
    throw new AppError(`Request sudah diproses sebelumnya (Status: ${request.status})`, 409);
  }

  const replacementOutlet = await prisma.outlet.findUnique({ where: { id: replacementOutletId } });
  if (!replacementOutlet || replacementOutlet.deletedAt) {
    throw new AppError('Outlet pengganti tidak ditemukan', 404);
  }
  const maxSeq = Math.max(...(request.pjp?.stops?.map((s) => s.sequence) || [0]), 0);

  const [updatedRequest, newPjpStop] = await prisma.$transaction([
    prisma.routeChangeRequest.update({
      where: { id: requestId },
      data: {
        type: ROUTE_CHANGE_TYPE.REROUTE,
        handledBy: supervisorId,
        approvedBy: supervisorId,
        replacementOutletId,
        status: ROUTE_CHANGE_STATUS.APPROVED,
      },
      include: { replacementOutlet: true },
    }),
    prisma.pjpStop.create({
      data: {
        pjpId: request.pjpId,
        outletId: replacementOutletId,
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
    `Reroute ke outlet "${replacementOutlet.name}" disetujui oleh Supervisor dan ditambahkan ke rute Anda.`,
    { pjpId: request.pjpId }
  );

  return { routeChangeRequest: updatedRequest, createdPjpStop: newPjpStop };
};
