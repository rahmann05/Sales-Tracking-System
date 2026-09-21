/** deleteVehicle - single-responsibility service (extracted from vehicles.service.js). */
import { prisma } from '../../../config/prisma.js';
import { getVehicleById } from './get-vehicle-by-id.service.js';


export const deleteVehicle = async (id) => {
  const vehicle = await getVehicleById(id);
  return await prisma.vehicle.update({
    where: { id: vehicle.id },
    data: { deletedAt: new Date(), isActive: false },
  });
};
