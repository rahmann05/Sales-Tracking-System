/** getDivisionById - single-responsibility service (extracted from divisions.service.js). */
import { prisma } from '../../../config/prisma.js';

// Get division by id
export const getDivisionById = async (id) => {
  return prisma.division.findUnique({ where: { id } });
};
