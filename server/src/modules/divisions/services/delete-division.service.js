/** deleteDivision - single-responsibility service (extracted from divisions.service.js). */
import { prisma } from '../../../config/prisma.js';

// Delete division (soft delete via isActive = false)
export const deleteDivision = async (id) => {
  return prisma.division.update({ where: { id }, data: { isActive: false } });
};
