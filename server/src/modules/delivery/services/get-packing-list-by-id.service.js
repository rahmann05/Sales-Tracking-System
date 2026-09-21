/** getPackingListById - single-responsibility service (extracted from delivery.service.js). */
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';

/**
 * Get single packing list with details
 */
export const getPackingListById = async (id) => {
  const pl = await prisma.packingList.findUnique({
    where: { id },
    include: {
      outlet: { select: { id: true, name: true, address: true, outletCode: true, latitude: true, longitude: true } },
      invoices: true,
      createdBy: { select: { id: true, name: true } },
      deliveryStops: {
        include: {
          deliveryRoute: { select: { id: true, code: true, date: true, status: true } },
        },
      },
    },
  });
  if (!pl) throw new AppError('Packing list tidak ditemukan', 404);
  return pl;
};
