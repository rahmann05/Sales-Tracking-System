/** rejectRegistration - single-responsibility service (extracted from customer-registrations.service.js). */
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { ROLES } from '../../../utils/constants.js';
import { broadcastCacheInvalidation } from '../../../config/socket.js';

/**
 * 5. Reject Registration
 */
export const rejectRegistration = async (id, reason, currentUser) => {
  const registration = await prisma.customerRegistration.findUnique({ where: { id } });
  if (!registration) throw new AppError('Data registrasi tidak ditemukan', 404);

  const isSupervisor = currentUser.role === ROLES.SUPERVISOR;
  const isAdmin = currentUser.role === ROLES.ADMIN;

  if (!isSupervisor && !isAdmin) {
    throw new AppError('Anda tidak memiliki wewenang untuk menolak pengajuan ini', 403);
  }

  const updated = await prisma.customerRegistration.update({
    where: { id },
    data: {
      registrationStatus: 'REJECTED',
      rejectionNote: reason,
    },
  });

  // Notifikasi ke Salesman
  if (registration.salesmanId) {
    await prisma.notification.create({
      data: {
        userId: registration.salesmanId,
        type: 'OUTLET_REGISTRATION_REJECTED',
        title: 'Pengajuan Outlet Ditolak',
        message: `Pengajuan outlet "${registration.name}" ditolak oleh ${currentUser.name}. Alasan: ${reason}`,
        payload: { registrationId: id, reason },
      },
    }).catch(() => null);
  }

  broadcastCacheInvalidation('customer-registrations');
  return updated;
};
