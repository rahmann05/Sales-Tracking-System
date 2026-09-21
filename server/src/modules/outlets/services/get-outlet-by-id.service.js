/** getOutletById - single-responsibility service (extracted from outlets.service.js). */
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';


export const getOutletById = async (id) => {
  const outlet = await prisma.outlet.findUnique({
    where: { id },
    include: { cluster: true },
  });
  if (!outlet || outlet.deletedAt) {
    throw new AppError('Outlet tidak ditemukan', 404);
  }
  return outlet;
};
