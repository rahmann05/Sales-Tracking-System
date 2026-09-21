/** getOutletReport - single-responsibility service (extracted from reports.service.js). */
import { prisma } from '../../../config/prisma.js';
import { buildDateRange } from '../../../utils/pagination.js';
import { PJP_STATUS, VISIT_STATUS } from '../../../utils/constants.js';

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
