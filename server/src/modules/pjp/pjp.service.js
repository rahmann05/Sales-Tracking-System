import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/errors.js';
import { parsePagination, buildPaginatedResponse, buildDayRange } from '../../utils/pagination.js';
import { PJP_STATUS, PJP_TYPE, ROLES } from '../../utils/constants.js';

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

  const pjp = await prisma.pjp.findFirst({
    where: { userId, date: dayRange },
    include: {
      user: { select: { id: true, name: true, role: true } },
      stops: { include: PJP_STOP_INCLUDE, orderBy: { sequence: 'asc' } },
    },
  });

  return pjp ?? null;
};

export const getAllPjps = async (query = {}) => {
  const { date, userId, type, status } = query;
  const { skip, take, page, limit } = parsePagination(query);

  const where = {};
  if (type) where.type = type;
  if (status) where.status = status;
  if (userId) where.userId = userId;
  if (date) where.date = buildDayRange(date);

  const [data, total] = await Promise.all([
    prisma.pjp.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, role: true } },
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

  // Step 2: Generate PJP for Driver & Helper based on yesterday's approved orders
  const yesterdaySalesPjps = await prisma.pjp.findMany({
    where: { type: PJP_TYPE.SALES, date: yesterdayRange },
    include: {
      stops: { include: { orders: { where: { status: 'APPROVED' } } } },
      user: { include: { subordinates: { where: { deletedAt: null } } } },
    },
  });

  for (const salesPjp of yesterdaySalesPjps) {
    const eligibleStops = salesPjp.stops.filter((stop) => stop.orders.length > 0);
    if (eligibleStops.length === 0) continue;

    for (const partner of salesPjp.user.subordinates) {
      const isDriverOrHelper = partner.role === ROLES.DRIVER || partner.role === ROLES.HELPER;
      if (!isDriverOrHelper) continue;

      const existingPartnerPjp = await prisma.pjp.findFirst({
        where: { userId: partner.id, date: { gte: today } },
      });
      if (existingPartnerPjp) continue;

      await prisma.pjp.create({
        data: {
          userId: partner.id,
          date: today,
          type: partner.role === ROLES.DRIVER ? PJP_TYPE.DRIVER : PJP_TYPE.HELPER,
          status: PJP_STATUS.SCHEDULED,
          sourcePjpId: salesPjp.id,
          stops: {
            create: eligibleStops.map((stop, idx) => ({
              outletId: stop.outletId,
              sequence: idx + 1,
              status: 'PENDING',
            })),
          },
        },
      });
      generatedCount++;
    }
  }

  return {
    message: `PJP berhasil di-generate (${generatedCount} rute dibuat)`,
    count: generatedCount,
  };
};
