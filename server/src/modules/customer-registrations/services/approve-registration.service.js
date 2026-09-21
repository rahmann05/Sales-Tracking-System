/** approveRegistration - single-responsibility service (extracted from customer-registrations.service.js). */
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { ROLES } from '../../../utils/constants.js';
import { broadcastCacheInvalidation } from '../../../config/socket.js';

/**
 * 4. Approve Registration (Supervisor or Ops Manager)
 */
export const approveRegistration = async (id, note, currentUser) => {
  const registration = await prisma.customerRegistration.findUnique({ where: { id } });
  if (!registration) throw new AppError('Data registrasi tidak ditemukan', 404);

  const isSupervisor = currentUser.role === ROLES.SUPERVISOR;
  const isAdmin = currentUser.role === ROLES.ADMIN;

  if (!isSupervisor && !isAdmin) {
    throw new AppError('Anda tidak memiliki wewenang untuk menyetujui pengajuan ini', 403);
  }

  const updateData = {
    spvId: currentUser.id,
    spvName: currentUser.name,
    spvApprovedAt: new Date(),
    registrationStatus: 'SPV_APPROVED',
  };

  const updated = await prisma.customerRegistration.update({
    where: { id },
    data: updateData,
  });

  // Notifikasi ke Salesman dan Admin
  if (registration.salesmanId) {
    await prisma.notification.create({
      data: {
        userId: registration.salesmanId,
        type: 'OUTLET_REGISTRATION_APPROVED',
        title: 'Pengajuan Outlet Disetujui',
        message: `Pengajuan outlet "${registration.name}" telah disetujui oleh ${currentUser.name} (${currentUser.role}).`,
        payload: { registrationId: id, status: updated.registrationStatus },
      },
    }).catch(() => null);
  }

  broadcastCacheInvalidation('customer-registrations');
  return updated;
};
