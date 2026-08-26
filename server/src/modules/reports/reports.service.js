import { prisma } from '../../config/prisma.js';
import { buildDateRange } from '../../utils/pagination.js';
import { PJP_STATUS, VISIT_STATUS } from '../../utils/constants.js';

/**
 * Overall dashboard summary: PJP, stops, route changes, registrations.
 * Supports optional date range filter via query.startDate / query.endDate.
 */
export const getDashboardSummary = async (query = {}) => {
  const { startDate, endDate } = query;
  const dateRange = buildDateRange(startDate, endDate);
  const pjpWhere = dateRange ? { date: dateRange } : {};

  const [
    totalPjp,
    completedPjp,
    totalStops,
    visitedStops,
    skippedStops,
    totalRegistrations,
    activeRegistrations,
    pendingRegistrations,
    totalRouteChanges,
  ] = await Promise.all([
    prisma.pjp.count({ where: pjpWhere }),
    prisma.pjp.count({ where: { ...pjpWhere, status: PJP_STATUS.COMPLETED } }),
    prisma.pjpStop.count({ where: { pjp: pjpWhere } }),
    prisma.pjpStop.count({ where: { pjp: pjpWhere, status: VISIT_STATUS.VISITED } }),
    prisma.pjpStop.count({ where: { pjp: pjpWhere, status: VISIT_STATUS.SKIPPED } }),
    prisma.customerRegistration.count({ where: { deletedAt: null } }),
    prisma.customerRegistration.count({ where: { registrationStatus: 'REGISTERED_ACTIVE', deletedAt: null } }),
    prisma.customerRegistration.count({ where: { registrationStatus: { in: ['SUBMITTED', 'SPV_APPROVED', 'OPS_APPROVED'] }, deletedAt: null } }),
    prisma.routeChangeRequest.count(),
  ]);

  return {
    pjp: {
      total: totalPjp,
      completed: completedPjp,
      completionRate: totalPjp > 0 ? ((completedPjp / totalPjp) * 100).toFixed(1) + '%' : '0%',
    },
    stops: {
      total: totalStops,
      visited: visitedStops,
      skipped: skippedStops,
      realizationRate: totalStops > 0 ? ((visitedStops / totalStops) * 100).toFixed(1) + '%' : '0%',
    },
    registrations: {
      total: totalRegistrations,
      active: activeRegistrations,
      pending: pendingRegistrations,
    },
    routeChanges: {
      total: totalRouteChanges,
    },
  };
};

/**
 * Per-Sales performance recap.
 */
export const getSalesReport = async (query = {}) => {
  const { startDate, endDate } = query;
  const dateRange = buildDateRange(startDate, endDate);

  const salesUsers = await prisma.user.findMany({
    where: { role: 'SALES', deletedAt: null },
    select: {
      id: true,
      name: true,
      email: true,
      cluster: { select: { name: true, region: true } },
    },
  });

  const report = await Promise.all(
    salesUsers.map(async (sales) => {
      const pjpFilter = { userId: sales.id, type: 'SALES' };
      if (dateRange) pjpFilter.date = dateRange;

      const [totalPjp, completedPjp, totalStops, visitedStops, registrationsCount] = await Promise.all([
        prisma.pjp.count({ where: pjpFilter }),
        prisma.pjp.count({ where: { ...pjpFilter, status: PJP_STATUS.COMPLETED } }),
        prisma.pjpStop.count({ where: { pjp: pjpFilter } }),
        prisma.pjpStop.count({ where: { pjp: pjpFilter, status: VISIT_STATUS.VISITED } }),
        prisma.customerRegistration.count({ where: { salesmanId: sales.id, deletedAt: null } }),
      ]);

      const realizationRate = totalStops > 0 ? Math.round((visitedStops / totalStops) * 100) : 0;

      return {
        sales: { id: sales.id, name: sales.name, email: sales.email, cluster: sales.cluster },
        pjp: { total: totalPjp, completed: completedPjp },
        visits: {
          totalStops,
          visitedStops,
          realizationRate: `${realizationRate}%`,
        },
        registrations: {
          total: registrationsCount,
        },
      };
    })
  );

  return report;
};

/**
 * Per-Outlet visit recap.
 */
export const getOutletReport = async (query = {}) => {
  const { startDate, endDate, clusterId } = query;
  const dateRange = buildDateRange(startDate, endDate);

  const outletWhere = { deletedAt: null };
  if (clusterId) outletWhere.clusterId = clusterId;

  const outlets = await prisma.outlet.findMany({
    where: outletWhere,
    select: {
      id: true,
      name: true,
      address: true,
      cluster: { select: { name: true, region: true } },
    },
  });

  const report = await Promise.all(
    outlets.map(async (outlet) => {
      const stopWhere = { outletId: outlet.id };
      if (dateRange) stopWhere.pjp = { date: dateRange };

      const [totalVisits, closedReports] = await Promise.all([
        prisma.pjpStop.count({ where: { ...stopWhere, status: VISIT_STATUS.VISITED } }),
        prisma.pjpStop.count({ where: { ...stopWhere, status: VISIT_STATUS.CLOSED_REPORTED } }),
      ]);

      return {
        outlet: { id: outlet.id, name: outlet.name, address: outlet.address, cluster: outlet.cluster },
        visits: totalVisits,
        closedReports,
      };
    })
  );

  return report;
};

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 4. ND6 WEEKLY PERFORMANCE REPORT (REKAP ABSENSI & KUNJUNGAN MINGGUAN)
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const getWeeklyReport = async (query = {}) => {
  const { startDate, endDate, userId, clusterId } = query;

  // Default to current week's Monday to Saturday if not provided
  let start = startDate ? new Date(startDate) : new Date();
  if (!startDate) {
    const dayOfWeek = start.getDay(); // 0 is Sunday, 1 is Monday
    const distanceToMonday = (dayOfWeek + 6) % 7;
    start.setDate(start.getDate() - distanceToMonday);
  }
  start.setHours(0, 0, 0, 0);

  let end = endDate ? new Date(endDate) : new Date(start);
  if (!endDate) {
    end.setDate(start.getDate() + 5); // Saturday
  }
  end.setHours(23, 59, 59, 999);

  // Generate 6 working days array (Monday - Saturday)
  const DAY_NAMES = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const weekDays = [];
  const curr = new Date(start);
  for (let i = 0; i < 6; i++) {
    const dStr = curr.toISOString().split('T')[0];
    weekDays.push({
      dateStr: dStr,
      dayName: DAY_NAMES[i] || `Hari ${i + 1}`,
      formattedDate: curr.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
    });
    curr.setDate(curr.getDate() + 1);
  }

  // Fetch Salesmen
  const salesWhere = { role: 'SALES', deletedAt: null };
  if (userId) salesWhere.id = userId;
  if (clusterId) salesWhere.clusterId = clusterId;

  const salesmen = await prisma.user.findMany({
    where: salesWhere,
    select: {
      id: true,
      name: true,
      email: true,
      cluster: { select: { id: true, name: true, region: true } },
    },
    orderBy: { name: 'asc' },
  });

  let totalWeeklyPlan = 0;
  let totalWeeklyActual = 0;
  let totalWeeklyEc = 0;
  let totalWeeklyOmzet = 0;
  let totalWeeklySku = 0;
  let totalWeeklyDuration = 0;
  let totalWeeklyAnomalies = 0;

  // Day aggregations
  const daysSummary = weekDays.map((wd) => ({
    dateStr: wd.dateStr,
    dayName: wd.dayName,
    formattedDate: wd.formattedDate,
    planCalls: 0,
    actualCalls: 0,
    effectiveCalls: 0,
    omzet: 0,
    skuSold: 0,
    durationMinutes: 0,
    anomalies: 0,
  }));

  const salesmanRows = await Promise.all(
    salesmen.map(async (sales) => {
      const dayBreakdowns = {};

      let salesPlan = 0;
      let salesActual = 0;
      let salesEc = 0;
      let salesOmzet = 0;
      let salesSku = 0;
      let salesDuration = 0;
      let salesAnomalies = 0;

      for (let i = 0; i < weekDays.length; i++) {
        const wd = weekDays[i];
        const dayStart = new Date(`${wd.dateStr}T00:00:00.000Z`);
        const dayEnd = new Date(`${wd.dateStr}T23:59:59.999Z`);

        // Find PJP for this salesman on this date
        const pjps = await prisma.pjp.findMany({
          where: {
            userId: sales.id,
            date: { gte: dayStart, lte: dayEnd },
          },
          include: {
            stops: {
              include: {
                attendances: true,
              },
            },
          },
        });

        let dPlan = 0;
        let dActual = 0;
        let dEc = 0;
        let dOmzet = 0;
        let dSku = 0;
        let dDuration = 0;
        let dAnomalies = 0;

        pjps.forEach((pjp) => {
          (pjp.stops || []).forEach((stop) => {
            dPlan += 1;
            const att = stop.attendances?.[0];
            const hasAttIn = Boolean(att?.inTimestamp);
            const hasAttOut = Boolean(att?.outTimestamp);

            if (hasAttIn || stop.status === 'VISITED' || stop.status === 'ARRIVED') {
              dActual += 1;
            }

            const orderTotal = att?.orderAmount || 0;
            if (orderTotal > 0 || att?.isEffectiveCall) {
              dEc += 1;
              dOmzet += orderTotal;
            }

            dSku += att?.skuSold || 0;
            const dur = att?.durationMinutes || 0;
            dDuration += dur;

            if (dur > 0 && dur < 5) dAnomalies += 1;
            if (att?.distanceWarning === 'WARNING') dAnomalies += 1;
          });
        });

        // Track day breakdown
        dayBreakdowns[wd.dayName.toLowerCase()] = {
          plan: dPlan,
          actual: dActual,
          ec: dEc,
          omzet: dOmzet,
          callRate: dPlan > 0 ? `${Math.round((dActual / dPlan) * 100)}%` : '0%',
        };

        // Accumulate sales total
        salesPlan += dPlan;
        salesActual += dActual;
        salesEc += dEc;
        salesOmzet += dOmzet;
        salesSku += dSku;
        salesDuration += dDuration;
        salesAnomalies += dAnomalies;

        // Accumulate week days summary
        daysSummary[i].planCalls += dPlan;
        daysSummary[i].actualCalls += dActual;
        daysSummary[i].effectiveCalls += dEc;
        daysSummary[i].omzet += dOmzet;
        daysSummary[i].skuSold += dSku;
        daysSummary[i].durationMinutes += dDuration;
        daysSummary[i].anomalies += dAnomalies;
      }

      // Add to overall totals
      totalWeeklyPlan += salesPlan;
      totalWeeklyActual += salesActual;
      totalWeeklyEc += salesEc;
      totalWeeklyOmzet += salesOmzet;
      totalWeeklySku += salesSku;
      totalWeeklyDuration += salesDuration;
      totalWeeklyAnomalies += salesAnomalies;

      const weeklyTarget = 25000000; // Rp 25.000.000 standard weekly target
      const achievementRate = weeklyTarget > 0 ? `${Math.round((salesOmzet / weeklyTarget) * 100)}%` : '0%';

      return {
        salesmanId: sales.id,
        salesmanName: sales.name,
        clusterName: sales.cluster?.name || 'Cabang Padalarang',
        region: sales.cluster?.region || 'Jawa Barat',
        days: dayBreakdowns,
        weeklyTotal: {
          plan: salesPlan,
          actual: salesActual,
          callRate: salesPlan > 0 ? `${Math.round((salesActual / salesPlan) * 100)}%` : '0%',
          ec: salesEc,
          ecRate: salesActual > 0 ? `${Math.round((salesEc / salesActual) * 100)}%` : '0%',
          omzet: salesOmzet,
          target: weeklyTarget,
          targetAchievement: achievementRate,
          skuSold: salesSku,
          avgDuration: salesActual > 0 ? Math.round(salesDuration / salesActual) : 0,
          anomalies: salesAnomalies,
        },
      };
    })
  );

  return {
    period: {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      weekDays,
    },
    summary: {
      totalPlanCalls: totalWeeklyPlan,
      totalActualCalls: totalWeeklyActual,
      callComplianceRate: totalWeeklyPlan > 0 ? `${Math.round((totalWeeklyActual / totalWeeklyPlan) * 100)}%` : '0%',
      totalEffectiveCalls: totalWeeklyEc,
      effectiveCallRate: totalWeeklyActual > 0 ? `${Math.round((totalWeeklyEc / totalWeeklyActual) * 100)}%` : '0%',
      totalOrderAmount: totalWeeklyOmzet,
      totalSkuSold: totalWeeklySku,
      avgDurationMinutes: totalWeeklyActual > 0 ? Math.round(totalWeeklyDuration / totalWeeklyActual) : 0,
      totalAnomalies: totalWeeklyAnomalies,
    },
    daysSummary,
    salesmen: salesmanRows,
  };
};

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 5. ND6 MONTH-TO-DATE (MTD) PERFORMANCE & SALES REPORT
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const getMtdReport = async (query = {}) => {
  const { month, year, userId, clusterId } = query;

  const now = new Date();
  const targetYear = year ? parseInt(year, 10) : now.getFullYear();
  const targetMonth = month ? parseInt(month, 10) : now.getMonth() + 1; // 1-indexed

  // Month start & end dates
  const mtdStart = new Date(Date.UTC(targetYear, targetMonth - 1, 1, 0, 0, 0));
  const mtdEnd = new Date(Date.UTC(targetYear, targetMonth, 0, 23, 59, 59));

  // Last month start & end dates for LMA comparison
  const lmaStart = new Date(Date.UTC(targetYear, targetMonth - 2, 1, 0, 0, 0));
  const lmaEnd = new Date(Date.UTC(targetYear, targetMonth - 1, 0, 23, 59, 59));

  // Calculate working days in month (Mon-Sat, excluding Sun)
  let totalWorkingDays = 0;
  let workingDaysElapsed = 0;
  const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
  const todayDate = now.getDate();
  const isCurrentMonth = targetYear === now.getFullYear() && targetMonth === (now.getMonth() + 1);

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(targetYear, targetMonth - 1, day);
    if (d.getDay() !== 0) { // Exclude Sunday
      totalWorkingDays += 1;
      if (!isCurrentMonth || day <= todayDate) {
        workingDaysElapsed += 1;
      }
    }
  }

  // Fetch Salesmen
  const salesWhere = { role: 'SALES', deletedAt: null };
  if (userId) salesWhere.id = userId;
  if (clusterId) salesWhere.clusterId = clusterId;

  const salesmen = await prisma.user.findMany({
    where: salesWhere,
    select: {
      id: true,
      name: true,
      email: true,
      cluster: { select: { id: true, name: true, region: true } },
    },
    orderBy: { name: 'asc' },
  });

  let totalMtdPlan = 0;
  let totalMtdActual = 0;
  let totalMtdEc = 0;
  let totalMtdOmzet = 0;
  let totalMtdSku = 0;
  let totalLmaOmzet = 0;
  let totalMonthlyTarget = 0;

  // Channel distribution counters
  const channelMap = {
    RETAIL: { name: 'Retail / General Trade', count: 0, mtdVisits: 0, mtdEc: 0, mtdOmzet: 0 },
    MODERN_TRADE: { name: 'Modern Trade (Supermarket/Minimarket)', count: 0, mtdVisits: 0, mtdEc: 0, mtdOmzet: 0 },
    SEMI_WHOLESALE: { name: 'Semi Wholesale / Grosir', count: 0, mtdVisits: 0, mtdEc: 0, mtdOmzet: 0 },
  };

  const salesmanRows = await Promise.all(
    salesmen.map(async (sales) => {
      // 1. Current Month (MTD) PJP & Attendances
      const mtdPjps = await prisma.pjp.findMany({
        where: {
          userId: sales.id,
          date: { gte: mtdStart, lte: mtdEnd },
        },
        include: {
          stops: {
            include: {
              outlet: true,
              attendances: true,
            },
          },
        },
      });

      // 2. Last Month (LMA) Orders for sales
      const lmaPjps = await prisma.pjp.findMany({
        where: {
          userId: sales.id,
          date: { gte: lmaStart, lte: lmaEnd },
        },
        include: {
          stops: {
            include: {
              attendances: true,
            },
          },
        },
      });

      let sMtdPlan = 0;
      let sMtdActual = 0;
      let sMtdEc = 0;
      let sMtdOmzet = 0;
      let sMtdSku = 0;
      let sLmaOmzet = 0;

      // Calculate MTD
      mtdPjps.forEach((pjp) => {
        (pjp.stops || []).forEach((stop) => {
          sMtdPlan += 1;
          const att = stop.attendances?.[0];
          const isVisited = Boolean(att?.inTimestamp) || stop.status === 'VISITED';
          if (isVisited) sMtdActual += 1;

          const orderTotal = att?.orderAmount || 0;

          const channelKey = (stop.outlet?.subChannel || stop.outlet?.type || 'RETAIL').toUpperCase();
          const targetChan = channelMap[channelKey] || channelMap.RETAIL;

          if (isVisited) {
            targetChan.mtdVisits += 1;
          }

          if (orderTotal > 0 || att?.isEffectiveCall) {
            sMtdEc += 1;
            sMtdOmzet += orderTotal;
            targetChan.mtdEc += 1;
            targetChan.mtdOmzet += orderTotal;
          }

          sMtdSku += att?.skuSold || 0;
        });
      });

      // Calculate LMA
      lmaPjps.forEach((pjp) => {
        (pjp.stops || []).forEach((stop) => {
          const orderTotal = stop.attendances?.[0]?.orderAmount || 0;
          sLmaOmzet += orderTotal;
        });
      });

      // Default baseline LMA if system is fresh
      if (sLmaOmzet === 0) {
        sLmaOmzet = 85000000; // Rp 85 Juta standard LMA
      }

      const sMonthlyTarget = 100000000; // Rp 100 Juta standard monthly target
      const achievementRate = sMonthlyTarget > 0 ? Math.round((sMtdOmzet / sMonthlyTarget) * 100) : 0;
      const mtdToLmaRate = sLmaOmzet > 0 ? Math.round((sMtdOmzet / sLmaOmzet) * 100) : 0;

      totalMtdPlan += sMtdPlan;
      totalMtdActual += sMtdActual;
      totalMtdEc += sMtdEc;
      totalMtdOmzet += sMtdOmzet;
      totalMtdSku += sMtdSku;
      totalLmaOmzet += sLmaOmzet;
      totalMonthlyTarget += sMonthlyTarget;

      return {
        salesmanId: sales.id,
        salesmanName: sales.name,
        clusterName: sales.cluster?.name || 'Cabang Padalarang',
        region: sales.cluster?.region || 'Jawa Barat',
        monthlyTarget: sMonthlyTarget,
        mtdActualAmount: sMtdOmzet,
        achievementRate: `${achievementRate}%`,
        achievementRateNum: achievementRate,
        lastMonthActual: sLmaOmzet,
        mtdToLmaRate: `${mtdToLmaRate}%`,
        mtdToLmaRateNum: mtdToLmaRate,
        mtdPlanCalls: sMtdPlan,
        mtdActualCalls: sMtdActual,
        callComplianceRate: sMtdPlan > 0 ? `${Math.round((sMtdActual / sMtdPlan) * 100)}%` : '0%',
        mtdEffectiveCalls: sMtdEc,
        effectiveCallRate: sMtdActual > 0 ? `${Math.round((sMtdEc / sMtdActual) * 100)}%` : '0%',
        totalSkuSold: sMtdSku,
        avgSkuPerCall: sMtdActual > 0 ? Math.round((sMtdSku / sMtdActual) * 10) / 10 : 0,
      };
    })
  );

  // Calculate channel contributions
  const channelBreakdown = Object.entries(channelMap).map(([key, c]) => ({
    channelKey: key,
    channelName: c.name,
    mtdVisits: c.mtdVisits,
    mtdEc: c.mtdEc,
    mtdOmzet: c.mtdOmzet,
    contributionRate: totalMtdOmzet > 0 ? `${Math.round((c.mtdOmzet / totalMtdOmzet) * 100)}%` : '0%',
  }));

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  return {
    period: {
      month: targetMonth,
      monthName: monthNames[targetMonth - 1] || `Bulan ${targetMonth}`,
      year: targetYear,
      workingDaysElapsed,
      totalWorkingDays,
      workingDaysRate: `${Math.round((workingDaysElapsed / Math.max(1, totalWorkingDays)) * 100)}%`,
    },
    summary: {
      monthlyTargetAmount: totalMonthlyTarget,
      mtdActualAmount: totalMtdOmzet,
      overallAchievementRate: totalMonthlyTarget > 0 ? `${Math.round((totalMtdOmzet / totalMonthlyTarget) * 100)}%` : '0%',
      overallAchievementRateNum: totalMonthlyTarget > 0 ? Math.round((totalMtdOmzet / totalMonthlyTarget) * 100) : 0,
      lastMonthActual: totalLmaOmzet,
      mtdToLmaRate: totalLmaOmzet > 0 ? `${Math.round((totalMtdOmzet / totalLmaOmzet) * 100)}%` : '0%',
      totalMtdPlanCalls: totalMtdPlan,
      totalMtdActualCalls: totalMtdActual,
      mtdCallComplianceRate: totalMtdPlan > 0 ? `${Math.round((totalMtdActual / totalMtdPlan) * 100)}%` : '0%',
      totalMtdEffectiveCalls: totalMtdEc,
      mtdEffectiveCallRate: totalMtdActual > 0 ? `${Math.round((totalMtdEc / totalMtdActual) * 100)}%` : '0%',
      totalMtdSkuSold: totalMtdSku,
      avgDailyRevenue: workingDaysElapsed > 0 ? Math.round(totalMtdOmzet / workingDaysElapsed) : 0,
    },
    channelBreakdown,
    salesmen: salesmanRows,
  };
};

