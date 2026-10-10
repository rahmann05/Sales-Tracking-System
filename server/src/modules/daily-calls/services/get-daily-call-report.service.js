import { reportScopeWhere, reportIdentity, assignmentReportBasis } from '../../reports/services/report-assignment.service.js';
import { reportBasis,measuredVisitMinutes } from '../../../../../shared/report-semantics.mjs';
import {reportProvenance} from '../../reports/services/report-provenance.service.js';
import {visitOutcomeText,includesCollection} from '../../../../../shared/visit-outcome.mjs';
import { offPjpSalesResult, visitSalesResult, wibDateKey,countsAsPlannedVisit } from '../../../../../shared/visit-metrics.mjs';
/** getDailyCallReport - single-responsibility service (extracted from daily-calls.service.js). */
import { prisma } from '../../../config/prisma.js';
import { calculateDistanceMeters } from '../../../utils/geolocation.js';
import { ATTENDANCE_TYPE } from "../../../utils/constants.js";
import { buildDayRange, formatTimeOnly, formatDurationHhMm } from './daily-calls.helpers.js';
import { getDynamicConfig } from '../../config/config.service.js';

/**
 * Get Daily Call Report & Comprehensive Attendance Audit (ND6 Distribution Format)
 */
export const getDailyCallReport = async (query = {}) => {
  const targetDate = query.date ? new Date(query.date) : new Date();
  const dateStr = query.date || wibDateKey(targetDate);
  const dayRange = buildDayRange(dateStr);

  const { userId, filterType, search } = query;

  // Read dynamic configuration parameters
  const GLOBAL_RADIUS = await getDynamicConfig('ATTENDANCE_RADIUS_METERS', 50);
  const MIN_VISIT_DURATION = await getDynamicConfig('MINIMUM_VISIT_DURATION_MINUTES', 5);
  const GAP_SHORT_KM = await getDynamicConfig('TRAVEL_GAP_SHORT_KM', 3);
  const GAP_SHORT_MINS = await getDynamicConfig('TRAVEL_GAP_SHORT_MINUTES', 45);
  const GAP_MED_KM = await getDynamicConfig('TRAVEL_GAP_MED_KM', 8);
  const GAP_MED_MINS = await getDynamicConfig('TRAVEL_GAP_MED_MINUTES', 90);
  const manualSalesMode = await getDynamicConfig('MANUAL_SALES_REPORT_MODE', 'NOTES_ONLY');

  const wherePjp = {
    ...reportScopeWhere(query),
    date: dayRange,
  };
  if (userId) {
    wherePjp.userId = userId;
  }

  // 1. Fetch Scheduled PJPs & Stops
  const pjps = await prisma.pjp.findMany({
    where: wherePjp,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          role: true,
          cluster: { select: { id: true, name: true, region: true } },
        },
      },
      stops: {
        include: {
          outlet: true,
          attendances: { orderBy: { timestamp: 'asc' } },
          routeChanges: true,
          orders: { include: { items: true } },
        },
        orderBy: { sequence: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // 2. Fetch Off-PJP calls for same date range if any
  const whereOffPjp = {
    ...reportScopeWhere(query),
    createdAt: dayRange,
  };
  if (userId) whereOffPjp.userId = userId;
  const offPjpList = await prisma.offPjpAttendance.findMany({
    where: whereOffPjp,
    include: {
      user: { select: { id: true, name: true, cluster: { select: { id: true, name: true } } } },
      outlet: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  // Map to hold rows per salesman for chronological sequence & travel time analysis
  const salesMap = {};

  for (const pjp of pjps) {
    const identity = reportIdentity(pjp);
    const sId = identity.id || 'UNKNOWN';
    if (!salesMap[sId]) {
      salesMap[sId] = {
        salesmanId: sId,
        salesmanName: identity.name || 'Salesman',
        clusterName: identity.cluster?.name || 'Belum ditugaskan',
        stops: [],
      };
    }

    for (const stop of pjp.stops) {
      if(!countsAsPlannedVisit(stop))continue;
      const attendances = stop.attendances || [];
      const checkIn = attendances.find((a) => a.type === ATTENDANCE_TYPE.IN);
      const checkOut = attendances.find((a) => a.type === ATTENDANCE_TYPE.OUT);
      const policy=stop.policySnapshot?.values||{},attendanceMode=stop.validationOnly?'VALIDATION':policy.SALES_ATTENDANCE_MODE||'IN_OUT';
      const businessResult=checkOut||stop.visitSession?.result;

      const outlet = stop.outlet || {};
      const outletLat = outlet.latitude ?? null;
      const outletLng = outlet.longitude ?? null;

      let devMeters = null;
      if(checkIn?.deviationMeters!=null)devMeters=Math.round(checkIn.deviationMeters);
      else if ([checkIn?.latitude,checkIn?.longitude,outletLat,outletLng].every(Number.isFinite)) {
        devMeters = Math.round(
          calculateDistanceMeters(checkIn.latitude, checkIn.longitude, outletLat, outletLng)
        );
      }

      const maxAllowedRadius = policy.ATTENDANCE_USE_OUTLET_RADIUS===false?(policy.ATTENDANCE_RADIUS_METERS??GLOBAL_RADIUS):(outlet.radiusMeters||policy.ATTENDANCE_RADIUS_METERS||GLOBAL_RADIUS);
      const distWarning = devMeters==null?'UNAVAILABLE':devMeters > maxAllowedRadius ? 'WARNING' : 'OK';

      const durationMins=measuredVisitMinutes(stop);

      const result = visitSalesResult(stop, { manualSalesMode });
      const { actual: isActual, orderAmount, skuSold, effective: isEc } = result;

      const minimumDuration=policy.MINIMUM_VISIT_DURATION_MINUTES??MIN_VISIT_DURATION;
      const isDurationAnomaly = Boolean(policy.ATTENDANCE_ENFORCE_MIN_DURATION!==false&&isActual&&durationMins!==null&&durationMins<minimumDuration);
      const isDistanceAnomaly = isActual && distWarning === 'WARNING';
      const isSkipped = ['SKIPPED','CLOSED','CLOSED_REPORTED'].includes(stop.status) && !isActual;

      const row = {
        id: stop.id,validationOnly:stop.validationOnly,validationResult:stop.validationResult,validationIncomplete:Boolean(stop.validationTaskId&&['PENDING','RETURNED'].includes(stop.validationResult?.state)),
        sequence: stop.sequence,
        salesmanId: identity.id,
        salesmanName: identity.name || 'Salesman',
        clusterName: identity.cluster?.name || 'Belum ditugaskan',
        assignmentHistorical: identity.historical,
        date: dateStr,
        timeIn: formatTimeOnly(checkIn?.timestamp),
        timeOut: formatTimeOnly(checkOut?.timestamp),
        rawTimeIn: checkIn?.timestamp ? new Date(checkIn.timestamp).toISOString() : null,
        rawTimeOut: checkOut?.timestamp ? new Date(checkOut.timestamp).toISOString() : null,
        durationMinutes: durationMins,
        durationFormatted: durationMins==null?'Tidak tersedia':formatDurationHhMm(durationMins),
        attendanceMode,minimumDuration,durationCheckEnabled:attendanceMode==='IN_OUT'&&policy.ATTENDANCE_ENFORCE_MIN_DURATION!==false,visitSession:stop.visitSession,policyVersions:stop.policySnapshot?.versions||[],
        customerId: outlet.outletCode || 'Belum memiliki kode',
        customerName: outlet.name || 'Outlet',
        customerAddress: outlet.address || '-',
        subChannel: outlet.subChannel || (outlet.type === 'MODERN_TRADE' ? 'MT' : 'RETAIL'),
        freq: outlet.visitSchedule?.frequency || '—',
        itny: outlet.itineraryCode || '—',
        planCall: 'Y',
        actualCall: isActual ? 'Y' : 'N',
        effectiveCall: isEc ? 'Y' : isActual ? 'N' : '',
        extraCall: 'N',
        skuSold,
        orderAmount,
        reason: stop.validationOnly?`Validasi outlet · ${stop.validationResult?.state||'PENDING'}`:businessResult?.reason || checkOut?.earlyReason || (!isEc && isActual ? 'Tidak Ada Order' : isSkipped ? 'Belum Dikunjungi / Terlewat' : ''),
        earlyReason: checkOut?.earlyReason || null,
        visitOutcome:businessResult?.visitOutcome||null,
        remark: [businessResult?.notes || checkIn?.notes,visitOutcomeText(businessResult?.visitOutcome),stop.visitSession?.state==='INCOMPLETE'?'OUT terlewat · pengecualian SPV':attendanceMode!=='IN_OUT'?'Hasil kegiatan tanpa kewajiban OUT':''].filter(Boolean).join(' · '),
        deviationMeters: devMeters,
        targetAmount: 0,
        photoIn: checkIn?.photoUrl || null,
        photoOut: checkOut?.photoUrl || null,
        customerLat: outletLat,
        customerLng: outletLng,
        radiusMeters: maxAllowedRadius,
        distanceWarning: distWarning,
        isDurationAnomaly,
        isDistanceAnomaly,
        isSkipped,
        isExtraCall: false,
        status: stop.status,
      };

      salesMap[sId].stops.push(row);
    }
  }

  // Append Off-PJP calls into salesMap
  for (const off of offPjpList) {
    const offResult = offPjpSalesResult(off, { manualSalesMode });
    const identity = reportIdentity(off);
    const sId = identity.id || 'UNKNOWN';
    if (!salesMap[sId]) {
      salesMap[sId] = {
        salesmanId: sId,
        salesmanName: identity.name || 'Salesman',
        clusterName: identity.cluster?.name || 'Belum ditugaskan',
        stops: [],
      };
    }

    salesMap[sId].stops.push({
      id: off.id,
      sequence: 999,
      salesmanId: identity.id,
      salesmanName: identity.name || 'Salesman',
      clusterName: identity.cluster?.name || 'Belum ditugaskan',
      assignmentHistorical: identity.historical,
      date: dateStr,
      timeIn: formatTimeOnly(off.createdAt),
      timeOut: '-',
      rawTimeIn: new Date(off.createdAt).toISOString(),
      rawTimeOut: null,
      attendanceMode:'SINGLE_POINT',
      durationMinutes: null,
      durationFormatted: '-',
      customerId: off.outlet?.outletCode || 'EXTRA-CALL',
      customerName: off.outletName || 'Outlet Extra',
      customerAddress: off.address || '-',
      subChannel: 'RETAIL',
      freq: off.outlet?.visitSchedule?.frequency || '—',
      itny: 'EXTRA',
      planCall: 'N',
      actualCall: off.status === 'APPROVED' ? 'Y' : 'N',
      effectiveCall: offResult.effective ? 'Y' : 'N',
      extraCall: 'Y',
      skuSold: offResult.skuSold,
      orderAmount: offResult.orderAmount,
      reason: off.reason || 'Extra Call / Off-PJP',
      earlyReason: null,
      visitOutcome:off.visitOutcome||null,
      remark: [`Off-PJP: ${off.reason}`,visitOutcomeText(off.visitOutcome)].filter(Boolean).join(' · '),
      deviationMeters: null,
      targetAmount: 0,
      photoIn: off.photoUrl || null,
      photoOut: null,
      customerLat: off.latitude ?? null,
      customerLng: off.longitude ?? null,
      radiusMeters: GLOBAL_RADIUS,
      distanceWarning: 'UNAVAILABLE',
      isDurationAnomaly: false,
      isDistanceAnomaly: false,
      isSkipped: false,
      isExtraCall: true,
      status: off.status,
    });
  }

  // 3. Process Travel Time & Travel Gap Anomaly between consecutive stops for each salesman
  const allEnrichedRows = [];
  const salesmanDailySummaries = [];
  let globalSeq = 1;

  Object.values(salesMap).forEach((sales) => {
    // Sort salesman stops chronologically (visited stops first by timeIn, then unvisited by sequence)
    sales.stops.sort((a, b) => {
      if (a.rawTimeIn && b.rawTimeIn) {
        return new Date(a.rawTimeIn).getTime() - new Date(b.rawTimeIn).getTime();
      }
      if (a.rawTimeIn) return -1;
      if (b.rawTimeIn) return 1;
      return (a.sequence || 0) - (b.sequence || 0);
    });

    let prevStop = null;
    let sPlan = 0;
    let sActual = 0;
    let sPlannedActual = 0;
    let sEc = 0;
    let sExtra = 0;
    let sSkipped = 0;
    let sOnTime = 0;
    let sDurationAnomalies = 0;
    let sDistanceAnomalies = 0;
    let sTravelAnomalies = 0;
    let sTotalOmzet = 0;
    let sTotalSku = 0;

    sales.stops.forEach((stop, idx) => {
      stop.no = globalSeq++;
      if (stop.planCall === 'Y') sPlan += 1;
      if (stop.actualCall === 'Y') sActual += 1;
      if (stop.actualCall === 'Y' && stop.planCall === 'Y') sPlannedActual += 1;
      if (stop.effectiveCall === 'Y') sEc += 1;
      if (stop.isExtraCall) sExtra += 1;
      if (stop.isSkipped) sSkipped += 1;
      if (stop.isDurationAnomaly) sDurationAnomalies += 1;
      if (stop.isDistanceAnomaly) sDistanceAnomalies += 1;
      sTotalOmzet += stop.orderAmount || 0;
      sTotalSku += stop.skuSold || 0;

      // Travel Time calculation from prevStop to current stop
      let travelDistKm = null;
      let travelMins = null;
      let isTravelAnomaly = false;
      let travelAnomalyReason = null;
      let prevStopName = null;

      if (prevStop && prevStop.rawTimeIn && stop.rawTimeIn) {
        prevStopName = prevStop.customerName;
        // A gap requires departure evidence; IN alone also includes time spent at the outlet.
        const prevTime = prevStop.rawTimeOut ? new Date(prevStop.rawTimeOut).getTime() : NaN;
        const currTime = new Date(stop.rawTimeIn).getTime();
        if(Number.isFinite(prevTime)&&Number.isFinite(currTime)&&currTime>=prevTime)travelMins = Math.round((currTime - prevTime) / 60000);

        if ([prevStop.customerLat,prevStop.customerLng,stop.customerLat,stop.customerLng].every(Number.isFinite)) {
          const meters = calculateDistanceMeters(
            prevStop.customerLat,
            prevStop.customerLng,
            stop.customerLat,
            stop.customerLng
          );
          travelDistKm = Math.round((meters / 1000) * 10) / 10;
        }

        // TRAVEL GAP ANOMALY DETECTION (Dynamic Configs):
        // Case 1: Short distance (<= GAP_SHORT_KM) but took >= GAP_SHORT_MINS
        // Case 2: Medium distance (<= GAP_MED_KM) but took >= GAP_MED_MINS
        if (travelDistKm!==null&&travelMins!==null&&travelDistKm <= GAP_SHORT_KM && travelMins >= GAP_SHORT_MINS) {
          isTravelAnomaly = true;
          const hours = (travelMins / 60).toFixed(1);
          travelAnomalyReason = `Jarak antartitik outlet ${travelDistKm} km dari "${prevStopName}", dengan jeda OUT–IN ${travelMins} menit (~${hours} jam). Perlu peninjauan, bukan bukti rute GPS.`;
        } else if (travelDistKm!==null&&travelMins!==null&&travelDistKm <= GAP_MED_KM && travelMins >= GAP_MED_MINS) {
          isTravelAnomaly = true;
          const hours = (travelMins / 60).toFixed(1);
          travelAnomalyReason = `Jarak antartitik outlet ${travelDistKm} km dengan jeda OUT–IN ${travelMins} menit (~${hours} jam). Perlu peninjauan, bukan bukti rute GPS.`;
        }
      }

      if (isTravelAnomaly) sTravelAnomalies += 1;

      const isCompliant =
        stop.actualCall === 'Y' &&
        !stop.isDurationAnomaly &&
        !stop.isDistanceAnomaly &&
        !isTravelAnomaly;

      if (isCompliant) sOnTime += 1;

      stop.prevStopName = prevStopName;
      stop.travelDistanceKm = travelDistKm;
      stop.travelDurationMinutes = travelMins;
      stop.travelDurationFormatted = travelMins==null ? 'Tidak tersedia' : `${travelMins} m`;
      stop.isTravelAnomaly = isTravelAnomaly;
      stop.travelAnomalyReason = travelAnomalyReason;
      stop.isOnTimeAndCompliant = isCompliant;

      if (stop.actualCall === 'Y') {
        prevStop = stop;
      }

      allEnrichedRows.push(stop);
    });

    const sTotalAnomalies = sDurationAnomalies + sDistanceAnomalies + sTravelAnomalies;
    const complianceRate = sPlan > 0 ? `${Math.round((sPlannedActual / sPlan) * 100)}%` : '0%';
    const ecRate = sActual > 0 ? `${Math.round((sEc / sActual) * 100)}%` : '0%';

    salesmanDailySummaries.push({
      salesmanId: sales.salesmanId,
      salesmanName: sales.salesmanName,
      clusterName: new Set(sales.stops.map(stop => stop.clusterName)).size > 1 ? 'Beberapa penugasan pada periode' : sales.clusterName,
      planCalls: sPlan,
      actualCalls: sActual,
      complianceRate,
      effectiveCalls: sEc,
      ecRate,
      extraCalls: sExtra,
      skippedCalls: sSkipped,
      onTimeCompliantCalls: sOnTime,
      durationAnomalies: sDurationAnomalies,
      distanceAnomalies: sDistanceAnomalies,
      travelAnomalies: sTravelAnomalies,
      totalAnomalies: sTotalAnomalies,
      totalOmzet: sTotalOmzet,
      totalSkuSold: sTotalSku,
      stops: sales.stops,
    });
  });

  // 4. Apply Filtering
  let filteredRows = allEnrichedRows;

  if (search && search.trim()) {
    const s = search.trim().toLowerCase();
    filteredRows = filteredRows.filter(
      (r) =>
        r.customerName.toLowerCase().includes(s) ||
        r.customerId.toLowerCase().includes(s) ||
        r.salesmanName.toLowerCase().includes(s) ||
        r.customerAddress.toLowerCase().includes(s) ||
        (r.travelAnomalyReason || '').toLowerCase().includes(s) ||
        (r.earlyReason || '').toLowerCase().includes(s)
    );
  }

  if (filterType === 'EFFECTIVE_CALL') {
    filteredRows = filteredRows.filter((r) => r.effectiveCall === 'Y');
  } else if (filterType === 'NON_EFFECTIVE_CALL') {
    filteredRows = filteredRows.filter((r) => r.actualCall === 'Y' && r.effectiveCall === 'N');
  } else if (filterType === 'EXTRA_CALL') {
    filteredRows = filteredRows.filter((r) => r.isExtraCall);
  } else if (filterType === 'SKIPPED') {
    filteredRows = filteredRows.filter((r) => r.isSkipped);
  } else if (filterType === 'ANOMALY_DURATION') {
    filteredRows = filteredRows.filter((r) => r.isDurationAnomaly);
  } else if (filterType === 'ANOMALY_DISTANCE') {
    filteredRows = filteredRows.filter((r) => r.isDistanceAnomaly);
  } else if (filterType === 'ANOMALY_TRAVEL') {
    filteredRows = filteredRows.filter((r) => r.isTravelAnomaly);
  } else if (filterType === 'ALL_ANOMALIES') {
    filteredRows = filteredRows.filter(
      (r) => r.isDurationAnomaly || r.isDistanceAnomaly || r.isTravelAnomaly || r.isSkipped
    );
  }

  // 5. Calculate Summary KPIs
  const totalPlan = allEnrichedRows.filter((r) => r.planCall === 'Y').length;
  const totalActual = allEnrichedRows.filter((r) => r.actualCall === 'Y').length;
  const totalEc = allEnrichedRows.filter((r) => r.effectiveCall === 'Y').length;
  const totalExtra = allEnrichedRows.filter((r) => r.isExtraCall).length;
  const totalSkipped = allEnrichedRows.filter((r) => r.isSkipped).length;
  const totalDurationAnom = allEnrichedRows.filter((r) => r.isDurationAnomaly).length;
  const totalDistAnom = allEnrichedRows.filter((r) => r.isDistanceAnomaly).length;
  const totalTravelAnom = allEnrichedRows.filter((r) => r.isTravelAnomaly).length;
  const totalOnTime = allEnrichedRows.filter((r) => r.isOnTimeAndCompliant).length;
  const totalAnomalies = allEnrichedRows.filter(r=>r.isDurationAnomaly||r.isDistanceAnomaly||r.isTravelAnomaly).length;

  const totalOmzet = allEnrichedRows.reduce((sum, r) => sum + (r.orderAmount || 0), 0);
  const totalSku = allEnrichedRows.reduce((sum, r) => sum + (r.skuSold || 0), 0);

  const durationSum = allEnrichedRows
    .filter((r) => r.rawTimeOut && Number.isFinite(r.durationMinutes) && r.durationMinutes >= 0)
    .reduce((sum, r) => sum + r.durationMinutes, 0);
  const durationCount = allEnrichedRows.filter((r) => r.rawTimeOut && Number.isFinite(r.durationMinutes) && r.durationMinutes >= 0).length;
  const avgDuration = durationCount > 0 ? Math.round((durationSum / durationCount) * 10) / 10 : null;

  const totalPlannedActual = allEnrichedRows.filter(r => r.planCall === 'Y' && r.actualCall === 'Y').length;
  const complianceRate = totalPlan > 0 ? `${Math.round((totalPlannedActual / totalPlan) * 100)}%` : '0%';
  const ecRate = totalActual > 0 ? `${Math.round((totalEc / totalActual) * 100)}%` : '0%';

  return {
    basis: { ...reportBasis(), ...assignmentReportBasis({rawRecords:[...pjps,...offPjpList]}),...reportProvenance({manualSalesMode,minVisitDuration:MIN_VISIT_DURATION,radius:GLOBAL_RADIUS,travelGap:{shortKm:GAP_SHORT_KM,shortMinutes:GAP_SHORT_MINS,mediumKm:GAP_MED_KM,mediumMinutes:GAP_MED_MINS}},{rawRecords:[...pjps,...offPjpList]}) },
    meta: {
      date: dateStr,
      reportTitle: 'DAILY CALL & ATTENDANCE AUDIT REPORT',
      company: await getDynamicConfig('COMPANY_NAME', 'PT. SINAR ANUGRAH'),
      branch: await getDynamicConfig('DEFAULT_BRANCH', 'PADALARANG'),
    },
    summary: {
      totalPlanCalls: totalPlan,
      totalActualCalls: totalActual,
      totalPlannedActualCalls: totalPlannedActual,
      totalCollectionCalls:allEnrichedRows.filter(r=>r.actualCall==='Y'&&includesCollection(r.visitOutcome?.purpose)).length,
      totalPaymentPromises:allEnrichedRows.filter(r=>r.actualCall==='Y'&&r.visitOutcome?.result==='PROMISED').length,
      callComplianceRate: complianceRate,
      totalEffectiveCalls: totalEc,
      effectiveCallRate: ecRate,
      totalExtraCalls: totalExtra,
      totalSkippedCalls: totalSkipped,
      totalOnTimeCalls: totalOnTime,
      totalOrderAmount: totalOmzet,
      totalSkuSold: totalSku,
      avgDurationMinutes: avgDuration,
      durationSamples: durationCount,
      totalDurationAnomalies: totalDurationAnom,
      totalDistanceAnomalies: totalDistAnom,
      totalTravelAnomalies: totalTravelAnom,
      totalAnomalies,
    },
    salesmanSummaries: salesmanDailySummaries,
    rows: filteredRows,
  };
};
