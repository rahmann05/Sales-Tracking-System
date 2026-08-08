import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/errors.js';
import { parsePagination, buildPaginatedResponse, buildDayRange } from '../../utils/pagination.js';
import { OFF_PJP_STATUS, ROLES, NOTIFICATION_TYPES } from '../../utils/constants.js';
import { createNotification, createBulkNotificationByRoles } from '../notifications/notifications.service.js';

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

/**
 * List off-PJP attendances.
 */
export const getOffPjpAttendances = async (currentUser, query = {}) => {
  const { status, userId, date } = query;
  const { skip, take, page, limit } = parsePagination(query);

  const where = {};
  if (status) where.status = status;
  if (userId) where.userId = userId;
  if (date) where.createdAt = buildDayRange(date);

  if (currentUser.role === ROLES.SALES) {
    where.userId = currentUser.id;
  }

  const [data, total] = await Promise.all([
    prisma.offPjpAttendance.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, role: true } },
        outlet: { select: { id: true, name: true, address: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.offPjpAttendance.count({ where }),
  ]);

  return buildPaginatedResponse(data, total, page, limit);
};

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
