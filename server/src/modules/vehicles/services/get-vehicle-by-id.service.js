/** getVehicleById - single-responsibility service (extracted from vehicles.service.js). */
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';


export const serviceRecordSummary = { id:true, vehicleId:true, serviceDate:true, workshopName:true, serviceType:true, serviceTypes:true, cost:true, odometerAtService:true, notes:true, requestId:true, policySnapshot:true, workshopLatitude:true, workshopLongitude:true, evidence:true, createdAt:true, updatedAt:true };
export const getVehicleById = async (id) => {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: { serviceRecords: { select: serviceRecordSummary, orderBy: [{ serviceDate: 'desc' },{createdAt:'desc'}], take:50 } },
  });
  if (!vehicle || vehicle.deletedAt) {
    throw new AppError('Kendaraan tidak ditemukan', 404);
  }
  const withReceipt = new Set((await prisma.vehicleServiceRecord.findMany({ where: { id: { in: vehicle.serviceRecords.map(r => r.id) }, receiptPhotoUrl: { not: null } }, select: { id: true } })).map(r => r.id));
  return { ...vehicle, serviceRecords: vehicle.serviceRecords.map(r => ({ ...r, hasReceipt: withReceipt.has(r.id) })) };
};
