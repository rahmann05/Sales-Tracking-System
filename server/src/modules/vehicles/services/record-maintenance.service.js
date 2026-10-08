import {AppError} from '../../../utils/errors.js';
/** recordMaintenance - single-responsibility service (extracted from vehicles.service.js). */
import { prisma } from '../../../config/prisma.js';
import { getVehicleById } from './get-vehicle-by-id.service.js';


export const recordMaintenance = async (id, data) => {
  const vehicle = await getVehicleById(id);

  const { serviceType, odometerAtService, cost, serviceDate } = data;
  
  // Determine which field to update based on serviceType
  if(!Number.isFinite(odometerAtService)||odometerAtService<0)throw new AppError('Odometer tidak valid',400);
  if(!['GANTI_OLI','GANTI_FILTER_OLI','GANTI_KANVAS_REM','LAINNYA'].includes(serviceType))throw new AppError('Jenis servis tidak valid',400);
  const updateField={totalKm:Math.max(vehicle.totalKm,odometerAtService)};
  if (serviceType === 'GANTI_OLI') updateField.lastOilChangeKm = Math.max(vehicle.lastOilChangeKm,odometerAtService);
  if (serviceType === 'GANTI_FILTER_OLI') updateField.lastOilFilterChangeKm = Math.max(vehicle.lastOilFilterChangeKm,odometerAtService);
  if (serviceType === 'GANTI_KANVAS_REM') updateField.lastBrakePadChangeKm = Math.max(vehicle.lastBrakePadChangeKm,odometerAtService);
  
  const [record, updatedVehicle] = await prisma.$transaction([
    prisma.vehicleServiceRecord.create({
      data: {
        vehicleId: id,
        serviceType,
        odometerAtService,
        cost: cost || 0,
        serviceDate: serviceDate ? new Date(serviceDate) : new Date(),
        workshopName: data.workshopName?.trim() || 'Internal',
        notes: data.notes?.trim() || null,
      },
    }),
    prisma.vehicle.update({
      where: { id },
      data: updateField,
    }),
  ]);
  
  return { record, updatedVehicle };
};
