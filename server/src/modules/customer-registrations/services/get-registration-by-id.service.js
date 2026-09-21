/** getRegistrationById - single-responsibility service (extracted from customer-registrations.service.js). */
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { validateGooglePlace } from './validate-google-place.service.js';

/**
 * 3. Get Registration By ID
 */
export const getRegistrationById = async (id) => {
  const registration = await prisma.customerRegistration.findUnique({
    where: { id },
  });
  if (!registration) throw new AppError('Data registrasi outlet tidak ditemukan', 404);

  const placeValidation = await validateGooglePlace(
    registration.name,
    registration.address,
    registration.latitude,
    registration.longitude
  );

  return { ...registration, placeValidation };
};
