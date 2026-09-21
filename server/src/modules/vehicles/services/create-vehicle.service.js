/** createVehicle - single-responsibility service (extracted from vehicles.service.js). */
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';


export const createVehicle = async (data) => {
  const existing = await prisma.vehicle.findUnique({
    where: { code: data.code },
  });
  if (existing && !existing.deletedAt) {
    throw new AppError('Kode kendaraan sudah digunakan', 400);
  }
  return await prisma.vehicle.create({ data });
};
