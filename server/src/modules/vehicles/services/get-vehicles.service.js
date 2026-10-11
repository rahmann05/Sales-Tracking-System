/** getVehicles - single-responsibility service (extracted from vehicles.service.js). */
import { prisma } from '../../../config/prisma.js';
import { serviceRecordSummary } from './get-vehicle-by-id.service.js';


export const getVehicles = async () => {
  return await prisma.vehicle.findMany({
    where: { deletedAt: null },
    include: { serviceRecords: { select: serviceRecordSummary, orderBy: { serviceDate: 'desc' }, take: 1 } },
    orderBy: { createdAt: 'desc' },
  });
};
