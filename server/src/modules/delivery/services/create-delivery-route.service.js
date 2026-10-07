import { validateAllocation } from '../../../../../shared/packing.mjs';
import { getDynamicConfig } from '../../config/config.service.js';
import { resolveBusinessCode } from '../../config/services/business-code.service.js';
/** createDeliveryRoute - single-responsibility service (extracted from delivery.service.js). */
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';


/**
 * Create delivery route with stops
 */
export const createDeliveryRoute = async (data, userId) => {
  const { date, vehicleId, driverId, notes, stops } = data;

  const allowRedelivery = await getDynamicConfig('DELIVERY_ALLOW_REDELIVERY',true);
  const allowSplit = await getDynamicConfig('PACKING_ALLOW_SPLIT', true);
  return prisma.$transaction(async tx => {
  // Verify vehicle exists and is active
  const vehicle = await tx.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle || vehicle.deletedAt || !vehicle.isActive || vehicle.condition !== 'AVAILABLE') throw new AppError('Kendaraan tidak ditemukan atau tidak aktif', 404);

  // Verify driver exists and has SUPIR role
  const driver = await tx.user.findUnique({ where: { id: driverId } });
  if (!driver || driver.deletedAt || driver.role !== 'SUPIR') throw new AppError('Supir tidak ditemukan atau role bukan SUPIR', 404);

  // Verify all packing lists exist
  const plIds = stops.map((s) => s.packingListId);
  const packingLists = await tx.packingList.findMany({
    where: { id: { in: plIds } },
    include: { invoices: true, deliveryStops: true },
  });
  if (packingLists.length !== plIds.length) {
    throw new AppError('Satu atau lebih packing list tidak ditemukan', 404);
  }

  if (new Set(plIds).size !== plIds.length) throw new AppError('Packing list tidak boleh dipilih dua kali', 400);
  const allocations = [];
  for (const entry of stops) {
    const packing = packingLists.find(pl => pl.id === entry.packingListId);
    if (!allowRedelivery && packing.deliveryStops.some(s=>s.returnReceivedAt)) throw new AppError('Pengiriman ulang dinonaktifkan admin',409);
    if (packing.outletId !== entry.outletId) throw new AppError('Toko tujuan tidak sesuai packing list', 400);
    try { allocations.push({ ...entry, ...validateAllocation(packing, entry, allowSplit) }); }
    catch (error) { throw new AppError(error.message, 409); }
  }
  if (new Set(stops.map(s => s.sequence)).size !== stops.length) throw new AppError('Urutan toko harus unik', 400);

  // Calculate totals
  const totalCartons = allocations.reduce((sum, a) => sum + a.allocatedCartons, 0);
  const totalWeight = allocations.reduce((sum, a) => sum + a.allocatedWeight, 0);

  // Check vehicle capacity
  if (totalCartons > vehicle.maxCartons) {
    throw new AppError(
      `Total karton (${totalCartons}) melebihi kapasitas kendaraan (${vehicle.maxCartons})`,
      400
    );
  }

  if (vehicle.maxWeightKg && totalWeight > vehicle.maxWeightKg) throw new AppError('Berat muatan melebihi kapasitas kendaraan', 400);

  const code = await resolveBusinessCode('DELIVERY_ROUTE',data.code,{db:tx,date:new Date(date)});

  const route = await tx.deliveryRoute.create({
    data: {
      code,
      date: new Date(date),
      vehicleId,
      driverId,
      status: 'DRAFT',
      totalCartons,
      totalDistanceKm: data.totalDistanceKm,
      fuelConsumedLiters: data.totalDistanceKm != null ? data.totalDistanceKm / vehicle.fuelKmPerLiter : null,
      totalWeight: totalWeight || null,
      notes,
      createdById: userId,
      stops: {
        create: allocations.map((s) => ({
          packingListId: s.packingListId,
          outletId: s.outletId,
          sequence: s.sequence,
          allocatedCartons: s.allocatedCartons, allocatedWeight: s.allocatedWeight, allocatedItems: s.allocatedItems,
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
  }, { isolationLevel: 'Serializable' });
};
