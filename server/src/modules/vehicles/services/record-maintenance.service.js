/** recordMaintenance - single-responsibility service (extracted from vehicles.service.js). */
import { prisma } from '../../../config/prisma.js';
import { getVehicleById } from './get-vehicle-by-id.service.js';


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
