/** createDeliveryRoute - single-responsibility service (extracted from delivery.service.js). */
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { generateRouteCode } from './delivery.helpers.js';

/**
 * Create delivery route with stops
 */
export const createDeliveryRoute = async (data, userId) => {
  const { date, vehicleId, driverId, notes, stops } = data;

  // Verify vehicle exists and is active
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle || !vehicle.isActive) throw new AppError('Kendaraan tidak ditemukan atau tidak aktif', 404);

  // Verify driver exists and has SUPIR role
  const driver = await prisma.user.findUnique({ where: { id: driverId } });
  if (!driver || driver.role !== 'SUPIR') throw new AppError('Supir tidak ditemukan atau role bukan SUPIR', 404);

  // Verify all packing lists exist
  const plIds = stops.map((s) => s.packingListId);
  const packingLists = await prisma.packingList.findMany({
    where: { id: { in: plIds } },
    include: { invoices: true },
  });
  if (packingLists.length !== plIds.length) {
    throw new AppError('Satu atau lebih packing list tidak ditemukan', 404);
  }

  // Calculate totals
  const totalCartons = packingLists.reduce((sum, pl) => sum + pl.totalCartons, 0);
  const totalWeight = packingLists.reduce((sum, pl) => sum + (pl.totalWeight || 0), 0);

  // Check vehicle capacity
  if (totalCartons > vehicle.maxCartons) {
    throw new AppError(
      `Total karton (${totalCartons}) melebihi kapasitas kendaraan (${vehicle.maxCartons})`,
      400
    );
  }

  const code = await generateRouteCode(date);

  const route = await prisma.deliveryRoute.create({
    data: {
      code,
      date: new Date(date),
      vehicleId,
      driverId,
      status: 'DRAFT',
      totalCartons,
      totalWeight: totalWeight || null,
      notes,
      createdById: userId,
      stops: {
        create: stops.map((s) => ({
          packingListId: s.packingListId,
          outletId: s.outletId,
          sequence: s.sequence,
        })),
      },
    },
    include: {
      vehicle: { select: { id: true, code: true, name: true, maxCartons: true } },
      driver: { select: { id: true, name: true, email: true } },
      stops: {
        orderBy: { sequence: 'asc' },
        include: {
          outlet: { select: { id: true, name: true, address: true, latitude: true, longitude: true } },
          packingList: { include: { invoices: true } },
        },
      },
      createdBy: { select: { id: true, name: true } },
    },
  });

  return route;
};
