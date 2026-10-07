/** createRegistration - single-responsibility service (extracted from customer-registrations.service.js). */
import { AppError } from '../../../utils/errors.js';
import { prisma } from '../../../config/prisma.js';
import { ROLES } from '../../../utils/constants.js';
import { broadcastCacheInvalidation } from '../../../config/socket.js';
import { saveOutletPhoto } from '../customer-photo.service.js';
import { sanitizeRegistrationPayload } from './sanitize-registration-payload.service.js';
import { validateGooglePlace } from './validate-google-place.service.js';
import { getDynamicConfig } from '../../config/config.service.js';
import { resolveBusinessCode } from '../../config/services/business-code.service.js';

/**
 * 1. Create Outlet Registration (Salesman)
 */
export const createRegistration = async (data, currentUser) => {
  if (await getDynamicConfig('CUSTOMER_REG_REQUIRE_PHOTO', true) && !data.photoUrl?.trim()) throw new AppError('Foto fisik outlet wajib dilampirkan', 422);
  if (await getDynamicConfig('CUSTOMER_REG_REQUIRE_TAX_DOCUMENT', true) && !data.taxDocumentUrl?.trim()) throw new AppError(`Foto dokumen ${data.taxType === 'PKP' ? 'NPWP' : 'KTP'} wajib dilampirkan`, 422);
  if(data.clusterId && !await prisma.cluster.findFirst({where:{id:data.clusterId,deletedAt:null,...(currentUser.role==='SUPERVISOR'?{supervisorId:currentUser.id}:currentUser.role==='SALES'?{OR:[{assignedSalesId:currentUser.id},{users:{some:{id:currentUser.id}}}]}:{})},select:{id:true}}))throw new AppError('Klaster berada di luar penugasan',403);
  const { latitude = 0, longitude = 0, name, address, photoUrl: incomingPhotoUrl } = data;

  // 1. Process and store outlet photo directly in PostgreSQL
  let photoId = data.photoId || null;
  let photoUrl = incomingPhotoUrl || null;

  if (incomingPhotoUrl) {
    const photoResult = await saveOutletPhoto(incomingPhotoUrl, 'PHOTO-REG');
    photoId = photoResult.photoId;
    photoUrl = photoResult.photoUrl;
  }

  // 2. Run Google Place verification
  const placeValidation = await validateGooglePlace(name, address, latitude, longitude);

  const cleanData = sanitizeRegistrationPayload({
    ...data,
    photoId,
    photoUrl,
    placeId: data.placeId || placeValidation?.placeId || null,
    placeDetails: data.placeDetails || placeValidation || null,
    latitude: Number(latitude) || 0,
    longitude: Number(longitude) || 0,
    salesmanId: currentUser?.id,
    salesmanName: currentUser?.name || 'Salesman',
    registrationStatus: 'SUBMITTED',
  });
  cleanData.registrationCode = await resolveBusinessCode('NOO', data.registrationCode);

  for(const key of ['id','createdAt','updatedAt','deletedAt','spvId','spvName','spvApprovedAt','adminId','adminName','adminRegisteredAt','rejectionNote']) delete cleanData[key];
  const registration = await prisma.customerRegistration.create({
    data: cleanData,
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
      await prisma.notification.create({
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
  return { ...registration, placeValidation };
};
