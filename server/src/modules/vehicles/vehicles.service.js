import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/errors.js';

export const getVehicles = async () => {
  return await prisma.vehicle.findMany({
    where: { deletedAt: null },
    include: { serviceRecords: { orderBy: { serviceDate: 'desc' }, take: 1 } },
    orderBy: { createdAt: 'desc' },
  });
};

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

export const recordMaintenance = async (id, data) => {
  const vehicle = await getVehicleById(id);

  const { serviceType, odometerAtService, cost, serviceDate } = data;
  
  // Determine which field to update based on serviceType
  let updateField = {};
  if (serviceType === 'GANTI_OLI') updateField.lastOilChangeKm = odometerAtService;
  if (serviceType === 'GANTI_FILTER_OLI') updateField.lastOilFilterChangeKm = odometerAtService;
  if (serviceType === 'GANTI_KANVAS_REM') updateField.lastBrakePadChangeKm = odometerAtService;
  
  const [record, updatedVehicle] = await prisma.$transaction([
    prisma.vehicleServiceRecord.create({
      data: {
        vehicleId: id,
        serviceType,
        odometerAtService,
        cost: cost || 0,
        serviceDate: serviceDate ? new Date(serviceDate) : new Date(),
        workshopName: 'Internal/Partner Workshop', // Can be customized later
      },
    }),
    prisma.vehicle.update({
      where: { id },
      data: updateField,
    }),
  ]);
  
  return { record, updatedVehicle };
};
