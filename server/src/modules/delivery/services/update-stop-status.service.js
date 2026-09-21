/** updateStopStatus - single-responsibility service (extracted from delivery.service.js). */
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';

/**
 * Update delivery stop status (Supir marks delivered/rejected)
 * Auto-ACC invoices when DELIVERED
 */
export const updateStopStatus = async (stopId, data, driverId) => {
  const { status, rejectReason, rejectedCartons, notes, photoUrl } = data;

  const stop = await prisma.deliveryStop.findUnique({
    where: { id: stopId },
    include: {
      deliveryRoute: { include: { stops: true } },
      packingList: { include: { invoices: true } },
    },
  });

  if (!stop) throw new AppError('Stop pengiriman tidak ditemukan', 404);
  if (stop.deliveryRoute.driverId !== driverId) {
    throw new AppError('Anda bukan supir yang ditugaskan untuk rute ini', 403);
  }

  const updateData = {
    status,
    completedAt: new Date(),
    notes,
  };

  if (photoUrl) updateData.photoUrl = photoUrl;

  if (status === 'REJECTED' || status === 'PARTIAL_REJECT') {
    updateData.rejectReason = rejectReason;
    updateData.rejectedCartons = rejectedCartons || 0;
  }

  // Update stop
  const updatedStop = await prisma.deliveryStop.update({
    where: { id: stopId },
    data: updateData,
    include: {
      outlet: { select: { id: true, name: true } },
      packingList: { include: { invoices: true } },
    },
  });

  // Auto-ACC invoices when delivered
  if (status === 'DELIVERED') {
    const invoiceIds = stop.packingList.invoices.map((inv) => inv.id);
    await prisma.invoice.updateMany({
      where: { id: { in: invoiceIds } },
      data: { isDelivered: true, deliveredAt: new Date() },
    });
  }

  // Check if all stops in route are completed → update route status
  const allStops = stop.deliveryRoute.stops;
  const completedStatuses = ['DELIVERED', 'REJECTED', 'PARTIAL_REJECT'];
  const otherStops = allStops.filter((s) => s.id !== stopId);
  const allOtherDone = otherStops.every((s) => completedStatuses.includes(s.status));

  if (allOtherDone && completedStatuses.includes(status)) {
    // All stops done — determine final route status
    const allDelivered = otherStops.every((s) => s.status === 'DELIVERED') && status === 'DELIVERED';
    await prisma.deliveryRoute.update({
      where: { id: stop.deliveryRouteId },
      data: { status: allDelivered ? 'COMPLETED' : 'PARTIAL' },
    });
  }

  return updatedStop;
};
