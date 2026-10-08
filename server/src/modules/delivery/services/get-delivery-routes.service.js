import {wibDayRange} from '../../../../../shared/visit-metrics.mjs';
/** getDeliveryRoutes - single-responsibility service (extracted from delivery.service.js). */
import { prisma } from '../../../config/prisma.js';
import {parsePagination} from '../../../utils/pagination.js';

/**
 * List delivery routes with filters
 */
export const getDeliveryRoutes = async (query, userId, userRole) => {
  const { date, status, driverId, vehicleId } = query;
  const {page,limit,skip}=parsePagination(query);

  const where = {cancelledAt:null};

  // Supir only sees their own routes
  if (userRole === 'SUPIR') {
    where.driverId = userId;
  } else {
    if (driverId) where.driverId = driverId;
  }

  if(query.open==='true')where.closedAt=null;
  else if(date)where.OR=[{date:wibDayRange(date)},{closedAt:null,cancelledAt:null}];
  if (status) where.status = status;
  if (vehicleId) where.vehicleId = vehicleId;

  const [items, total] = await Promise.all([
    prisma.deliveryRoute.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { date: 'desc' },
      include: {
        vehicle: true,
        driver: { select: { id: true, name: true } },
        stops: {
          orderBy: { sequence: 'asc' },
          include: {
            outlet: { select: { id: true, name: true, address: true, latitude: true, longitude: true } },
            packingList: { include: { invoices:true } },
            attendances: {orderBy:{timestamp:'asc'}},
          },
        },
        createdBy: { select: { id: true, name: true } },
      },
    }),
    prisma.deliveryRoute.count({ where }),
  ]);

  return { items, total, page: parseInt(page), limit: parseInt(limit), pagination:{totalPages:Math.ceil(total/Number(limit)),hasNextPage:Number(page)*Number(limit)<total} };
};
