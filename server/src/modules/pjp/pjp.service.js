import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/errors.js';
import { parsePagination, buildPaginatedResponse, buildDayRange } from '../../utils/pagination.js';
import { PJP_STATUS, PJP_TYPE, ROLES } from '../../utils/constants.js';
import { buildSalesClusterPlan } from '../clusters/cluster-generator.service.js';

// Pemetaan hari JS (0=Minggu..6=Sabtu) -> key cluster generator (lowercase)
const JS_DAY_TO_KEY = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];

/**
 * Auto-generate PJP untuk SATU sales pada hari ini berdasarkan logika clustering.
 * - Ambil seluruh outlet pada cluster sales.
 * - Bagi outlet ke hari-hari kerja (Senin-Sabtu) via cluster-generator (proximity + quota).
 * - Pilih grup yang sesuai hari ini; buat PJP + PjpStops berurutan (rute terdekat).
 * Mengembalikan PJP lengkap dgn stops, atau null jika hari libur (Minggu) / tidak ada outlet.
 */
const ensureTodayPjpForSales = async (userId) => {
  const now = new Date();
  const dayKey = JS_DAY_TO_KEY[now.getDay()];
  if (dayKey === 'minggu') return null; // Minggu libur — tidak ada PJP

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const sales = await prisma.user.findUnique({ where: { id: userId } });
  if (!sales || sales.role !== ROLES.SALES || !sales.clusterId) return null;

  const clusterOutlets = await prisma.outlet.findMany({
    where: { clusterId: sales.clusterId, deletedAt: null },
    select: { id: true, name: true, latitude: true, longitude: true },
    orderBy: { name: 'asc' },
  });
  if (clusterOutlets.length === 0) return null;

  // Bangun rencana cluster per-hari lalu ambil grup hari ini
  const plan = buildSalesClusterPlan(sales.name, clusterOutlets);
  const todayGroup = plan.find((g) => g.day === dayKey);
  if (!todayGroup || todayGroup.outlets.length === 0) return null;

  return await prisma.pjp.create({
    data: {
      userId: sales.id,
      date: today,
      type: PJP_TYPE.SALES,
      status: PJP_STATUS.SCHEDULED,
      stops: {
        create: todayGroup.outlets.map((outlet, idx) => ({
          outletId: outlet.id,
          sequence: idx + 1,
          status: 'PENDING',
        })),
      },
    },
    include: {
      user: { select: { id: true, name: true, role: true } },
      stops: { include: PJP_STOP_INCLUDE, orderBy: { sequence: 'asc' } },
    },
  });
};

const PJP_STOP_INCLUDE = {
  outlet: true,
  attendances: true,
  orders: {
    include: { items: { include: { product: true } } },
  },
  routeChanges: true,
};

export const getTodayPjp = async (userId) => {
  const today = new Date();
  const dayRange = buildDayRange(today.toISOString());

  let pjp = await prisma.pjp.findFirst({
    where: { userId, date: dayRange },
    include: {
      user: { select: { id: true, name: true, role: true } },
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
  const dayKey = JS_DAY_TO_KEY[now.getDay()];
  if (dayKey === 'minggu') return 0; // Minggu libur

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
