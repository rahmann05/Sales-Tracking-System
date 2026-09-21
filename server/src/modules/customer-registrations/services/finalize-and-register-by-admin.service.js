/** finalizeAndRegisterByAdmin - single-responsibility service (extracted from customer-registrations.service.js). */
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { ROLES } from '../../../utils/constants.js';
import { broadcastCacheInvalidation } from '../../../config/socket.js';

/**
 * 6. Finalize and Register Active Outlet (Supervisor or Admin)
 * Aturan: Jika sudah disetujui (SPV_APPROVED), Supervisor atau Admin dapat mendaftarkan outlet ke sistem aktif.
 */
export const finalizeAndRegisterByAdmin = async (id, payload, currentUser) => {
  if (currentUser.role !== ROLES.ADMIN && currentUser.role !== ROLES.SUPERVISOR) {
    throw new AppError('Hanya Admin atau Supervisor yang dapat mendaftarkan outlet ke sistem aktif', 403);
  }

  const registration = await prisma.customerRegistration.findUnique({ where: { id } });
  if (!registration) throw new AppError('Data registrasi tidak ditemukan', 404);

  const finalCode = payload.outletCode || payload.customerCode || registration.customerCode;
  if (!finalCode) {
    throw new AppError('Kode outlet / customer code wajib diisi', 400);
  }

  // Cek apakah kode outlet sudah ada di tabel Outlet
  const existingOutlet = await prisma.outlet.findFirst({
    where: { outletCode: finalCode, deletedAt: null },
  });
  if (existingOutlet) {
    throw new AppError(`Kode outlet "${finalCode}" sudah digunakan oleh toko "${existingOutlet.name}"`, 400);
  }

  // Tentukan Cluster: prioritaskan clusterId dari payload, atau cari cluster berdasarkan Area
  let targetClusterId = payload.clusterId;
  if (!targetClusterId) {
    const matchedCluster = await prisma.cluster.findFirst({
      where: {
        OR: [
          { name: { contains: registration.area, mode: 'insensitive' } },
          { region: { contains: registration.area, mode: 'insensitive' } },
        ],
        deletedAt: null,
      },
    });
    targetClusterId = matchedCluster?.id;
  }

  // Jika belum ada cluster, gunakan cluster aktif pertama
  if (!targetClusterId) {
    const firstCluster = await prisma.cluster.findFirst({ where: { deletedAt: null } });
    targetClusterId = firstCluster?.id;
  }

  if (!targetClusterId) {
    throw new AppError('Tidak ada klaster wilayah yang tersedia untuk mengaitkan outlet baru', 400);
  }

  // 1. Update status CustomerRegistration
  const updatedRegistration = await prisma.customerRegistration.update({
    where: { id },
    data: {
      customerCode: finalCode,
      registrationStatus: 'REGISTERED_ACTIVE',
      adminName: currentUser.name,
      adminRegisteredAt: new Date(),
    },
  });

  // 2. Masukkan ke tabel master Outlet aktif
  const outletType = registration.channel === 'MODERN_TRADE' ? 'MODERN_TRADE' : 'GENERAL_TRADE';
  const newOutlet = await prisma.outlet.create({
    data: {
      outletCode: finalCode,
      name: registration.name,
      address: registration.address,
      latitude: registration.latitude || -6.8722,
      longitude: registration.longitude || 107.5422,
      clusterId: targetClusterId,
      type: outletType,
      ownerName: registration.ownerName || registration.taxName,
      phone: registration.phone,
      radiusMeters: 50,
      validationStatus: 'VALID',
      validationConfidence: 95,
      validatedAt: new Date(),
    },
  });

  // Notifikasi ke Salesman dan Ops
  if (registration.salesmanId) {
    await prisma.notification.create({
      data: {
        userId: registration.salesmanId,
        type: 'OUTLET_REGISTERED_ACTIVE',
        title: 'Outlet Berhasil Terdaftar di Sistem',
        message: `Outlet "${registration.name}" telah resmi didaftarkan dengan Kode Outlet: ${finalCode}. Outlet kini aktif dalam sistem.`,
        payload: { registrationId: id, outletId: newOutlet.id, customerCode: finalCode },
      },
    }).catch(() => null);
  }

  broadcastCacheInvalidation('customer-registrations');
  broadcastCacheInvalidation('outlets');

  return { registration: updatedRegistration, outlet: newOutlet };
};
