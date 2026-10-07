import { getDynamicConfig } from '../../config/config.service.js';
/** createVehicle - single-responsibility service (extracted from vehicles.service.js). */
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { resolveBusinessCode } from '../../config/services/business-code.service.js';


export const createVehicle = async (data) => {
  const code = await resolveBusinessCode('VEHICLE',data.code);
  const existing = await prisma.vehicle.findUnique({
    where: { code },
  });
  if (existing && !existing.deletedAt) {
    throw new AppError('Kode kendaraan sudah digunakan', 400);
  }
  return await prisma.vehicle.create({ data: { ...data, code, maxCartons: data.maxCartons ?? await getDynamicConfig('DEFAULT_VEHICLE_CAPACITY_CARTONS', 200), fuelPricePerLiter: data.fuelPricePerLiter ?? await getDynamicConfig('DEFAULT_FUEL_PRICE_PER_LITER', 12500) } });
};
