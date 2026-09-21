/** getTodayPjp - single-responsibility service (extracted from pjp.service.js). */
import { prisma } from '../../../config/prisma.js';
import { parsePagination, buildPaginatedResponse, buildDayRange } from '../../../utils/pagination.js';
import { ensureTodayPjpForSales, PJP_STOP_INCLUDE } from './pjp.helpers.js';


export const getTodayPjp = async (userId) => {
  const today = new Date();
  const dayRange = buildDayRange(today.toISOString());

  let pjp = await prisma.pjp.findFirst({
    where: { userId, date: dayRange },
    include: {
      user: { 
        select: { 
          id: true, 
          name: true, 
          role: true,
          cluster: {
            select: {
              id: true,
              name: true,
              region: true,
              supervisor: { select: { id: true, name: true } },
              users: { select: { id: true, name: true, role: true } }
            }
          }
        } 
      },
      stops: { include: PJP_STOP_INCLUDE, orderBy: { sequence: 'asc' } },
    },
  });

  // Jika belum ada PJP hari ini, auto-generate dari logika clustering (bukan semua outlet)
  if (!pjp) {
    try {
      pjp = await ensureTodayPjpForSales(userId);
    } catch (e) {
      console.warn('[PJP] Auto-generate today PJP notice:', e.message);
    }
  }

  return pjp ?? null;
};
