import {teamSalesWhere} from '../../../utils/team-scope.js';
/** getDashboardSummary - single-responsibility service (extracted from reports.service.js). */
import { prisma } from '../../../config/prisma.js';
import { buildDateRange } from '../../../utils/pagination.js';
import { PJP_STATUS, VISIT_STATUS } from '../../../utils/constants.js';

/**
 * Overall dashboard summary: PJP, stops, route changes, registrations.
 * Supports optional date range filter via query.startDate / query.endDate.
 */
export const getDashboardSummary = async (query = {}) => {
  const { startDate, endDate } = query;
  const dateRange = buildDateRange(startDate, endDate);
  const pjpWhere = {type:'SALES',...(dateRange?{date:dateRange}:{})};
  if(query.userId)pjpWhere.userId=query.userId;
  if(query.supervisorId)pjpWhere.user=teamSalesWhere(query.supervisorId);
  const regScope={...(query.userId?{salesmanId:query.userId}:{}),...(query.supervisorId?{salesman:teamSalesWhere(query.supervisorId)}:{}),...(dateRange?{createdAt:dateRange}:{})};

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
    prisma.pjpStop.count({ where: { pjp: pjpWhere, OR:[{attendances:{some:{type:{in:['IN','OUT']}}}},{status:VISIT_STATUS.VISITED}] } }),
    prisma.pjpStop.count({ where: { pjp: pjpWhere, status: VISIT_STATUS.SKIPPED } }),
    prisma.customerRegistration.count({ where: { deletedAt: null, ...regScope } }),
    prisma.customerRegistration.count({ where: { registrationStatus: 'REGISTERED_ACTIVE', deletedAt: null, ...regScope } }),
    prisma.customerRegistration.count({ where: { registrationStatus: { in: ['SUBMITTED', 'SPV_APPROVED'] }, deletedAt: null, ...regScope } }),
    prisma.routeChangeRequest.count({where:{pjp:pjpWhere}}),
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
