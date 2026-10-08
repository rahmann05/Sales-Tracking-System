import {reportChannel,ratioPercent,orderChannelAmounts,reportBasis,channelBasisNote} from '../../../../../shared/report-semantics.mjs';
import { loadReportRecords } from './report-records.service.js';
import { mergeReportSales, assignmentReportBasis } from './report-assignment.service.js';
import { loadSalesTargets } from './sales-target.service.js';
import { targetResult, targetCoverage, targetBasisNote } from '../../../../../shared/sales-targets.mjs';
import { offPjpSalesResult, visitSalesResult, wibDateKey } from '../../../../../shared/visit-metrics.mjs';
/** getMtdReport - single-responsibility service (extracted from reports.service.js). */
import { calendarMonthMetrics, calendarBasis } from '../../../../../shared/report-calendar.mjs';
import { loadReportCalendars } from './report-calendar.service.js';
import { prisma } from '../../../config/prisma.js';
import { getDynamicConfig } from '../../config/config.service.js';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 5. ND6 MONTH-TO-DATE (MTD) PERFORMANCE & SALES REPORT
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const getMtdReport = async (query = {}) => {
  const { month, year, userId, clusterId, supervisorId } = query;
  const manualSalesMode = await getDynamicConfig('MANUAL_SALES_REPORT_MODE', 'NOTES_ONLY');

  const now = new Date(`${wibDateKey()}T12:00:00Z`);
  const targetYear = year ? parseInt(year, 10) : now.getUTCFullYear();
  const targetMonth = month ? parseInt(month, 10) : now.getUTCMonth() + 1; // 1-indexed

  // Month start & end dates
  const mtdStart = new Date(Date.UTC(targetYear, targetMonth - 1, 1, -7));
  const mtdEnd = new Date(Date.UTC(targetYear, targetMonth, 1, -7) - 1);

  // Last month start & end dates for LMA comparison
  const lmaStart = new Date(Date.UTC(targetYear, targetMonth - 2, 1, -7));
  const lmaEnd = new Date(mtdStart.getTime() - 1);

  const calendarMonth=`${targetYear}-${String(targetMonth).padStart(2,'0')}`;
  const calendars=await loadReportCalendars([calendarMonth]);
  const calendarMetrics=calendarMonthMetrics(calendarMonth,calendars.get(calendarMonth),wibDateKey());
  const {total:totalWorkingDays,elapsed:workingDaysElapsed}=calendarMetrics;

  // Fetch Salesmen
  const salesWhere = { role: 'SALES', deletedAt: null };
  if (userId) salesWhere.id = userId;
  if (clusterId) salesWhere.clusterId = clusterId;
  if (supervisorId) salesWhere.supervisorId = supervisorId;

  const currentSales = await prisma.user.findMany({
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
  let totalOffPjp = 0;
  let totalMtdEc = 0;
  let totalMtdOmzet = 0;
  let totalMtdSku = 0;
  let totalLmaOmzet = 0;
  let totalMonthlyTarget = 0;
  let unverifiedChannelAmount = 0;

  // Channel distribution counters
  const channelMap = {
    OFF_PJP: { name: 'Kunjungan luar PJP', mtdVisits: 0, mtdEc: 0, mtdOmzet: 0 },
    RETAIL: { name: 'Retail / General Trade', count: 0, mtdVisits: 0, mtdEc: 0, mtdOmzet: 0 },
    MODERN_TRADE: { name: 'Modern Trade (Supermarket/Minimarket)', count: 0, mtdVisits: 0, mtdEc: 0, mtdOmzet: 0 },
    UNCLASSIFIED: {name:'Belum diklasifikasi',mtdVisits:0,mtdEc:0,mtdOmzet:0},
    SEMI_WHOLESALE: { name: 'Semi Wholesale / Grosir', count: 0, mtdVisits: 0, mtdEc: 0, mtdOmzet: 0 },
  };

  const scope={userId,clusterId,supervisorId};
  const [mtdRecords,lmaRecords]=await Promise.all([loadReportRecords(mtdStart,mtdEnd,{includeOutlets:true,scope}),loadReportRecords(lmaStart,lmaEnd,{scope})]);
  const salesmen=mergeReportSales(currentSales,lmaRecords,mtdRecords);
  const targets=await loadSalesTargets(salesmen.map(s=>s.id),'MONTH',`${targetYear}-${String(targetMonth).padStart(2,'0')}`);

  const salesmanRows = await Promise.all(
    salesmen.map(async (sales) => {
      const mtdPjps=mtdRecords.pjps.get(sales.id) || [];
      const lmaPjps=lmaRecords.pjps.get(sales.id) || [];

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
          const result = visitSalesResult(stop, { manualSalesMode });
          const isVisited = result.actual;
          if (isVisited) sMtdActual += 1;

          const orderTotal = result.orderAmount;

          const channelKey = reportChannel(stop.outlet);
          const targetChan = channelMap[channelKey];

          if (isVisited) {
            targetChan.mtdVisits += 1;
          }

          if (result.effective) {
            sMtdEc += 1;
            sMtdOmzet += orderTotal;
            targetChan.mtdEc += 1;
            for (const contribution of orderChannelAmounts(stop, result)) {
              channelMap[contribution.channelKey].mtdOmzet += contribution.amount;
              if (!contribution.historical) unverifiedChannelAmount += contribution.amount;
            }
          }

          sMtdSku += result.skuSold;
        });
      });

      // Calculate LMA
      lmaPjps.forEach((pjp) => {
        (pjp.stops || []).forEach((stop) => {
          const orderTotal = visitSalesResult(stop, { manualSalesMode }).orderAmount;
          sLmaOmzet += orderTotal;
        });
      });

      const offMtd=mtdRecords.offVisits.get(sales.id) || [];
      const offLma=lmaRecords.offVisits.get(sales.id) || [];
      sMtdActual += offMtd.length;
      totalOffPjp += offMtd.length;
      channelMap.OFF_PJP.mtdVisits += offMtd.length;
      for (const off of offMtd) {
        const offResult = offPjpSalesResult(off, { manualSalesMode });
        sMtdOmzet += offResult.orderAmount;
        sMtdSku += offResult.skuSold;
        channelMap.OFF_PJP.mtdOmzet += offResult.orderAmount;
        if (offResult.effective) { sMtdEc += 1; channelMap.OFF_PJP.mtdEc += 1; }
      }
      sLmaOmzet += offLma.reduce((sum, off) => sum + offPjpSalesResult(off, { manualSalesMode }).orderAmount, 0);


      const eligible=currentSales.some(s=>s.id===sales.id)||mtdPjps.length>0||(mtdRecords.offVisits.get(sales.id)||[]).length>0;
      const target=targetResult(targets.get(sales.id),sMtdOmzet,{supervisorId,clusterId,eligible});
      const sMonthlyTarget = target.amount;
      const mtdToLmaRate = sLmaOmzet > 0 ? Math.round((sMtdOmzet / sLmaOmzet) * 100) : 0;

      totalMtdPlan += sMtdPlan;
      totalMtdActual += sMtdActual;
      totalMtdEc += sMtdEc;
      totalMtdOmzet += sMtdOmzet;
      totalMtdSku += sMtdSku;
      totalLmaOmzet += sLmaOmzet;
      totalMonthlyTarget += sMonthlyTarget || 0;

      return {
        salesmanId: sales.id,
        salesmanName: sales.name,
        clusterName: sales.cluster?.name || 'Belum ditugaskan',
        region: sales.cluster?.region || 'Belum ditugaskan',
        assignments: sales.assignments,
        monthlyTarget: sMonthlyTarget,
        target,
        mtdActualAmount: sMtdOmzet,
        achievementRate: target.achievement,
        achievementRateNum: target.achievementNum,
        lastMonthActual: sLmaOmzet,
        mtdToLmaRate: ratioPercent(sMtdOmzet,sLmaOmzet),
        mtdToLmaRateNum: mtdToLmaRate,
        mtdPlanCalls: sMtdPlan,
        mtdActualCalls: sMtdActual,
        offPjpCalls: offMtd.length,
        callComplianceRate: sMtdPlan > 0 ? `${Math.round(((sMtdActual - offMtd.length) / sMtdPlan) * 100)}%` : '0%',
        mtdEffectiveCalls: sMtdEc,
        effectiveCallRate: sMtdActual > 0 ? `${Math.round((sMtdEc / sMtdActual) * 100)}%` : '0%',
        totalSkuSold: sMtdSku,
        avgSkuPerCall: sMtdActual > 0 ? Math.round((sMtdSku / sMtdActual) * 10) / 10 : 0,
      };
    })
  );
  const coverage=targetCoverage(salesmanRows.map(s=>s.target));
  const targetActual=salesmanRows.filter(s=>s.target.status==='SET').reduce((sum,s)=>sum+s.mtdActualAmount,0);

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
    basis: { ...reportBasis(), ...assignmentReportBasis(mtdRecords,lmaRecords),...calendarBasis([calendarMonth],calendars), target:'EXPLICIT_SALES_PERIOD',targetNote:targetBasisNote,targetCoverage:coverage, channelNote: channelBasisNote, unverifiedChannelAmount },
    period: {
      month: targetMonth,
      monthName: monthNames[targetMonth - 1] || `Bulan ${targetMonth}`,
      year: targetYear,
      workingDaysElapsed,
      totalWorkingDays,
      workingDaysRate: calendarMetrics.rate,
      calendarKnown: calendarMetrics.known,
    },
    summary: {
      monthlyTargetAmount: coverage.missing || !coverage.eligible ? null : totalMonthlyTarget,
      assignedTargetAmount: totalMonthlyTarget,
      targetCoverage: coverage,
      mtdActualAmount: totalMtdOmzet,
      targetActualAmount: targetActual,
      overallAchievementRate: !coverage.missing && coverage.eligible && totalMonthlyTarget > 0 ? `${Math.round((targetActual / totalMonthlyTarget) * 100)}%` : '—',
      overallAchievementRateNum: !coverage.missing && coverage.eligible && totalMonthlyTarget > 0 ? Math.round((targetActual / totalMonthlyTarget) * 100) : null,
      lastMonthActual: totalLmaOmzet,
      mtdToLmaRate: ratioPercent(totalMtdOmzet,totalLmaOmzet),
      totalMtdPlanCalls: totalMtdPlan,
      totalMtdActualCalls: totalMtdActual,
      totalOffPjpCalls: totalOffPjp,
      mtdCallComplianceRate: totalMtdPlan > 0 ? `${Math.round(((totalMtdActual - totalOffPjp) / totalMtdPlan) * 100)}%` : '0%',
      totalMtdEffectiveCalls: totalMtdEc,
      mtdEffectiveCallRate: totalMtdActual > 0 ? `${Math.round((totalMtdEc / totalMtdActual) * 100)}%` : '0%',
      totalMtdSkuSold: totalMtdSku,
      avgDailyRevenue: calendarMetrics.known&&workingDaysElapsed>0 ? Math.round(totalMtdOmzet / workingDaysElapsed) : null,
    },
    channelBreakdown,
    salesmen: salesmanRows,
  };
};
