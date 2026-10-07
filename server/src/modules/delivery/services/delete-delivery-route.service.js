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

  const deleted = await prisma.deliveryRoute.deleteMany({where:{id,status:'DRAFT'}});
  if (!deleted.count) throw new AppError('Status rute berubah, muat ulang',409);
  return { message: 'Rute pengiriman berhasil dihapus' };
};
