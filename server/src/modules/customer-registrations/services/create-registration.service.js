/** createRegistration - single-responsibility service (extracted from customer-registrations.service.js). */
import { prisma } from '../../../config/prisma.js';
import { ROLES } from '../../../utils/constants.js';
import { broadcastCacheInvalidation } from '../../../config/socket.js';
import { saveOutletPhoto } from '../customer-photo.service.js';
import { sanitizeRegistrationPayload } from './sanitize-registration-payload.service.js';
import { validateGooglePlace } from './validate-google-place.service.js';

/**
 * 1. Create Outlet Registration (Salesman)
 */
export const createRegistration = async (data, currentUser) => {
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
    placeId: data.placeId || (placeValidation?.isPlaceFound ? 'PLACE-VERIFIED' : null),
    placeDetails: data.placeDetails || placeValidation || null,
    latitude: Number(latitude) || 0,
    longitude: Number(longitude) || 0,
    salesmanId: currentUser?.id,
    salesmanName: currentUser?.name || 'Salesman',
    registrationStatus: data.registrationStatus || 'SUBMITTED',
  });

  const registration = await prisma.customerRegistration.create({
    data: cleanData,
  });

  // Kirim notifikasi ke SPV dan Admin
  try {
    const managers = await prisma.user.findMany({
      where: {
        role: { in: [ROLES.SUPERVISOR, ROLES.ADMIN] },
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
