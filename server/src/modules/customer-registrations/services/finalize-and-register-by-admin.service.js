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
import {registrationLocation} from '../../../../../shared/registration-policy.mjs';
import {REGISTRATION_FIELDS,registrationFieldError} from '../../../../../shared/registration-fields.mjs';
import {assertOutletLegal} from '../../outlets/services/outlet-data-policy.service.js';

/**
 * 6. Finalize and Register Active Outlet (Supervisor or Admin)
 * Aturan: Jika sudah disetujui (SPV_APPROVED), Supervisor atau Admin dapat mendaftarkan outlet ke sistem aktif.
 */
export const finalizeAndRegisterByAdmin = async (id, payload, currentUser) => {
  if (currentUser.role !== ROLES.ADMIN && currentUser.role !== ROLES.SUPERVISOR) {
    throw new AppError('Hanya Admin atau Supervisor yang dapat mendaftarkan outlet ke sistem aktif', 403);
  }

  let registration = await prisma.customerRegistration.findUnique({ where: { id } });
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

  const fields=payload.registrationFields||{};
  if(Object.entries(fields).some(([key,value])=>!Object.hasOwn(REGISTRATION_FIELDS,key)||typeof value!=='string'||value.length>2000))throw new AppError('Data pelengkap aktivasi tidak valid.',422);
  const beforeFields=Object.fromEntries(Object.keys(fields).map(key=>[key,registration[key]??null]));
  assertOutletLegal(fields,registration);registration={...registration,...fields};
  const fieldError=registrationFieldError(registration,await processValue(registration,'REGISTRATION_ACTIVATION_REQUIRED_FIELDS',''),'aktivasi');if(fieldError)throw new AppError(fieldError,422);
  let point;try{point=registrationLocation({latitude:payload.latitude??registration.latitude,longitude:payload.longitude??registration.longitude},await processValue(registration,'REGISTRATION_ACTIVATION_REQUIRE_LOCATION',true));}catch(e){throw new AppError(e.message,400);}
  const {latitude:lat,longitude:lng}=point;
  const changedPoint=(payload.latitude!==undefined||payload.longitude!==undefined)&&(lat!==registration.latitude||lng!==registration.longitude);
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
    await assertNoUnreviewedDuplicate(tx,{...registration,...point},currentUser,payload.duplicateReason);
    const changed=await tx.customerRegistration.updateMany({where:{id,registrationStatus:registration.registrationStatus,updatedAt:registration.updatedAt},data:{registrationStatus:'REGISTERED_ACTIVE'}});
    if(!changed.count)throw new AppError('Pengajuan sudah diproses, muat ulang',409);
    finalCode = await resolveBusinessCode('OUTLET', payload.outletCode || payload.customerCode || registration.customerCode, {db:tx,excludeId:id});
    const reg = await tx.customerRegistration.update({
      where: { id },
      data: {
        customerCode: finalCode,
        ...fields,
        ...point,
        ...(changedPoint?{locationEvidence:{source:'MANUAL',actor:actorSnapshot(currentUser),at:new Date().toISOString()}}:{}),
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
        latitude: lat,
        longitude: lng,
        clusterId: targetClusterId,
        channel: registration.channel || 'GENERAL_TRADE',
        type: registration.channel || 'GENERAL_TRADE',
        subChannel: registration.subChannel || 'TOKO_RETAIL',
        itineraryCode:registration.visitIntervalWeeks?`F${registration.visitIntervalWeeks}`:null,
        locationEvidence:changedPoint?{source:'MANUAL',actor:actorSnapshot(currentUser),at:new Date().toISOString()}:registration.locationEvidence || {source:'REGISTRATION',actor:actorSnapshot(currentUser),at:new Date().toISOString()},
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
    if(Object.keys(fields).length)await tx.auditEvent.create({data:{entityType:'REGISTRATION',entityId:id,action:'ACTIVATION_FIELDS',actorId:currentUser.id,actorName:currentUser.name,before:beforeFields,after:fields}});
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
