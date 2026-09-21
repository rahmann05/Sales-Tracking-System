/** getDivisions - single-responsibility service (extracted from divisions.service.js). */
import { prisma } from '../../../config/prisma.js';

// Get all active divisions
export const getDivisions = async ({ includeInactive = false } = {}) => {
  const where = includeInactive ? {} : { isActive: true };
  return prisma.division.findMany({
    where,
    orderBy: { name: 'asc' },
  });
};
