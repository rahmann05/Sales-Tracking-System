/** getDashboard - single-responsibility service (extracted from delivery.service.js). */
import { prisma } from '../../../config/prisma.js';

// ═══════════════════════════════════════════════════════════════
// DASHBOARD (Kepala Gudang)
// ═══════════════════════════════════════════════════════════════

/**
 * Get delivery dashboard data for today (or specified date)
 */
export const getDashboard = async (query) => {
  const { date } = query;
  const targetDate = date ? new Date(date) : new Date();
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const routes = await prisma.deliveryRoute.findMany({
    where: {
      date: { gte: startOfDay, lte: endOfDay },
    },
    include: {
      vehicle: { select: { id: true, code: true, name: true } },
      driver: { select: { id: true, name: true } },
      stops: {
        orderBy: { sequence: 'asc' },
        include: {
          outlet: { select: { id: true, name: true, latitude: true, longitude: true } },
          packingList: { select: { id: true, code: true, totalCartons: true } },
        },
      },
    },
  });

  // Summary stats
  const totalRoutes = routes.length;
  const totalVehicles = new Set(routes.map((r) => r.vehicleId)).size;
  const totalStops = routes.reduce((sum, r) => sum + r.stops.length, 0);
  const totalCartons = routes.reduce((sum, r) => sum + r.totalCartons, 0);

  const statusCounts = {
    DRAFT: routes.filter((r) => r.status === 'DRAFT').length,
    READY: routes.filter((r) => r.status === 'READY').length,
    IN_TRANSIT: routes.filter((r) => r.status === 'IN_TRANSIT').length,
    COMPLETED: routes.filter((r) => r.status === 'COMPLETED').length,
    PARTIAL: routes.filter((r) => r.status === 'PARTIAL').length,
  };

  const stopStatusCounts = {
    PENDING: 0,
    DELIVERED: 0,
    REJECTED: 0,
    PARTIAL_REJECT: 0,
  };
  routes.forEach((r) => {
    r.stops.forEach((s) => {
      stopStatusCounts[s.status] = (stopStatusCounts[s.status] || 0) + 1;
    });
  });

  return {
    date: targetDate.toISOString().slice(0, 10),
    summary: {
      totalRoutes,
      totalVehicles,
      totalStops,
      totalCartons,
      statusCounts,
      stopStatusCounts,
    },
    routes,
  };
};
