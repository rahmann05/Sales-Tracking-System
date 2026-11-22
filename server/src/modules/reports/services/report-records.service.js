import { prisma } from '../../../config/prisma.js';
import { countsAsPlannedVisit, wibDateKey } from '../../../../../shared/visit-metrics.mjs';
import { REPORT_USER_SELECT, reportScopeWhere } from './report-assignment.service.js';

function indexRows(rows, dateField, byDay) {
  const grouped = new Map();
  for (const row of rows) {
    const userId = row.userId || row.user?.id;
    const key = byDay ? `${userId}:${wibDateKey(row[dateField])}` : userId;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(row);
  }
  return grouped;
}

const ATTENDANCE_REPORT_SELECT = {
  id: true,
  type: true,
  timestamp: true,
  durationMinutes: true,
  deviationMeters: true,
  distanceWarning: true,
  manualSalesMode: true,
  manualSalesStatus: true,
  isManualSalesApproved: true,
  orderAmount: true,
  skuSold: true,
};

const ORDER_REPORT_SELECT = {
  id: true,
  status: true,
  deletedAt: true,
  totalValue: true,
  customerSnapshot: true,
  policySnapshot: true,
  items: { select: { productId: true } },
};

const OFF_PJP_REPORT_SELECT = {
  id: true,
  userId: true,
  status: true,
  createdAt: true,
  reportingContext: true,
  reportSupervisorId: true,
  reportClusterId: true,
  policySnapshot: true,
  manualSalesMode: true,
  isManualSalesApproved: true,
  orderAmount: true,
  skuSold: true,
  user: { select: REPORT_USER_SELECT },
};

export async function loadReportRecords(
  start,
  end,
  { byDay = false, includeOutlets = false, scope = {} } = {}
) {
  const where = reportScopeWhere(scope);
  const period = { gte: start, lte: end };
  const [pjps, offVisits] = await Promise.all([
    prisma.pjp.findMany({
      where: { ...where, date: period },
      select: {
        id: true,
        userId: true,
        date: true,
        reportingContext: true,
        reportSupervisorId: true,
        reportClusterId: true,
        user: { select: REPORT_USER_SELECT },
        stops: {
          select: {
            id: true,
            sequence: true,
            status: true,
            visitSession: true,
            policySnapshot: true,
            validationOnly: true,
            validationResult: true,
            ...(includeOutlets
              ? {
                  outlet: {
                    select: { id: true, name: true, channel: true, subChannel: true, type: true },
                  },
                }
              : {}),
            attendances: { select: ATTENDANCE_REPORT_SELECT },
            orders: { select: ORDER_REPORT_SELECT },
          },
        },
      },
    }),
    prisma.offPjpAttendance.findMany({
      where: { ...where, status: 'APPROVED', createdAt: period },
      select: OFF_PJP_REPORT_SELECT,
    }),
  ]);
  return {
    pjps: indexRows(
      pjps.map((p) => ({ ...p, stops: p.stops.filter(countsAsPlannedVisit) })),
      'date',
      byDay
    ),
    offVisits: indexRows(offVisits, 'createdAt', byDay),
    rawRecords: [...pjps, ...offVisits],
  };
}
