/** getOffPjpAttendances - single-responsibility service (extracted from off-pjp.service.js). */
import { prisma } from '../../../config/prisma.js';
import { parsePagination, buildPaginatedResponse, buildDayRange } from '../../../utils/pagination.js';
import { OFF_PJP_STATUS, ROLES, NOTIFICATION_TYPES } from '../../../utils/constants.js';

/**
 * List off-PJP attendances.
 */
export const getOffPjpAttendances = async (currentUser, query = {}) => {
  const { status, userId, date } = query;
  const { skip, take, page, limit } = parsePagination(query);

  const where = {};
  if (status) where.status = status;
  if (userId) where.userId = userId;
  if (date) where.createdAt = buildDayRange(date);

  if (currentUser.role === ROLES.SALES) {
    where.userId = currentUser.id;
  }

  const [data, total] = await Promise.all([
    prisma.offPjpAttendance.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, role: true } },
        outlet: { select: { id: true, name: true, address: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.offPjpAttendance.count({ where }),
  ]);

  return buildPaginatedResponse(data, total, page, limit);
};
