import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/errors.js';
import { OUTLET_LOCK_STATUS, ROUTE_CHANGE_STATUS, ROLES, NOTIFICATION_TYPES } from '../../utils/constants.js';
import { createNotification, createBulkNotificationByRoles } from '../notifications/notifications.service.js';

/**
 * Admin/Supervisor locks an outlet.
 */
export const lockOutlet = async (outletId) => {
  const outlet = await prisma.outlet.findUnique({ where: { id: outletId } });
  if (!outlet || outlet.deletedAt) throw new AppError('Outlet tidak ditemukan', 404);

  return await prisma.outlet.update({
    where: { id: outletId },
    data: { lockStatus: OUTLET_LOCK_STATUS.LOCKED },
  });
};

/**
 * Admin/Supervisor directly unlocks an outlet (without a request).
 */
export const unlockOutletDirect = async (outletId) => {
  const outlet = await prisma.outlet.findUnique({ where: { id: outletId } });
  if (!outlet || outlet.deletedAt) throw new AppError('Outlet tidak ditemukan', 404);

  return await prisma.outlet.update({
    where: { id: outletId },
    data: { lockStatus: OUTLET_LOCK_STATUS.NORMAL },
  });
};

/**
 * Sales requests to unlock a locked outlet.
 */
export const requestOutletUnlock = async (outletId, userId, reason) => {
  const outlet = await prisma.outlet.findUnique({ where: { id: outletId } });
  if (!outlet || outlet.deletedAt) throw new AppError('Outlet tidak ditemukan', 404);

  if (outlet.lockStatus === OUTLET_LOCK_STATUS.NORMAL) {
    throw new AppError('Outlet ini tidak dalam status terkunci', 400);
  }

  // Check duplicate pending request
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

/**
 * Supervisor/Admin handles (approve or reject) a pending unlock request.
 */
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

/**
 * List pending unlock requests (for Supervisor/Admin).
 */
export const getUnlockRequests = async (query = {}) => {
  const { status } = query;
  const where = {};
  if (status) where.status = status;

  return await prisma.outletUnlockRequest.findMany({
    where,
    include: {
      outlet: { select: { id: true, name: true, address: true, lockStatus: true } },
      requestedByUser: { select: { id: true, name: true, role: true } },
      handledByUser: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};
