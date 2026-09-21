/** submitDriverAttendance - single-responsibility service (extracted from delivery.service.js). */
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';

// ═══════════════════════════════════════════════════════════════
// DELIVERY STOP ATTENDANCE (Supir)
// ═══════════════════════════════════════════════════════════════

/**
 * Submit driver attendance at a delivery stop
 * When type=IN: marks arrival
 * When type=OUT: marks completion & auto-ACC all invoices in packing list
 */
export const submitDriverAttendance = async (stopId, data, driverId) => {
  const { type, latitude, longitude, photoUrl, notes } = data;

  const stop = await prisma.deliveryStop.findUnique({
    where: { id: stopId },
    include: {
      deliveryRoute: true,
      packingList: { include: { invoices: true } },
    },
  });

  if (!stop) throw new AppError('Stop pengiriman tidak ditemukan', 404);
  if (stop.deliveryRoute.driverId !== driverId) {
    throw new AppError('Anda bukan supir yang ditugaskan untuk rute ini', 403);
  }

  // Create attendance record
  const attendance = await prisma.deliveryAttendance.create({
    data: {
      deliveryStopId: stopId,
      driverId,
      type,
      latitude,
      longitude,
      photoUrl,
      notes,
    },
  });

  // Update stop based on attendance type
  if (type === 'IN') {
    await prisma.deliveryStop.update({
      where: { id: stopId },
      data: {
        arrivedAt: new Date(),
        latitude,
        longitude,
      },
    });

    // Update route status to IN_TRANSIT if it's still READY
    if (stop.deliveryRoute.status === 'READY') {
      await prisma.deliveryRoute.update({
        where: { id: stop.deliveryRouteId },
        data: { status: 'IN_TRANSIT' },
      });
    }
  }

  return attendance;
};
