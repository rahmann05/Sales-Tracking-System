/** getDrivers - single-responsibility service (extracted from delivery.service.js). */
import { prisma } from '../../../config/prisma.js';

/**
 * Get list of available drivers (role = SUPIR)
 */
export const getDrivers = async () => {
  return prisma.user.findMany({
    where: { role: 'SUPIR', deletedAt: null },
    select: { id: true, name: true, email: true },
    orderBy: { name: 'asc' },
  });
};
