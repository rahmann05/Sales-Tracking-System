/** createOffPjpAttendance - single-responsibility service (extracted from off-pjp.service.js). */
import { prisma } from '../../../config/prisma.js';
import { OFF_PJP_STATUS, ROLES, NOTIFICATION_TYPES } from '../../../utils/constants.js';
import { createNotification, createBulkNotificationByRoles } from '../../notifications/notifications.service.js';

/**
 * Sales submits an off-PJP attendance.
 */
export const createOffPjpAttendance = async (userId, data) => {
  const { outletName, customerName, phone, address, reason, latitude, longitude, photoUrl, outletId } = data;

  const record = await prisma.offPjpAttendance.create({
    data: {
      userId,
      outletId: outletId || null,
      outletName,
      customerName: customerName || null,
      phone: phone || null,
      address,
      reason,
      latitude,
      longitude,
      photoUrl: photoUrl || null,
      status: OFF_PJP_STATUS.PENDING,
    },
    include: {
      user: { select: { id: true, name: true } },
      outlet: { select: { id: true, name: true } },
    },
  });

  await createBulkNotificationByRoles(
    [ROLES.SUPERVISOR],
    NOTIFICATION_TYPES.OFF_PJP_SUBMITTED,
    'Absen Toko Luar RJP (Menunggu Validasi)',
    `Sales ${record.user.name} melakukan absen di toko luar RJP: ${outletName}. Membutuhkan validasi Supervisor.`,
    { offPjpAttendanceId: record.id }
  );

  return record;
};
