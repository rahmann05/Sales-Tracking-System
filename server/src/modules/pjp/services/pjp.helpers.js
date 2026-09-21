/** Shared helpers for pjp services (internal). */
import { prisma } from '../../../config/prisma.js';
import { PJP_STATUS, PJP_TYPE, ROLES } from '../../../utils/constants.js';

/**
 * Menghitung apakah minggu ini ganjil atau genap berdasarkan ISO Week.
 * Mengembalikan 'WEEK_1' untuk ganjil, 'WEEK_2' untuk genap.
 */
export const getCurrentWeekType = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now - start + (start.getTimezoneOffset() - now.getTimezoneOffset()) * 60000;
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.floor(diff / oneDay);
  const weekNumber = Math.ceil((day + start.getDay() + 1) / 7);
  return weekNumber % 2 !== 0 ? 'WEEK_1' : 'WEEK_2';
};

/**
 * Auto-generate PJP untuk SATU sales pada hari ini berdasarkan PjpTemplate.
 */
export const ensureTodayPjpForSales = async (userId) => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  if (dayOfWeek === 0) return null; // Minggu libur

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const sales = await prisma.user.findUnique({ where: { id: userId } });
  if (!sales || sales.role !== ROLES.SALES || !sales.clusterId) return null;

  const currentWeekType = getCurrentWeekType();

  // Cari template untuk sales ini, hari ini, dan tipe minggu ini (atau ALL)
  const template = await prisma.pjpTemplate.findFirst({
    where: {
      userId,
      dayOfWeek,
      OR: [
        { weekType: currentWeekType },
        { weekType: 'ALL' }
      ]
    },
    include: {
      stops: {
        orderBy: { sequence: 'asc' }
      }
    }
  });

  let stopsToCreate = [];
  if (template && template.stops.length > 0) {
    stopsToCreate = template.stops.map((ts, idx) => ({
      outletId: ts.outletId,
      sequence: ts.sequence || idx + 1,
      status: 'PENDING',
    }));
  } else {
    // Fallback ke cluster outlets jika belum ada template manual
    const activeRoute = await prisma.clusterRoute.findFirst({
      where: { clusterId: sales.clusterId, isActive: true },
    });
    let clusterOutlets = [];
    if (activeRoute && Array.isArray(activeRoute.outletOrder) && activeRoute.outletOrder.length > 0) {
      const orderedIds = activeRoute.outletOrder.map(item => item.id).filter(Boolean);
      const fetched = await prisma.outlet.findMany({
        where: { id: { in: orderedIds }, deletedAt: null },
      });
      const outletMap = new Map(fetched.map(o => [o.id, o]));
      clusterOutlets = orderedIds.map(id => outletMap.get(id)).filter(Boolean);
    }
    if (clusterOutlets.length === 0) {
      clusterOutlets = await prisma.outlet.findMany({
        where: { clusterId: sales.clusterId, deletedAt: null },
        orderBy: { name: 'asc' },
      });
    }
    if (clusterOutlets.length === 0) return null;
    stopsToCreate = clusterOutlets.map((o, idx) => ({
      outletId: o.id,
      sequence: idx + 1,
      status: 'PENDING',
    }));
  }

  return await prisma.pjp.create({
    data: {
      userId: sales.id,
      date: today,
      type: PJP_TYPE.SALES,
      status: PJP_STATUS.SCHEDULED,
      stops: {
        create: stopsToCreate,
      },
    },
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
};


export const PJP_STOP_INCLUDE = {
  outlet: {
    include: {
      cluster: {
        select: {
          id: true,
          name: true,
          region: true,
          users: { select: { id: true, name: true, role: true } },
          supervisor: { select: { id: true, name: true } },
        }
      }
    }
  },
  attendances: true,
  routeChanges: true,
};

/**
 * Generate PJP hari ini untuk SEMUA sales (idempotent), masing-masing memakai
 * logika clustering per-hari (bukan semua outlet). Dipakai getAllPjps.
 */
export const generateTodayPjpsAllSales = async () => {
  const now = new Date();
  if (now.getDay() === 0) return 0; // Minggu libur (0 = Sunday)

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const salesUsers = await prisma.user.findMany({
    where: { role: ROLES.SALES, deletedAt: null, clusterId: { not: null } },
  });

  let count = 0;
  for (const sales of salesUsers) {
    const existing = await prisma.pjp.findFirst({ where: { userId: sales.id, date: { gte: today } } });
    if (existing) continue;
    const created = await ensureTodayPjpForSales(sales.id);
    if (created) count++;
  }
  return count;
};
