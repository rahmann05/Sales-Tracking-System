/** deletePackingList - single-responsibility service (extracted from delivery.service.js). */
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';

/**
 * Delete packing list (only if not assigned to a route)
 */
export const deletePackingList = async (id) => {
  const pl = await prisma.packingList.findUnique({
    where: { id },
    include: { deliveryStops: true },
  });
  if (!pl) throw new AppError('Packing list tidak ditemukan', 404);
  if (pl.deliveryStops.length > 0) {
    throw new AppError('Packing list sudah ditetapkan ke rute pengiriman, tidak bisa dihapus', 400);
  }

  await prisma.packingList.delete({ where: { id } });
  return { message: 'Packing list berhasil dihapus' };
};
