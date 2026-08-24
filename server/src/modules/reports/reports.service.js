import { prisma } from '../../config/prisma.js';
import { buildDateRange } from '../../utils/pagination.js';
import { PJP_STATUS, VISIT_STATUS } from '../../utils/constants.js';

/**
 * Overall dashboard summary: PJP, stops, route changes, registrations.
 * Supports optional date range filter via query.startDate / query.endDate.
 */
export const getDashboardSummary = async (query = {}) => {
  const { startDate, endDate } = query;
  const dateRange = buildDateRange(startDate, endDate);
  const pjpWhere = dateRange ? { date: dateRange } : {};

  const [
    totalPjp,
    completedPjp,
    totalStops,
    visitedStops,
    skippedStops,
    totalRegistrations,
    activeRegistrations,
    pendingRegistrations,
    totalRouteChanges,
  ] = await Promise.all([
    prisma.pjp.count({ where: pjpWhere }),
    prisma.pjp.count({ where: { ...pjpWhere, status: PJP_STATUS.COMPLETED } }),
    prisma.pjpStop.count({ where: { pjp: pjpWhere } }),
    prisma.pjpStop.count({ where: { pjp: pjpWhere, status: VISIT_STATUS.VISITED } }),
    prisma.pjpStop.count({ where: { pjp: pjpWhere, status: VISIT_STATUS.SKIPPED } }),
    prisma.customerRegistration.count({ where: { deletedAt: null } }),
    prisma.customerRegistration.count({ where: { registrationStatus: 'REGISTERED_ACTIVE', deletedAt: null } }),
    prisma.customerRegistration.count({ where: { registrationStatus: { in: ['SUBMITTED', 'SPV_APPROVED', 'OPS_APPROVED'] }, deletedAt: null } }),
    prisma.routeChangeRequest.count(),
  ]);

  return {
    pjp: {
      total: totalPjp,
      completed: completedPjp,
      completionRate: totalPjp > 0 ? ((completedPjp / totalPjp) * 100).toFixed(1) + '%' : '0%',
    },
    stops: {
      total: totalStops,
      visited: visitedStops,
      skipped: skippedStops,
      realizationRate: totalStops > 0 ? ((visitedStops / totalStops) * 100).toFixed(1) + '%' : '0%',
    },
    registrations: {
      total: totalRegistrations,
      active: activeRegistrations,
      pending: pendingRegistrations,
    },
    routeChanges: {
      total: totalRouteChanges,
    },
  };
};

/**
 * Per-Sales performance recap.
 */
export const getSalesReport = async (query = {}) => {
  const { startDate, endDate } = query;
  const dateRange = buildDateRange(startDate, endDate);

  const salesUsers = await prisma.user.findMany({
    where: { role: 'SALES', deletedAt: null },
    select: {
      id: true,
      name: true,
      email: true,
      cluster: { select: { name: true, region: true } },
    },
  });

  const report = await Promise.all(
    salesUsers.map(async (sales) => {
      const pjpFilter = { userId: sales.id, type: 'SALES' };
      if (dateRange) pjpFilter.date = dateRange;

      const [totalPjp, completedPjp, totalStops, visitedStops, registrationsCount] = await Promise.all([
        prisma.pjp.count({ where: pjpFilter }),
        prisma.pjp.count({ where: { ...pjpFilter, status: PJP_STATUS.COMPLETED } }),
        prisma.pjpStop.count({ where: { pjp: pjpFilter } }),
        prisma.pjpStop.count({ where: { pjp: pjpFilter, status: VISIT_STATUS.VISITED } }),
        prisma.customerRegistration.count({ where: { salesmanId: sales.id, deletedAt: null } }),
      ]);

      const realizationRate = totalStops > 0 ? Math.round((visitedStops / totalStops) * 100) : 0;

      return {
        sales: { id: sales.id, name: sales.name, email: sales.email, cluster: sales.cluster },
        pjp: { total: totalPjp, completed: completedPjp },
        visits: {
          totalStops,
          visitedStops,
          realizationRate: `${realizationRate}%`,
        },
        registrations: {
          total: registrationsCount,
        },
      };
    })
  );

  return report;
};

/**
 * Per-Outlet visit recap.
 */
export const getOutletReport = async (query = {}) => {
  const { startDate, endDate, clusterId } = query;
  const dateRange = buildDateRange(startDate, endDate);

  const outletWhere = { deletedAt: null };
  if (clusterId) outletWhere.clusterId = clusterId;

  const outlets = await prisma.outlet.findMany({
    where: outletWhere,
    select: {
      id: true,
      name: true,
      address: true,
      cluster: { select: { name: true, region: true } },
    },
  });

  const report = await Promise.all(
    outlets.map(async (outlet) => {
      const stopWhere = { outletId: outlet.id };
      if (dateRange) stopWhere.pjp = { date: dateRange };

      const [totalVisits, closedReports] = await Promise.all([
        prisma.pjpStop.count({ where: { ...stopWhere, status: VISIT_STATUS.VISITED } }),
        prisma.pjpStop.count({ where: { ...stopWhere, status: VISIT_STATUS.CLOSED_REPORTED } }),
      ]);

      return {
        outlet: { id: outlet.id, name: outlet.name, address: outlet.address, cluster: outlet.cluster },
        visits: totalVisits,
        closedReports,
      };
    })
  );

  return report;
};
