/** getSalesReport - single-responsibility service (extracted from reports.service.js). */
import { prisma } from '../../../config/prisma.js';
import { buildDateRange } from '../../../utils/pagination.js';
import { PJP_STATUS, VISIT_STATUS } from '../../../utils/constants.js';

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
