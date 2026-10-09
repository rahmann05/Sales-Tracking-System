import {policyNotification} from '../../notifications/services/notification-policy.service.js';
import {assertApprovalRole} from '../../config/services/approval-policy.service.js';
import {assertSalesAccess} from '../../../utils/team-scope.js';
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
  await assertApprovalRole(registration,'REGISTRATION_APPROVAL_MODE',currentUser.role);

  const isSupervisor = currentUser.role === ROLES.SUPERVISOR;
  const isAdmin = currentUser.role === ROLES.ADMIN;

  if (!isSupervisor && !isAdmin) {
    throw new AppError('Anda tidak memiliki wewenang untuk menolak pengajuan ini', 403);
  }

  // B01: Status guard — tidak bisa menolak outlet yang sudah aktif di master
  if (registration.registrationStatus === 'REGISTERED_ACTIVE') {
    throw new AppError('Pengajuan outlet sudah aktif di sistem master dan tidak dapat ditolak', 400);
  }

  if (!['SUBMITTED','PENDING','SPV_APPROVED'].includes(registration.registrationStatus)) throw new AppError('Status pengajuan tidak dapat ditolak',400);
  if (!String(reason || '').trim()) throw new AppError('Alasan penolakan wajib',400);
  await assertSalesAccess(currentUser,registration.salesmanId);
  const changed = await prisma.customerRegistration.updateMany({
    where: { id, registrationStatus: registration.registrationStatus },
    data: {
      registrationStatus: 'REJECTED',
      rejectionNote: reason,
    },
  });

  if (!changed.count) throw new AppError('Status pengajuan berubah, muat ulang',409);
  const updated = await prisma.customerRegistration.findUnique({where:{id}});

  // Notifikasi ke Salesman
  if (registration.salesmanId) {
    await policyNotification(prisma,{
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
