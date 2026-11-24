import { wibDateKey, wibDayRange } from '../../../../../shared/visit-metrics.mjs';
import { workingDays } from '../../../../../shared/working-calendar.mjs';
import { selectFallbackClusterOutlets } from '../../../../../shared/pjp-planning.mjs';
import { prisma } from '../../../config/prisma.js';
import { getDynamicConfig } from '../../config/config.service.js';
import { effectivePolicy } from '../../config/services/policy-resolver.service.js';
import { withPolicy } from '../../config/services/policy-context.service.js';
import { resolveBusinessCode, getCodePolicy } from '../../config/services/business-code.service.js';
import {
  captureReportAssignment,
  REPORT_USER_SELECT,
} from '../../reports/services/report-assignment.service.js';
import { planningCalendar } from './planning-calendar.service.js';

export const getIsoWeekNumber = (date = new Date()) => {
  const d = new Date(`${wibDateKey(date)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  return Math.ceil(((d - new Date(Date.UTC(d.getUTCFullYear(), 0, 1))) / 86400000 + 1) / 7);
};
export const getCurrentWeekType = (date = new Date(), mode = 'ISO_PARITY') => {
  const week =
    mode === 'MONTH_CYCLE'
      ? Math.ceil(Number(wibDateKey(date).slice(8)) / 7)
      : getIsoWeekNumber(date);
  return week % 2 ? 'WEEK_1' : 'WEEK_2';
};
export const PJP_STOP_INCLUDE = {
  validationTask: {
    select: {
      id: true,
      status: true,
      schedule: true,
      reviewId: true,
      review: { select: { status: true } },
    },
  },
  outlet: {
    include: {
      cluster: {
        select: {
          id: true,
          name: true,
          region: true,
          users: { select: { id: true, name: true, role: true } },
          supervisor: { select: { id: true, name: true } },
        },
      },
    },
  },
  attendances: true,
  routeChanges: true,
  orders: { where: { deletedAt: null }, include: { items: true } },
};
// Match planner publication: lock the team before its sales/date agenda.
export const lockSalesPjpForDate = async (tx, userId, key) => {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`team:${userId}`}))`;
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`pjp:${userId}:${key}`}))`;
};
export const ensureSalesPjpForDate = async (tx, userId, now = new Date(), manualCode) => {
  const key = wibDateKey(now);
  const dayOfWeek = new Date(`${key}T12:00:00Z`).getUTCDay();
  const [days, mode, fallback] = await Promise.all([
    getDynamicConfig('PJP_WORKING_DAYS', '1,2,3,4,5,6'),
    getDynamicConfig('PJP_WEEK_MODE', 'ISO_PARITY'),
    getDynamicConfig('PJP_FALLBACK_TO_CLUSTER', true),
  ]);
  // All generators serialize on the same sales/day key, without altering historical plans.
  await lockSalesPjpForDate(tx, userId, key);
  const existing = await tx.pjp.findFirst({
    where: { userId, date: wibDayRange(now), type: 'SALES' },
    include: { stops: { include: PJP_STOP_INCLUDE, orderBy: { sequence: 'asc' } } },
  });
  if (existing) return existing;
  if ((await getDynamicConfig('FEATURE_PJP_MODE', 'ACTIVE')) !== 'ACTIVE') return null;
  if ((await getCodePolicy('PJP')).mode === 'MANUAL' && !manualCode?.trim()) return null;
  const calendar = await planningCalendar(tx, key, key);
  if (
    calendar.missing.length ||
    !(calendar.workingDates
      ? calendar.workingDates.includes(key)
      : workingDays(days).includes(dayOfWeek))
  )
    return null;
  const sales = await tx.user.findUnique({
    where: { id: userId },
    select: { ...REPORT_USER_SELECT, deletedAt: true },
  });
  if (!sales || sales.deletedAt || sales.role !== 'SALES' || !sales.supervisorId) return null;
  const templates = await tx.pjpTemplate.findMany({
    where: { userId, dayOfWeek, weekType: { in: [getCurrentWeekType(now, mode), 'ALL'] } },
    include: {
      stops: {
        orderBy: { sequence: 'asc' },
        include: {
          outlet: { include: { cluster: { select: { supervisorId: true, deletedAt: true } } } },
        },
      },
    },
  });
  const template = templates.find((t) => t.weekType !== 'ALL') || templates[0];
  let outletIds;
  let reportSales = sales;
  if (template)
    outletIds = template.stops
      .filter(
        (s) =>
          !s.outlet.deletedAt &&
          !s.outlet.cluster.deletedAt &&
          (!sales.supervisorId || s.outlet.cluster.supervisorId === sales.supervisorId)
      )
      .map((s) => s.outletId);
  else {
    if (!fallback) return null;
    const candidateClusters = await tx.cluster.findMany({
      where: {
        deletedAt: null,
        ...(sales.supervisorId ? { supervisorId: sales.supervisorId } : {}),
        OR: [{ assignedSalesId: userId }, ...(sales.clusterId ? [{ id: sales.clusterId }] : [])],
      },
      select: {
        id: true,
        name: true,
        region: true,
        routes: {
          where: { isActive: true },
          orderBy: { updatedAt: 'desc' },
          take: 1,
          select: { outletOrder: true },
        },
        outlets: {
          where: { deletedAt: null },
          orderBy: { name: 'asc' },
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    const resolved = selectFallbackClusterOutlets(candidateClusters, sales.clusterId, key);
    outletIds = resolved.outletIds;
    if (!sales.clusterId && resolved.primaryCluster) {
      reportSales = {
        ...sales,
        clusterId: resolved.primaryCluster.id,
        cluster: {
          id: resolved.primaryCluster.id,
          name: resolved.primaryCluster.name,
          region: resolved.primaryCluster.region,
        },
      };
    }
  }
  if (!outletIds.length) return null;
  return tx.pjp.create({
    data: {
      ...captureReportAssignment(reportSales, 'PJP_PLAN', now),
      code: await resolveBusinessCode('PJP', manualCode, { db: tx, date: now }),
      userId,
      date: wibDayRange(now).gte,
      type: 'SALES',
      status: 'SCHEDULED',
      stops: {
        create: [...new Set(outletIds)].map((outletId, i) => ({
          outletId,
          sequence: i + 1,
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
          cluster: { include: { supervisor: { select: { id: true, name: true } } } },
        },
      },
      stops: { include: PJP_STOP_INCLUDE, orderBy: { sequence: 'asc' } },
    },
  });
};
export const ensureTodayPjpForSales = (userId, manualCode) =>
  prisma.$transaction((tx) => ensureSalesPjpForDate(tx, userId, new Date(), manualCode));
export const generateTodayPjpsAllSales = async (codes = {}) => {
  const sales = await prisma.user.findMany({
    where: { role: 'SALES', deletedAt: null },
    select: { id: true, role: true, supervisorId: true },
  });
  let count = 0;
  for (const user of sales) {
    const before = await prisma.pjp.findFirst({
      where: { userId: user.id, type: 'SALES', date: wibDayRange() },
      select: { id: true },
    });
    if (
      !before &&
      (await withPolicy(await effectivePolicy(user), () =>
        ensureTodayPjpForSales(user.id, codes[user.id])
      ))
    )
      count++;
  }
  return count;
};
