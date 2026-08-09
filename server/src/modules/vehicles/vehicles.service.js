import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/errors.js';

export const getVehicles = async () => {
  return await prisma.vehicle.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });
};

export const getVehicleById = async (id) => {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
  });
  if (!vehicle || vehicle.deletedAt) {
    throw new AppError('Kendaraan tidak ditemukan', 404);
  }
  return vehicle;
};

export const createVehicle = async (data) => {
  const existing = await prisma.vehicle.findUnique({
    where: { code: data.code },
  });
  if (existing && !existing.deletedAt) {
    throw new AppError('Kode kendaraan sudah digunakan', 400);
  }
  return await prisma.vehicle.create({ data });
};

export const updateVehicle = async (id, data) => {
  const vehicle = await getVehicleById(id);
  return await prisma.vehicle.update({
    where: { id: vehicle.id },
    data,
  });
};

export const deleteVehicle = async (id) => {
  const vehicle = await getVehicleById(id);
  return await prisma.vehicle.update({
    where: { id: vehicle.id },
    data: { deletedAt: new Date(), isActive: false },
  });
};
