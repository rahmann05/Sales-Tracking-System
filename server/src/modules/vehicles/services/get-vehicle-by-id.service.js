/** getVehicleById - single-responsibility service (extracted from vehicles.service.js). */
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';


export const getVehicleById = async (id) => {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: { serviceRecords: { orderBy: { serviceDate: 'desc' } } },
  });
  if (!vehicle || vehicle.deletedAt) {
    throw new AppError('Kendaraan tidak ditemukan', 404);
  }
  return vehicle;
};
