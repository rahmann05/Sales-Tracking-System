/** getMtdReport - single-responsibility service (extracted from reports.service.js). */
import { prisma } from '../../../config/prisma.js';

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
