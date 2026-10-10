import {teamSalesWhere} from '../../../utils/team-scope.js';
/** getOffPjpAttendances - single-responsibility service (extracted from off-pjp.service.js). */
import { prisma } from '../../../config/prisma.js';
import { parsePagination, buildPaginatedResponse, buildDayRange } from '../../../utils/pagination.js';
import { ROLES } from "../../../utils/constants.js";
import {AppError} from '../../../utils/errors.js';
import {canReviewVisit} from '../../../../../shared/visit-review-permissions.mjs';

/**
 * List off-PJP attendances.
 */
export const getOffPjpAttendances = async (currentUser, query = {}) => {
  if(!currentUser||currentUser.deletedAt||!['ADMIN','SUPERVISOR','SALES'].includes(currentUser.role))throw new AppError('Riwayat luar PJP hanya tersedia untuk Sales, Supervisor tim atau Admin.',403);
  const { status, userId, date } = query;
  const { skip, take, page, limit } = parsePagination(query);

  const where = {};
  if(currentUser.role==='SUPERVISOR')where.user=teamSalesWhere(currentUser.id);
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

  return buildPaginatedResponse(data.map(record=>({...record,canDecide:record.status==='PENDING'&&canReviewVisit(currentUser,'OFF_PJP',record.userId)})), total, page, limit);
};
