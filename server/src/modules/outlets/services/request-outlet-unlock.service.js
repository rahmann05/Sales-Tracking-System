/** requestOutletUnlock - single-responsibility service (extracted from outlet-lock.service.js). */
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { OUTLET_LOCK_STATUS, ROUTE_CHANGE_STATUS, ROLES, NOTIFICATION_TYPES } from '../../../utils/constants.js';
import { createNotification, createBulkNotificationByRoles } from '../../notifications/notifications.service.js';


export const requestOutletUnlock = async (outletId, userId, reason) => {
  const outlet = await prisma.outlet.findUnique({ where: { id: outletId } });
  if (!outlet || outlet.deletedAt) throw new AppError('Outlet tidak ditemukan', 404);

  if (outlet.lockStatus === OUTLET_LOCK_STATUS.NORMAL) {
    throw new AppError('Outlet ini tidak dalam status terkunci', 400);
  }

  const existing = await prisma.outletUnlockRequest.findFirst({
    where: { outletId, requestedBy: userId, status: ROUTE_CHANGE_STATUS.PENDING_APPROVAL },
  });
  if (existing) {
    throw new AppError('Anda sudah memiliki permintaan unlock yang sedang menunggu persetujuan', 409);
  }

  const [request] = await prisma.$transaction([
    prisma.outletUnlockRequest.create({
      data: {
        outletId,
        requestedBy: userId,
        reason,
        status: ROUTE_CHANGE_STATUS.PENDING_APPROVAL,
      },
      include: {
        outlet: { select: { id: true, name: true } },
        requestedByUser: { select: { id: true, name: true } },
      },
    }),
    prisma.outlet.update({
      where: { id: outletId },
      data: { lockStatus: OUTLET_LOCK_STATUS.UNLOCK_REQUESTED },
    }),
  ]);

  await createBulkNotificationByRoles(
    [ROLES.SUPERVISOR, ROLES.ADMIN],
    NOTIFICATION_TYPES.UNLOCK_REQUEST,
    'Permintaan Buka Kunci Outlet',
    `${request.requestedByUser.name} meminta unlock outlet "${outlet.name}". Alasan: ${reason}`,
    { unlockRequestId: request.id, outletId }
  );

  return request;
};
