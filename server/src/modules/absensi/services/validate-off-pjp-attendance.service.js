/** validateOffPjpAttendance - single-responsibility service (extracted from off-pjp.service.js). */
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { OFF_PJP_STATUS, ROLES, NOTIFICATION_TYPES } from '../../../utils/constants.js';
import { createNotification, createBulkNotificationByRoles } from '../../notifications/notifications.service.js';

/**
 * Supervisor validates an off-PJP attendance.
 */
export const validateOffPjpAttendance = async (id, supervisorId, approved, rejectionNote) => {
  const record = await prisma.offPjpAttendance.findUnique({ where: { id } });
  if (!record) throw new AppError('Data absen luar RJP tidak ditemukan', 404);
  if (record.status !== OFF_PJP_STATUS.PENDING) {
    throw new AppError(`Absen ini sudah diproses sebelumnya (Status: ${record.status})`, 409);
  }

  const newStatus = approved ? OFF_PJP_STATUS.APPROVED : OFF_PJP_STATUS.REJECTED;

  const updated = await prisma.offPjpAttendance.update({
    where: { id },
    data: {
      status: newStatus,
      validatedBy: supervisorId,
      validatedAt: new Date(),
      rejectionNote: rejectionNote || null,
    },
  });

  const notifTitle = approved ? 'Absen Luar RJP Divalidasi' : 'Absen Luar RJP Ditolak';
  const notifMsg = approved
    ? `Absen Anda di toko "${record.outletName}" telah divalidasi oleh Supervisor.`
    : `Absen Anda di toko "${record.outletName}" ditolak. Alasan: ${rejectionNote || '-'}.`;

  await createNotification(
    record.userId,
    approved ? NOTIFICATION_TYPES.OFF_PJP_VALIDATED : NOTIFICATION_TYPES.OFF_PJP_REJECTED,
    notifTitle,
    notifMsg,
    { offPjpAttendanceId: id }
  );

  return updated;
};
