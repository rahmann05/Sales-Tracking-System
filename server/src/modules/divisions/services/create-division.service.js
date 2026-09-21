/** createDivision - single-responsibility service (extracted from divisions.service.js). */
import { prisma } from '../../../config/prisma.js';

// Create a new division (admin only)
export const createDivision = async ({ name, code }) => {
  return prisma.division.create({
    data: {
      name: name.trim().toUpperCase(),
      code: code ? code.trim().toUpperCase() : null,
    },
  });
};
