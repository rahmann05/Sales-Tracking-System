import {policyNotification} from '../../notifications/services/notification-policy.service.js';
import {capturePolicySnapshot} from '../../config/services/process-policy.service.js';
import {assertNewWorkReviewers} from '../../config/services/approval-readiness.service.js';
/** createRegistration - single-responsibility service (extracted from customer-registrations.service.js). */
import { AppError } from '../../../utils/errors.js';
import { prisma } from '../../../config/prisma.js';
import { ROLES } from '../../../utils/constants.js';
import { broadcastCacheInvalidation } from '../../../config/socket.js';
import { saveOutletPhoto } from '../customer-photo.service.js';
import { sanitizeRegistrationPayload } from './sanitize-registration-payload.service.js';
import {assertNoUnreviewedDuplicate} from '../../outlets/services/outlet-duplicates.service.js';
import { getDynamicConfig } from '../../config/config.service.js';
import { resolveBusinessCode } from '../../config/services/business-code.service.js';
import {assertRequestReplay,assertOutletLegal,assertOutletTrade} from '../../outlets/services/outlet-data-policy.service.js';
import {actorSnapshot} from '../../outlets/services/outlet-review-policy.service.js';
import {allowedVisitIntervals} from '../../../../../shared/pjp-planning.mjs';

/**
 * 1. Create Outlet Registration (Salesman)
 */
export const createRegistration = async (data, currentUser) => {
  assertOutletLegal(data);
  assertOutletTrade(data);
  if(data.requestId) {
    const existing=await prisma.customerRegistration.findUnique({where:{requestId:data.requestId}});
    if(existing) {
      return assertRequestReplay(existing,data,currentUser,existing.salesmanId);
    }
  }
  if(await getDynamicConfig('FEATURE_REGISTRATION_MODE','ACTIVE')!=='ACTIVE')throw new AppError('Pendaftaran outlet baru dijeda oleh Admin',409);
  const allowed=allowedVisitIntervals({PJP_ALLOWED_INTERVALS:await getDynamicConfig('PJP_ALLOWED_INTERVALS','1,2,4')});
  const interval=data.visitIntervalWeeks??Number(await getDynamicConfig('PJP_DEFAULT_INTERVAL','1'));
  if(!allowed.includes(interval))throw new AppError('Interval kunjungan tidak diizinkan oleh Admin',422);
  const paymentType=data.paymentType??await getDynamicConfig('DEFAULT_PAYMENT_TYPE','CASH');
  if (await getDynamicConfig('CUSTOMER_REG_REQUIRE_PHOTO', true) && !data.photoUrl?.trim()) throw new AppError('Foto fisik outlet wajib dilampirkan', 422);
  if (await getDynamicConfig('CUSTOMER_REG_REQUIRE_TAX_DOCUMENT', true) && !data.taxDocumentUrl?.trim()) throw new AppError(`Foto dokumen ${data.taxType === 'PKP' ? 'NPWP' : 'KTP'} wajib dilampirkan`, 422);
  if(data.clusterId && !await prisma.cluster.findFirst({where:{id:data.clusterId,deletedAt:null,...(currentUser.role==='SUPERVISOR'?{supervisorId:currentUser.id}:currentUser.role==='SALES'?{OR:[{assignedSalesId:currentUser.id},{users:{some:{id:currentUser.id}}}]}:{})},select:{id:true}}))throw new AppError('Klaster berada di luar penugasan',403);
  const { latitude, longitude, name, photoUrl: incomingPhotoUrl } = data;
  if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||Math.abs(latitude)>90||Math.abs(longitude)>180)throw new AppError('Koordinat GPS nyata wajib diisi',400);

  // 1. Process and store outlet photo directly in PostgreSQL
  let photoId = data.photoId || null;
  let photoUrl = incomingPhotoUrl || null;

  if (incomingPhotoUrl) {
    const photoResult = await saveOutletPhoto(incomingPhotoUrl, 'PHOTO-REG');
    photoId = photoResult.photoId;
    photoUrl = photoResult.photoUrl;
  }

  const cleanData = sanitizeRegistrationPayload({
    ...data,
    division:data.division??await getDynamicConfig('ACTIVE_DIVISION','BELFOODS'),
    branch:data.branch||await getDynamicConfig('DEFAULT_BRANCH',''),
    paymentType,termOfPaymentDays:paymentType==='TOP'?(data.termOfPaymentDays??await getDynamicConfig('DEFAULT_TERM_OF_PAYMENT_DAYS',30)):0,
    visitIntervalWeeks:interval,
    photoId,
    photoUrl,
    placeId: data.placeId || null,
    placeDetails: data.placeDetails ? {...data.placeDetails,source:'USER_SELECTED_PROFILE',verified:false} : null,
    latitude,
    longitude,
    locationEvidence:data.locationEvidence?{...data.locationEvidence,actor:actorSnapshot(currentUser),at:new Date().toISOString()}:undefined,
    salesmanId: currentUser?.id,
    salesmanName: currentUser?.name || 'Salesman',
    registrationStatus: 'SUBMITTED',
  });
  for(const key of ['id','createdAt','updatedAt','deletedAt','spvId','spvName','spvApprovedAt','adminId','adminName','adminRegisteredAt','rejectionNote','revisionHistory']) delete cleanData[key];
  const registration = await prisma.$transaction(async tx=>{
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('planning:territories'))`;
    if(data.requestId) {const retry=await tx.customerRegistration.findUnique({where:{requestId:data.requestId}});if(retry)return assertRequestReplay(retry,data,currentUser,retry.salesmanId);}
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('approval:actors'))`;
    const snapshot=await capturePolicySnapshot();
    await assertNewWorkReviewers(tx,'REGISTRATION',{policySnapshot:snapshot},currentUser.id);
    await assertNoUnreviewedDuplicate(tx,data,currentUser,data.duplicateReason);
    cleanData.registrationCode=await resolveBusinessCode('NOO',data.registrationCode,{db:tx});
    return tx.customerRegistration.create({data:{...cleanData,policySnapshot:snapshot}});
  });

  // Kirim notifikasi ke SPV dan Admin
  try {
    const sales = await prisma.user.findUnique({where:{id:currentUser.id},select:{supervisorId:true}});
    const supervisorIds = sales?.supervisorId ? [sales.supervisorId] : [];
    const managers = await prisma.user.findMany({
      where: {
        OR: [{role:ROLES.ADMIN},{role:ROLES.SUPERVISOR,id:{in:supervisorIds}}],
        deletedAt: null,
      },
    });

    for (const mgr of managers) {
      await policyNotification(prisma,{
        data: {
          userId: mgr.id,
          type: 'OUTLET_REGISTRATION_SUBMITTED',
          title: 'Pengajuan Registrasi Outlet Baru',
          message: `Salesman ${currentUser.name} telah mengajukan registrasi outlet "${name}" di ${data.area || 'Cimahi'}.`,
          payload: {
            registrationId: registration.id,
            outletName: name,
            salesmanName: currentUser.name,
          },
        },
      });
    }
  } catch (err) {
    console.warn('[CustomerRegistration] Failed to create notifications:', err.message);
  }

  broadcastCacheInvalidation('customer-registrations');
  return registration;
};
