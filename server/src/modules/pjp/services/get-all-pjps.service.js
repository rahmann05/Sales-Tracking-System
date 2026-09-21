/** getAllPjps - single-responsibility service (extracted from pjp.service.js). */
import { prisma } from '../../../config/prisma.js';
import { parsePagination, buildPaginatedResponse, buildDayRange } from '../../../utils/pagination.js';
import { PJP_STOP_INCLUDE, generateTodayPjpsAllSales } from './pjp.helpers.js';


export const getAllPjps = async (query = {}) => {
  const { date, userId, type, status } = query;
  const { skip, take, page, limit } = parsePagination(query);

  // Auto-generate PJP hari ini untuk semua sales (idempotent) berdasarkan logika clustering,
  // agar Supervisor/Manager dapat melihat rute hari ini walau sales belum login.
  if (!date) {
    try { await generateTodayPjpsAllSales(); } catch (e) { console.warn('[PJP] Auto-generate notice:', e.message); }
  }

  const where = {};
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
