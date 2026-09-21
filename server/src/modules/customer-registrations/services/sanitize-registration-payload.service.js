/** sanitizeRegistrationPayload - single-responsibility service (extracted from customer-registrations.service.js). */
import { Prisma } from '@prisma/client';

/**
 * Filter out any fields that are not in the Prisma CustomerRegistration datamodel
 */
export const sanitizeRegistrationPayload = (raw = {}) => {
  const allowed = Prisma?.CustomerRegistrationScalarFieldEnum
    ? Object.keys(Prisma.CustomerRegistrationScalarFieldEnum)
    : [];

  const clean = {};
  for (const [key, val] of Object.entries(raw)) {
    if (val !== undefined && (allowed.length === 0 || allowed.includes(key))) {
      clean[key] = val;
    }
  }
  return clean;
};
