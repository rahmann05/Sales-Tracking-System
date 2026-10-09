import { teamSalesWhere } from '../../../utils/team-scope.js';
/** getAllPjps - single-responsibility service (extracted from pjp.service.js). */
import { prisma } from '../../../config/prisma.js';
import { parsePagination, buildPaginatedResponse, buildDayRange } from '../../../utils/pagination.js';
import { PJP_STOP_INCLUDE } from './pjp.helpers.js';


export const getAllPjps = async (query = {}) => {
  const { date, userId, type, status } = query;
  const { skip, take, page, limit } = parsePagination(query);

  const where = {};
  if (query.supervisorId) where.user = teamSalesWhere(query.supervisorId);
  if (type) where.type = type;
  if (status) where.status = status;
  if (userId) where.userId = userId;
  if (date) where.date = buildDayRange(date);

  const [data, total] = await Promise.all([
    prisma.pjp.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, role: true, cluster: { select: { id: true, name: true, region: true, supervisor: { select: { id: true, name: true } } } } } },
        stops: { include: PJP_STOP_INCLUDE, orderBy: { sequence: 'asc' } },
        _count: { select: { stops: true } },
      },
      orderBy: { date: 'desc' },
      skip,
      take,
    }),
    prisma.pjp.count({ where }),
  ]);

  return buildPaginatedResponse(data, total, page, limit);
};
