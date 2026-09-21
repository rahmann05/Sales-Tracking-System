/** updateRouteStatus - single-responsibility service (extracted from delivery.service.js). */
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { resolveRoadRoute } from '../../routing/routing.service.js';

/**
 * Update delivery route status
 */
export const updateRouteStatus = async (id, status) => {
  const route = await prisma.deliveryRoute.findUnique({ 
    where: { id },
    include: { stops: { include: { outlet: true }, orderBy: { sequence: 'asc' } } }
  });
  if (!route) throw new AppError('Rute pengiriman tidak ditemukan', 404);

  let updateData = { status };
  let distanceKm = route.totalDistanceKm || 0;
  let fuelLiters = route.fuelConsumedLiters || 0;

  // Calculate distance when starting or completing if not yet calculated
  if ((status === 'IN_TRANSIT' || status === 'COMPLETED') && !route.totalDistanceKm) {
    try {
      // Waypoints: Default warehouse (Padalarang) -> Stops -> Default warehouse
      const waypoints = [
        { lat: -6.8582, lng: 107.5123 }, // Gudang origin
        ...route.stops.map(s => ({ lat: s.outlet.latitude, lng: s.outlet.longitude })),
        { lat: -6.8582, lng: 107.5123 }  // Return to Gudang
      ];
      
      const { legs } = await resolveRoadRoute(waypoints);
      distanceKm = legs.reduce((sum, leg) => sum + (leg.distanceKm || 0), 0);
      fuelLiters = distanceKm / 10; // 10km / liter
      
      updateData.totalDistanceKm = distanceKm;
      updateData.fuelConsumedLiters = fuelLiters;
    } catch (err) {
      console.warn('Gagal menghitung jarak GMap API:', err.message);
    }
  }

  // Use transaction if we need to update vehicle totalKm
  if (status === 'COMPLETED' && route.status !== 'COMPLETED') {
    const finalDistance = updateData.totalDistanceKm ?? route.totalDistanceKm ?? 0;
    
    const [updatedRoute] = await prisma.$transaction([
      prisma.deliveryRoute.update({
        where: { id },
        data: updateData,
        include: {
          vehicle: { select: { id: true, code: true, name: true } },
          driver: { select: { id: true, name: true } },
        },
      }),
      prisma.vehicle.update({
        where: { id: route.vehicleId },
        data: { totalKm: { increment: finalDistance } }
      })
    ]);
    return updatedRoute;
  }

  const updated = await prisma.deliveryRoute.update({
    where: { id },
    data: updateData,
    include: {
      vehicle: { select: { id: true, code: true, name: true } },
      driver: { select: { id: true, name: true } },
    },
  });
  return updated;
};
