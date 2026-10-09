import {policyNotification} from '../../notifications/services/notification-policy.service.js';
import {processValue} from '../../config/services/process-policy.service.js';
import {assertClusterTrade} from '../../clusters/services/cluster-trade-policy.service.js';
import { assertSalesAccess } from '../../../utils/team-scope.js';
/** finalizeAndRegisterByAdmin - single-responsibility service (extracted from customer-registrations.service.js). */
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { ROLES } from '../../../utils/constants.js';
import { broadcastCacheInvalidation } from '../../../config/socket.js';
import { resolveBusinessCode } from '../../config/services/business-code.service.js';
import {assertNoUnreviewedDuplicate} from '../../outlets/services/outlet-duplicates.service.js';
import {actorSnapshot} from '../../outlets/services/outlet-review-policy.service.js';
import {synchronizeOutletCounts} from '../../clusters/services/cluster-assignment-policy.service.js';
import {invalidateClusterCache} from '../../clusters/services/clusters.helpers.js';
import {invalidateOutletCache} from '../../outlets/services/outlets.helpers.js';

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

  const activator=await processValue(registration,'REGISTRATION_ACTIVATOR','BOTH');
  if(activator!=='BOTH'&&activator!==currentUser.role)throw new AppError('Akun ini bukan pihak aktivasi dalam aturan pengajuan',403);
  const mode=await processValue(registration,'REGISTRATION_APPROVAL_MODE','BOTH');
  if(mode==='SEQUENTIAL'&&currentUser.role!=='ADMIN')throw new AppError('Aktivasi tahap akhir dilakukan Admin setelah SPV',403);
  // B01: Prasyarat SPV_APPROVED wajib dipenuhi sebelum aktivasi
  if (registration.registrationStatus === 'REGISTERED_ACTIVE') {
    await assertSalesAccess(currentUser,registration.salesmanId);
    const outlet=await prisma.outlet.findUnique({where:{registrationId:id}});
    if(outlet)return {registration,outlet};
    throw new AppError('Pengajuan aktif belum terhubung dengan master. Periksa data master.',409);
  }
  if (registration.registrationStatus !== 'SPV_APPROVED' && !(mode==='NONE'&&['SUBMITTED','PENDING'].includes(registration.registrationStatus))) {
    throw new AppError(`Pengajuan outlet belum disetujui supervisor (Status saat ini: ${registration.registrationStatus})`, 400);
  }

  let finalCode;

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

  const defaultRadius = await processValue(registration,'DEFAULT_OUTLET_RADIUS_METERS', 50);

  // B01: Transaksi atomik agar update registrasi dan pembuatan master outlet konsisten
  const [updatedRegistration, newOutlet] = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('planning:territories'))`;
    const retry=await tx.outlet.findUnique({where:{registrationId:id}});
    if(retry)return [await tx.customerRegistration.findUnique({where:{id}}),retry];
    await assertNoUnreviewedDuplicate(tx,{...registration,latitude:Number(lat),longitude:Number(lng)},currentUser,payload.duplicateReason);
    const changed=await tx.customerRegistration.updateMany({where:{id,registrationStatus:registration.registrationStatus,updatedAt:registration.updatedAt},data:{registrationStatus:'REGISTERED_ACTIVE'}});
    if(!changed.count)throw new AppError('Pengajuan sudah diproses, muat ulang',409);
    finalCode = await resolveBusinessCode('OUTLET', payload.outletCode || payload.customerCode || registration.customerCode, {db:tx,excludeId:id});
    const reg = await tx.customerRegistration.update({
      where: { id },
      data: {
        customerCode: finalCode,
        clusterId:targetClusterId,
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
        registrationId:id,source:'REGISTRATION',taxType:registration.taxType,taxNumber:registration.taxNumber,taxName:registration.taxName,taxAddress:registration.taxAddress,
        name: registration.name,
        address: registration.address,
        latitude: Number(lat),
        longitude: Number(lng),
        clusterId: targetClusterId,
        channel: registration.channel || 'GENERAL_TRADE',
        type: registration.channel || 'GENERAL_TRADE',
        subChannel: registration.subChannel || 'TOKO_RETAIL',
        itineraryCode:registration.visitIntervalWeeks?`F${registration.visitIntervalWeeks}`:null,
        locationEvidence:registration.locationEvidence || {source:'REGISTRATION',actor:actorSnapshot(currentUser),at:new Date().toISOString()},
        ownerName: registration.ownerName || registration.taxName,
        phone: registration.phone,
        paymentType: registration.paymentType,
        termOfPaymentDays: registration.termOfPaymentDays,
        visitSchedule: {weekType:registration.visitWeekSchedule,days:registration.visitDays,intervalWeeks:registration.visitIntervalWeeks},
        radiusMeters: defaultRadius,
        validationStatus: 'UNVALIDATED',
      },
    });

    await tx.outletChange.create({data:{outletId:outlet.id,actor:actorSnapshot(currentUser),reason:payload.duplicateReason || 'Aktivasi pengajuan yang disetujui',source:'REGISTRATION',before:{},after:{registrationId:id,name:outlet.name,address:outlet.address,latitude:outlet.latitude,longitude:outlet.longitude,clusterId:targetClusterId}}});
    await synchronizeOutletCounts(tx,[targetClusterId]);
    await tx.clusterRoute.deleteMany({where:{clusterId:targetClusterId}});

    return [reg, outlet];
  },{isolationLevel:'Serializable'});
  finalCode=newOutlet.outletCode;

  // Notifikasi ke Salesman dan Ops
  if (registration.salesmanId) {
    await policyNotification(prisma,{
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
  invalidateOutletCache();
  invalidateClusterCache(targetClusterId);

  return { registration: updatedRegistration, outlet: newOutlet };
};
