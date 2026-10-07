import {assertClusterTrade} from '../../clusters/services/cluster-trade-policy.service.js';
import { assertSalesAccess } from '../../../utils/team-scope.js';
/** finalizeAndRegisterByAdmin - single-responsibility service (extracted from customer-registrations.service.js). */
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { ROLES } from '../../../utils/constants.js';
import { broadcastCacheInvalidation } from '../../../config/socket.js';
import { getDynamicConfig } from '../../config/config.service.js';

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

  // B01: Prasyarat SPV_APPROVED wajib dipenuhi sebelum aktivasi
  if (registration.registrationStatus === 'REGISTERED_ACTIVE') {
    throw new AppError('Outlet ini sudah aktif terdaftar sebelumnya', 400);
  }
  if (registration.registrationStatus !== 'SPV_APPROVED') {
    throw new AppError(`Pengajuan outlet belum disetujui supervisor (Status saat ini: ${registration.registrationStatus})`, 400);
  }

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

  // Koordinat GPS wajib nyata dan valid, tidak boleh memakai titik koordinat palsu diam-diam
  const lat = payload.latitude ?? registration.latitude;
  const lng = payload.longitude ?? registration.longitude;
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    throw new AppError('Koordinat GPS fisik outlet wajib diisi sebelum aktivasi', 400);
  }

  if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng)) || Math.abs(Number(lat))>90 || Math.abs(Number(lng))>180) throw new AppError('Koordinat GPS tidak valid',400);
  await assertSalesAccess(currentUser,registration.salesmanId);
  // Tentukan Cluster: prioritaskan clusterId dari payload, atau cari cluster berdasarkan Area
  const targetClusterId = payload.clusterId || registration.clusterId;

  if (!targetClusterId) throw new AppError('Pilih klaster wilayah secara eksplisit sebelum aktivasi',400);
  const cluster=await prisma.cluster.findFirst({where:{id:targetClusterId,deletedAt:null}});
  if(!cluster)throw new AppError('Klaster aktif tidak ditemukan',400);
  if(currentUser.role==='SUPERVISOR'&&cluster.supervisorId!==currentUser.id)throw new AppError('Klaster berada di luar tim Anda',403);

  const defaultRadius = await getDynamicConfig('DEFAULT_OUTLET_RADIUS_METERS', 50);

  // B01: Transaksi atomik agar update registrasi dan pembuatan master outlet konsisten
  const [updatedRegistration, newOutlet] = await prisma.$transaction(async (tx) => {
    const changed=await tx.customerRegistration.updateMany({where:{id,registrationStatus:'SPV_APPROVED'},data:{registrationStatus:'REGISTERED_ACTIVE'}});
    if(!changed.count)throw new AppError('Pengajuan sudah diproses, muat ulang',409);
    const reg = await tx.customerRegistration.update({
      where: { id },
      data: {
        customerCode: finalCode,
        registrationStatus: 'REGISTERED_ACTIVE',
        adminId: currentUser.id,
        adminName: currentUser.name,
        adminRegisteredAt: new Date(),
      },
    });

    await assertClusterTrade(tx,targetClusterId,registration.channel || 'GENERAL_TRADE');
    const outlet = await tx.outlet.create({
      data: {
        outletCode: finalCode,
        name: registration.name,
        address: registration.address,
        latitude: Number(lat),
        longitude: Number(lng),
        clusterId: targetClusterId,
        channel: registration.channel || 'GENERAL_TRADE',
        type: registration.channel || 'GENERAL_TRADE',
        subChannel: registration.subChannel || 'TOKO_RETAIL',
        ownerName: registration.ownerName || registration.taxName,
        phone: registration.phone,
        paymentType: registration.paymentType,
        termOfPaymentDays: registration.termOfPaymentDays,
        visitSchedule: {weekType:registration.visitWeekSchedule,days:registration.visitDays},
        radiusMeters: defaultRadius,
        validationStatus: 'UNVALIDATED',
      },
    });

    return [reg, outlet];
  },{isolationLevel:'Serializable'});

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
