import {assertSalesAccess} from '../../../utils/team-scope.js';
/** getRegistrationById - single-responsibility service (extracted from customer-registrations.service.js). */
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';

/**
 * 3. Get Registration By ID
 */
export const getRegistrationById = async (id,currentUser) => {
  const registration = await prisma.customerRegistration.findUnique({
    where: { id },
  });
  if (!registration) throw new AppError('Data registrasi outlet tidak ditemukan', 404);

  await assertSalesAccess(currentUser,registration.salesmanId);
  return registration;
};
