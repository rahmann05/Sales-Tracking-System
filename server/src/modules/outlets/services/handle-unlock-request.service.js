/** handleUnlockRequest - single-responsibility service (extracted from outlet-lock.service.js). */
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { OUTLET_LOCK_STATUS, ROUTE_CHANGE_STATUS, ROLES, NOTIFICATION_TYPES } from '../../../utils/constants.js';
import { createNotification, createBulkNotificationByRoles } from '../../notifications/notifications.service.js';


export const handleUnlockRequest = async (requestId, handlerId, approved) => {
  const request = await prisma.outletUnlockRequest.findUnique({
    where: { id: requestId },
    include: { outlet: true, requestedByUser: { select: { id: true, name: true } } },
  });

  if (!request) throw new AppError('Permintaan unlock tidak ditemukan', 404);
  if (request.status !== ROUTE_CHANGE_STATUS.PENDING_APPROVAL) {
    throw new AppError(`Permintaan sudah diproses sebelumnya (Status: ${request.status})`, 409);
  }

  const newStatus = approved ? ROUTE_CHANGE_STATUS.APPROVED : ROUTE_CHANGE_STATUS.REJECTED;
  const newLockStatus = approved ? OUTLET_LOCK_STATUS.NORMAL : OUTLET_LOCK_STATUS.LOCKED;

  await prisma.$transaction([
    prisma.outletUnlockRequest.update({
      where: { id: requestId },
      data: { status: newStatus, handledBy: handlerId, handledAt: new Date() },
    }),
    prisma.outlet.update({
      where: { id: request.outletId },
      data: { lockStatus: newLockStatus },
    }),
  ]);

  const notifTitle = approved ? 'Permintaan Unlock Disetujui' : 'Permintaan Unlock Ditolak';
  const notifMsg = approved
    ? `Permintaan buka kunci outlet "${request.outlet.name}" telah disetujui. Anda dapat absen sekarang.`
    : `Permintaan buka kunci outlet "${request.outlet.name}" ditolak.`;

  await createNotification(
    request.requestedByUser.id,
    approved ? NOTIFICATION_TYPES.UNLOCK_APPROVED : NOTIFICATION_TYPES.UNLOCK_REJECTED,
    notifTitle,
    notifMsg,
    { outletId: request.outletId }
  );

  return { message: notifMsg, approved };
};
