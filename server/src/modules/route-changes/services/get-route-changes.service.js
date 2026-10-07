import {teamSalesWhere} from '../../../utils/team-scope.js';
import {parsePagination} from '../../../utils/pagination.js';
/** getRouteChanges - single-responsibility service (extracted from route-change.service.js). */
import { prisma } from '../../../config/prisma.js';


export const getRouteChanges = async (query = {}, user = null) => {
  const { status, type, page = 1, limit = 20 } = query;
  const where = {};
  if(user?.role==='SUPERVISOR')where.reportedByUser=teamSalesWhere(user.id);
  if (status) where.status = status;
  if (type) where.type = type;
  // Sales users may only see the incidents they reported themselves
  if (user?.role === 'SALES') where.reportedBy = user.id;

  const {skip,take}=parsePagination(query);

  const [data, total] = await Promise.all([
    prisma.routeChangeRequest.findMany({
      where,
      include: {
        pjpStop: { include: { outlet: true } },
        replacementOutlet: true,
        reportedByUser: { select: { id: true, name: true, role: true } },
        handledByUser: { select: { id: true, name: true, role: true } },
        approvedByUser: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.routeChangeRequest.count({ where }),
  ]);

  return { data, pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / take) } };
};
