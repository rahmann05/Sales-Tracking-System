/** deleteDeliveryRoute - single-responsibility service (extracted from delivery.service.js). */
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';

/**
 * Delete delivery route (only if DRAFT)
 */
export const deleteDeliveryRoute = async (id) => {
  const route = await prisma.deliveryRoute.findUnique({ where: { id } });
  if (!route) throw new AppError('Rute pengiriman tidak ditemukan', 404);
  if (route.status !== 'DRAFT') {
    throw new AppError('Hanya rute berstatus DRAFT yang bisa dihapus', 400);
  }

  await prisma.deliveryRoute.delete({ where: { id } });
  return { message: 'Rute pengiriman berhasil dihapus' };
};
