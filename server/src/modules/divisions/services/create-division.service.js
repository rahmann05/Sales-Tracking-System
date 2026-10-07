/** createDivision - single-responsibility service (extracted from divisions.service.js). */
import { prisma } from '../../../config/prisma.js';
import { resolveBusinessCode } from '../../config/services/business-code.service.js';

// Create a new division (admin only)
export const createDivision = async ({ name, code }) => {
  return prisma.division.create({
    data: {
      name: name.trim().toUpperCase(),
      code: await resolveBusinessCode('DIVISION',code?.trim().toUpperCase(),{optional:true}),
    },
  });
};
