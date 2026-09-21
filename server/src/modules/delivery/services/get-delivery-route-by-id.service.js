/** getDeliveryRouteById - single-responsibility service (extracted from delivery.service.js). */
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';

/**
 * Get single delivery route with full details
 */
export const getDeliveryRouteById = async (id) => {
  const route = await prisma.deliveryRoute.findUnique({
    where: { id },
    include: {
      vehicle: true,
      driver: { select: { id: true, name: true, email: true } },
      stops: {
        orderBy: { sequence: 'asc' },
        include: {
          outlet: { select: { id: true, name: true, address: true, latitude: true, longitude: true, phone: true } },
          packingList: { include: { invoices: true } },
          attendances: { orderBy: { timestamp: 'asc' } },
        },
      },
      createdBy: { select: { id: true, name: true } },
    },
  });
  if (!route) throw new AppError('Rute pengiriman tidak ditemukan', 404);
  return route;
};
