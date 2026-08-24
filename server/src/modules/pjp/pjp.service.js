import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/errors.js';
import { parsePagination, buildPaginatedResponse, buildDayRange } from '../../utils/pagination.js';
import { PJP_STATUS, PJP_TYPE, ROLES } from '../../utils/constants.js';

/**
 * Menghitung apakah minggu ini ganjil atau genap berdasarkan ISO Week.
 * Mengembalikan 'WEEK_1' untuk ganjil, 'WEEK_2' untuk genap.
 */
const getCurrentWeekType = () => {
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
const ensureTodayPjpForSales = async (userId) => {
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

  if (!template || template.stops.length === 0) return null;

  return await prisma.pjp.create({
    data: {
      userId: sales.id,
      date: today,
      type: PJP_TYPE.SALES,
      status: PJP_STATUS.SCHEDULED,
      stops: {
        create: template.stops.map((ts, idx) => ({
          outletId: ts.outletId,
          sequence: ts.sequence || idx + 1,
          status: 'PENDING',
        })),
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
              users: { select: { id: true, name: true, role: true } }
            }
          }
        } 
      },
      stops: { include: PJP_STOP_INCLUDE, orderBy: { sequence: 'asc' } },
    },
  });
};

const PJP_STOP_INCLUDE = {
  outlet: {
    include: {
      cluster: {
        select: {
          id: true,
          name: true,
          region: true,
          users: { select: { id: true, name: true, role: true } }
        }
      }
    }
  },
  attendances: true,
  routeChanges: true,
};

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
        user: { select: { id: true, name: true, role: true, cluster: { select: { id: true, name: true, region: true } } } },
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

export const getPjpById = async (id, currentUser) => {
  const pjp = await prisma.pjp.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, role: true } },
      stops: { include: PJP_STOP_INCLUDE, orderBy: { sequence: 'asc' } },
    },
  });

  if (!pjp) throw new AppError('PJP tidak ditemukan', 404);

  const isOwner = pjp.userId === currentUser.id;
  const isPrivileged = [ROLES.SUPERVISOR, ROLES.ADMIN, ROLES.MANAJER_OPERASIONAL].includes(currentUser.role);
  if (!isOwner && !isPrivileged) {
    throw new AppError('Anda tidak memiliki akses ke PJP ini', 403);
  }

  return pjp;
};

export const updatePjpStopDirectly = async (pjpId, stopId, updateData) => {
  const stop = await prisma.pjpStop.findFirst({ where: { id: stopId, pjpId } });
  if (!stop) throw new AppError('PjpStop tidak ditemukan', 404);

  return await prisma.pjpStop.update({ where: { id: stopId }, data: updateData });
};

/**
 * Generate PJP hari ini untuk SEMUA sales (idempotent), masing-masing memakai
 * logika clustering per-hari (bukan semua outlet). Dipakai getAllPjps.
 */
const generateTodayPjpsAllSales = async () => {
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

export const generateDailyPjps = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayRange = buildDayRange(yesterday.toISOString());

  let generatedCount = 0;

  // Step 1: Generate PJP for each active Sales user
  const salesUsers = await prisma.user.findMany({
    where: { role: ROLES.SALES, deletedAt: null, clusterId: { not: null } },
  });

  for (const sales of salesUsers) {
    const existingPjp = await prisma.pjp.findFirst({
      where: { userId: sales.id, date: { gte: today } },
    });
    if (existingPjp || !sales.clusterId) continue;

    const clusterOutlets = await prisma.outlet.findMany({
      where: { clusterId: sales.clusterId, deletedAt: null },
      orderBy: { name: 'asc' },
    });

    if (clusterOutlets.length === 0) continue;

    await prisma.pjp.create({
      data: {
        userId: sales.id,
        date: today,
        type: PJP_TYPE.SALES,
        status: PJP_STATUS.SCHEDULED,
        stops: {
          create: clusterOutlets.map((outlet, idx) => ({
            outletId: outlet.id,
            sequence: idx + 1,
            status: 'PENDING',
          })),
        },
      },
    });
    generatedCount++;
  }

  return {
    message: `PJP berhasil di-generate (${generatedCount} rute dibuat)`,
    count: generatedCount,
  };
};
