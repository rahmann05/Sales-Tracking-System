import { loadReportRecords } from './report-records.service.js';
import { reportBasis,measuredVisitMinutes } from '../../../../../shared/report-semantics.mjs';
import { mergeReportSales, assignmentReportBasis } from './report-assignment.service.js';
import { loadSalesTargets } from './sales-target.service.js';
import { targetResult, targetCoverage, targetBasisNote } from '../../../../../shared/sales-targets.mjs';
import { offPjpSalesResult, visitSalesResult, wibDayRange, wibDateKey } from '../../../../../shared/visit-metrics.mjs';
/** getWeeklyReport - single-responsibility service (extracted from reports.service.js). */
import { calendarWorkingDay, calendarBasis } from '../../../../../shared/report-calendar.mjs';
import { loadReportCalendars } from './report-calendar.service.js';
import { prisma } from '../../../config/prisma.js';
import { getDynamicConfig } from '../../config/config.service.js';
import {reportProvenance} from './report-provenance.service.js';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 4. ND6 WEEKLY PERFORMANCE REPORT (REKAP ABSENSI & KUNJUNGAN MINGGUAN)
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const getWeeklyReport = async (query = {}) => {
  const { startDate, endDate, userId, clusterId, supervisorId } = query;
  const minVisitDuration = await getDynamicConfig('MINIMUM_VISIT_DURATION_MINUTES', 5);

  const manualSalesMode = await getDynamicConfig('MANUAL_SALES_REPORT_MODE', 'NOTES_ONLY');

  // Plan dates and attendance dates use the same WIB business day.
  const anchorKey = startDate || wibDateKey();
  const anchor = new Date(`${anchorKey}T12:00:00Z`);
  if (!startDate) anchor.setUTCDate(anchor.getUTCDate() - (anchor.getUTCDay() + 6) % 7);
  const firstKey = anchor.toISOString().slice(0, 10);
  const start = wibDayRange(firstKey).gte;
  const last = new Date(anchor);
  last.setUTCDate(last.getUTCDate() + 6);
  const end = wibDayRange(endDate || last.toISOString().slice(0, 10)).lte;
  const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(anchor);
    day.setUTCDate(day.getUTCDate() + i);
    const dateStr = day.toISOString().slice(0, 10);
    if (wibDayRange(dateStr).gte > end) break;
    weekDays.push({ dateStr, dayName: DAY_NAMES[day.getUTCDay()], formattedDate: day.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short' }) });
  }
  const calendarMonths=[...new Set(weekDays.map(day=>day.dateStr.slice(0,7)))];
  const calendars=await loadReportCalendars(calendarMonths);
  for(const day of weekDays)day.isWorkingDay=calendarWorkingDay(calendars.get(day.dateStr.slice(0,7)),day.dateStr);

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

  let totalWeeklyPlan = 0;
  let totalWeeklyActual = 0;
  let totalOffPjp = 0;
  let totalWeeklyEc = 0;
  let totalWeeklyOmzet = 0;
  let totalWeeklySku = 0;
  let totalWeeklyDuration = 0;
  let totalDurationSamples = 0;
  let totalWeeklyAnomalies = 0;

  // Day aggregations
  const daysSummary = weekDays.map((wd) => ({
    dateStr: wd.dateStr,
    dayName: wd.dayName,
    formattedDate: wd.formattedDate,
    isWorkingDay: wd.isWorkingDay,
    planCalls: 0,
    actualCalls: 0,
    effectiveCalls: 0,
    omzet: 0,
    skuSold: 0,
    durationMinutes: 0,
    durationSamples: 0,
    anomalies: 0,
  }));

  const records=await loadReportRecords(start,end,{byDay:true,scope:{userId,clusterId,supervisorId}});
  const salesmen=mergeReportSales(currentSales,records);
  // A weekly target covers Monday through Sunday; custom/short ranges cannot use it.
  const isFullWeek=anchor.getUTCDay()===1 && weekDays.length===7 && wibDateKey(end)===last.toISOString().slice(0,10);
  const targets=isFullWeek?await loadSalesTargets(salesmen.map(s=>s.id),'WEEK',firstKey):new Map();

  const salesmanRows = await Promise.all(
    salesmen.map(async (sales) => {
      const dayBreakdowns = {};

      let salesPlan = 0;
      let salesActual = 0;
      let salesOffPjp = 0;
      let salesEc = 0;
      let salesOmzet = 0;
      let salesSku = 0;
      let salesDuration = 0;
      let durationSamples = 0;
      let salesAnomalies = 0;

      for (let i = 0; i < weekDays.length; i++) {
        const wd = weekDays[i];
        const pjps=records.pjps.get(`${sales.id}:${wd.dateStr}`) || [];

        let dPlan = 0;
        let dActual = 0;
        let dEc = 0;
        let dOmzet = 0;
        let dSku = 0;
        let dDuration = 0;
        let dSamples = 0;
        let dAnomalies = 0;

        pjps.forEach((pjp) => {
          (pjp.stops || []).forEach((stop) => {
            dPlan += 1;
            const result = visitSalesResult(stop, { manualSalesMode });
            const att = result.checkOut;
            const hasAttIn = result.actual;

            if (hasAttIn) {
              dActual += 1;
            }

            const orderTotal = result.orderAmount;
            if (result.effective) {
              dEc += 1;
              dOmzet += orderTotal;
            }

            dSku += result.skuSold;
            const dur = measuredVisitMinutes(stop);
            if(dur!==null){dDuration += dur;dSamples++;}

            const durationLimit=stop.policySnapshot?.values?.MINIMUM_VISIT_DURATION_MINUTES??minVisitDuration;
            if (stop.policySnapshot?.values?.ATTENDANCE_ENFORCE_MIN_DURATION!==false&&dur!==null&&dur < durationLimit) dAnomalies += 1;
            if (att?.distanceWarning === 'WARNING') dAnomalies += 1;
          });
        });

        const offVisits=records.offVisits.get(`${sales.id}:${wd.dateStr}`) || [];
        dActual += offVisits.length;
        salesOffPjp += offVisits.length;
        for (const off of offVisits) {
          const offResult = offPjpSalesResult(off, { manualSalesMode });
          dOmzet += offResult.orderAmount;
          dSku += offResult.skuSold;
          if (offResult.effective) dEc += 1;
        }

        // Track day breakdown
        dayBreakdowns[wd.dayName.toLowerCase()] = {
          plan: dPlan,
          actual: dActual,
          offPjpCalls: offVisits.length,
          ec: dEc,
          omzet: dOmzet,
          callRate: dPlan > 0 ? `${Math.round(((dActual - offVisits.length) / dPlan) * 100)}%` : '0%',
        };

        // Accumulate sales total
        salesPlan += dPlan;
        salesActual += dActual;
        salesEc += dEc;
        salesOmzet += dOmzet;
        salesSku += dSku;
        salesDuration += dDuration;
        durationSamples += dSamples;
        salesAnomalies += dAnomalies;

        // Accumulate week days summary
        daysSummary[i].planCalls += dPlan;
        daysSummary[i].actualCalls += dActual;
        daysSummary[i].effectiveCalls += dEc;
        daysSummary[i].omzet += dOmzet;
        daysSummary[i].skuSold += dSku;
        daysSummary[i].durationMinutes += dDuration;
        daysSummary[i].durationSamples += dSamples;
        daysSummary[i].anomalies += dAnomalies;
      }

      // Add to overall totals
      totalWeeklyPlan += salesPlan;
      totalWeeklyActual += salesActual;
      totalOffPjp += salesOffPjp;
      totalWeeklyEc += salesEc;
      totalWeeklyOmzet += salesOmzet;
      totalWeeklySku += salesSku;
      totalWeeklyDuration += salesDuration;
      totalDurationSamples += durationSamples;
      totalWeeklyAnomalies += salesAnomalies;

      const target=targetResult(targets.get(sales.id),salesOmzet,{supervisorId,clusterId});
      if(!isFullWeek)target.status='CUSTOM_RANGE';

      return {
        salesmanId: sales.id,
        salesmanName: sales.name,
        clusterName: sales.cluster?.name || 'Belum ditugaskan',
        region: sales.cluster?.region || 'Belum ditugaskan',
        assignments: sales.assignments,
        target,
        days: dayBreakdowns,
        weeklyTotal: {
          plan: salesPlan,
          actual: salesActual,
          offPjpCalls: salesOffPjp,
          callRate: salesPlan > 0 ? `${Math.round(((salesActual - salesOffPjp) / salesPlan) * 100)}%` : '0%',
          ec: salesEc,
          ecRate: salesActual > 0 ? `${Math.round((salesEc / salesActual) * 100)}%` : '0%',
          omzet: salesOmzet,
          target: target.amount,
          targetAchievement: target.achievement,
          skuSold: salesSku,
          durationSamples,
          avgDuration: durationSamples > 0 ? Math.round(salesDuration / durationSamples) : null,
          anomalies: salesAnomalies,
        },
      };
    })
  );

  return {
    basis: { ...reportBasis(), ...assignmentReportBasis(records),...calendarBasis(calendarMonths,calendars),...reportProvenance({manualSalesMode,minVisitDuration},records),target:'EXPLICIT_SALES_PERIOD',targetNote:targetBasisNote,targetCoverage:targetCoverage(salesmanRows.map(s=>s.target)) },
    meta:{company:await getDynamicConfig('COMPANY_NAME','PT. SINAR ANUGRAH')},
    period: {
      startDate: wibDateKey(start),
      endDate: wibDateKey(end),
      weekDays,
      targetPeriod: isFullWeek?firstKey:null,
    },
    summary: {
      totalPlanCalls: totalWeeklyPlan,
      totalActualCalls: totalWeeklyActual,
      totalOffPjpCalls: totalOffPjp,
      callComplianceRate: totalWeeklyPlan > 0 ? `${Math.round(((totalWeeklyActual - totalOffPjp) / totalWeeklyPlan) * 100)}%` : '0%',
      totalEffectiveCalls: totalWeeklyEc,
      effectiveCallRate: totalWeeklyActual > 0 ? `${Math.round((totalWeeklyEc / totalWeeklyActual) * 100)}%` : '0%',
      totalOrderAmount: totalWeeklyOmzet,
      totalSkuSold: totalWeeklySku,
      durationSamples: totalDurationSamples,
      avgDurationMinutes: totalDurationSamples > 0 ? Math.round(totalWeeklyDuration / totalDurationSamples) : null,
      totalAnomalies: totalWeeklyAnomalies,
    },
    daysSummary:daysSummary.map(day=>({...day,durationMinutes:day.durationSamples?day.durationMinutes:null})),
    salesmen: salesmanRows,
  };
};
