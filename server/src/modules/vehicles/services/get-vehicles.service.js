/** getVehicles - single-responsibility service (extracted from vehicles.service.js). */
import { prisma } from '../../../config/prisma.js';


export const getVehicles = async () => {
  return await prisma.vehicle.findMany({
    where: { deletedAt: null },
    include: { serviceRecords: { orderBy: { serviceDate: 'desc' }, take: 1 } },
    orderBy: { createdAt: 'desc' },
  });
};
