import { prisma } from '../../config/prisma.js';
import { buildDateRange } from '../../utils/pagination.js';
import { ORDER_STATUS, PJP_STATUS, VISIT_STATUS } from '../../utils/constants.js';

/**
 * Overall dashboard summary: PJP, stops, orders, route changes.
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
    totalOrders,
    approvedOrders,
    pendingOrders,
    approvedOrderValue,
    totalRouteChanges,
  ] = await Promise.all([
    prisma.pjp.count({ where: pjpWhere }),
    prisma.pjp.count({ where: { ...pjpWhere, status: PJP_STATUS.COMPLETED } }),
    prisma.pjpStop.count({ where: { pjp: pjpWhere } }),
    prisma.pjpStop.count({ where: { pjp: pjpWhere, status: VISIT_STATUS.VISITED } }),
    prisma.pjpStop.count({ where: { pjp: pjpWhere, status: VISIT_STATUS.SKIPPED } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: ORDER_STATUS.APPROVED } }),
    prisma.order.count({ where: { status: ORDER_STATUS.PENDING_APPROVAL } }),
    prisma.order.aggregate({
      where: { status: ORDER_STATUS.APPROVED },
      _sum: { totalValue: true },
    }),
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
    },
    orders: {
      total: totalOrders,
      approved: approvedOrders,
      pending: pendingOrders,
      totalApprovedValue: approvedOrderValue._sum.totalValue ?? 0,
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

      const [totalPjp, completedPjp, totalOrders, approvedOrders, approvedOrderValue] = await Promise.all([
        prisma.pjp.count({ where: pjpFilter }),
        prisma.pjp.count({ where: { ...pjpFilter, status: PJP_STATUS.COMPLETED } }),
        prisma.order.count({ where: { createdBy: sales.id } }),
        prisma.order.count({ where: { createdBy: sales.id, status: ORDER_STATUS.APPROVED } }),
        prisma.order.aggregate({
          where: { createdBy: sales.id, status: ORDER_STATUS.APPROVED },
          _sum: { totalValue: true },
        }),
      ]);

      return {
        sales: { id: sales.id, name: sales.name, email: sales.email, cluster: sales.cluster },
        pjp: { total: totalPjp, completed: completedPjp },
        orders: {
          total: totalOrders,
          approved: approvedOrders,
          totalApprovedValue: approvedOrderValue._sum.totalValue ?? 0,
        },
      };
    })
  );

  return report;
};

/**
 * Per-Outlet visit & order recap.
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

      const [totalVisits, totalOrders, approvedOrders, approvedOrderValue, closedReports] = await Promise.all([
        prisma.pjpStop.count({ where: { ...stopWhere, status: VISIT_STATUS.VISITED } }),
        prisma.order.count({ where: { pjpStop: { outletId: outlet.id } } }),
        prisma.order.count({ where: { pjpStop: { outletId: outlet.id }, status: ORDER_STATUS.APPROVED } }),
        prisma.order.aggregate({
          where: { pjpStop: { outletId: outlet.id }, status: ORDER_STATUS.APPROVED },
          _sum: { totalValue: true },
        }),
        prisma.pjpStop.count({ where: { ...stopWhere, status: VISIT_STATUS.CLOSED_REPORTED } }),
      ]);

      return {
        outlet: { id: outlet.id, name: outlet.name, address: outlet.address, cluster: outlet.cluster },
        visits: totalVisits,
        closedReports,
        orders: {
          total: totalOrders,
          approved: approvedOrders,
          totalApprovedValue: approvedOrderValue._sum.totalValue ?? 0,
        },
      };
    })
  );

  return report;
};
