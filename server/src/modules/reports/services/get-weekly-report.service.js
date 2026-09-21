/** getWeeklyReport - single-responsibility service (extracted from reports.service.js). */
import { prisma } from '../../../config/prisma.js';

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
