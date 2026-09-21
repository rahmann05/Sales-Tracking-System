/** getAttendanceHistory - single-responsibility service (extracted from absensi.service.js). */
import { prisma } from '../../../config/prisma.js';
import { parsePagination, buildPaginatedResponse } from '../../../utils/pagination.js';


export const getAttendanceHistory = async (userId, query = {}) => {
  const { skip, take, page, limit } = parsePagination(query);

  const [data, total] = await Promise.all([
    prisma.attendance.findMany({
      where: { userId },
      include: {
        pjpStop: {
          include: {
            outlet: { select: { id: true, name: true, address: true } },
            pjp: { select: { id: true, date: true, type: true } },
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      skip,
      take,
    }),
    prisma.attendance.count({ where: { userId } }),
  ]);

  return buildPaginatedResponse(data, total, page, limit);
};
