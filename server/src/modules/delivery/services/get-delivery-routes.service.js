/** getDeliveryRoutes - single-responsibility service (extracted from delivery.service.js). */
import { prisma } from '../../../config/prisma.js';

/**
 * List delivery routes with filters
 */
export const getDeliveryRoutes = async (query, userId, userRole) => {
  const { page = 1, limit = 20, date, status, driverId, vehicleId } = query;
  const skip = (page - 1) * limit;

  const where = {};

  // Supir only sees their own routes
  if (userRole === 'SUPIR') {
    where.driverId = userId;
  } else {
    if (driverId) where.driverId = driverId;
  }

  if (date) {
    const d = new Date(date);
    const nextDay = new Date(d);
    nextDay.setDate(nextDay.getDate() + 1);
    where.date = { gte: d, lt: nextDay };
  }
  if (status) where.status = status;
  if (vehicleId) where.vehicleId = vehicleId;

  const [items, total] = await Promise.all([
    prisma.deliveryRoute.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { date: 'desc' },
      include: {
        vehicle: { select: { id: true, code: true, name: true } },
        driver: { select: { id: true, name: true } },
        stops: {
          orderBy: { sequence: 'asc' },
          include: {
            outlet: { select: { id: true, name: true, address: true, latitude: true, longitude: true } },
            packingList: { select: { id: true, code: true, totalCartons: true } },
          },
        },
        createdBy: { select: { id: true, name: true } },
      },
    }),
    prisma.deliveryRoute.count({ where }),
  ]);

  return { items, total, page: parseInt(page), limit: parseInt(limit) };
};
