import { prisma } from '../../config/prisma.js';
import { calculateDistanceMeters } from '../../utils/geolocation.js';
import { ATTENDANCE_TYPE, VISIT_STATUS } from '../../utils/constants.js';

function buildDayRange(dateString) {
  const start = new Date(dateString);
  start.setHours(0, 0, 0, 0);
  const end = new Date(dateString);
  end.setHours(23, 59, 59, 999);
  return { gte: start, lte: end };
}

function formatTimeOnly(date) {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function formatDurationHhMm(mins) {
  if (mins === null || mins === undefined || isNaN(mins)) return '00:00';
  const totalSec = Math.round(mins * 60);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Get Daily Call Report & Comprehensive Attendance Audit (ND6 Distribution Format)
 */
export const getDailyCallReport = async (query = {}) => {
  const targetDate = query.date ? new Date(query.date) : new Date();
  const dateStr = targetDate.toISOString().split('T')[0];
  const dayRange = buildDayRange(dateStr);

  const { userId, filterType, search } = query;

  const wherePjp = {
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
        },
        orderBy: { sequence: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // 2. Fetch Off-PJP calls for same date range if any
  const whereOffPjp = {
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
    const sId = pjp.user?.id || 'UNKNOWN';
    if (!salesMap[sId]) {
      salesMap[sId] = {
        salesmanId: sId,
        salesmanName: pjp.user?.name || 'Salesman',
        clusterName: pjp.user?.cluster?.name || 'Klaster Terjadwal',
        stops: [],
      };
    }

    for (const stop of pjp.stops) {
      const attendances = stop.attendances || [];
      const checkIn = attendances.find((a) => a.type === ATTENDANCE_TYPE.IN);
      const checkOut = attendances.find((a) => a.type === ATTENDANCE_TYPE.OUT);

      const outlet = stop.outlet || {};
      const outletLat = outlet.latitude || 0;
      const outletLng = outlet.longitude || 0;

      let devMeters = 0;
      if (checkIn?.latitude && outletLat) {
        devMeters = Math.round(
          calculateDistanceMeters(checkIn.latitude, checkIn.longitude, outletLat, outletLng)
        );
      } else if (checkIn?.deviationMeters) {
        devMeters = Math.round(checkIn.deviationMeters);
      }

      const distWarning = devMeters > 50 ? 'WARNING' : 'OK';

      let durationMins = checkOut?.durationMinutes;
      if (durationMins === undefined || durationMins === null) {
        if (checkIn && checkOut) {
          const inT = new Date(checkIn.timestamp).getTime();
          const outT = new Date(checkOut.timestamp).getTime();
          durationMins = Math.max(0, Math.round(((outT - inT) / 60000) * 10) / 10);
        } else if (checkIn && (stop.status === 'ARRIVED' || stop.status === 'IN_VISIT')) {
          const inT = new Date(checkIn.timestamp).getTime();
          durationMins = Math.max(0, Math.round(((Date.now() - inT) / 60000) * 10) / 10);
        } else {
          durationMins = 0;
        }
      }

      const isActual = !!checkIn || stop.status === 'VISITED';
      const orderAmount = Number(checkOut?.orderAmount || 0);
      const skuSold = Number(checkOut?.skuSold || 0);
      const isEc = isActual && (checkOut?.isEffectiveCall || orderAmount > 0 || skuSold > 0);

      const isDurationAnomaly = isActual && checkOut && durationMins > 0 && durationMins < 5;
      const isDistanceAnomaly = isActual && distWarning === 'WARNING';
      const isSkipped = !isActual;

      const row = {
        id: stop.id,
        sequence: stop.sequence,
        salesmanId: pjp.user?.id,
        salesmanName: pjp.user?.name || 'Salesman',
        clusterName: pjp.user?.cluster?.name || 'Klaster Terjadwal',
        date: dateStr,
        timeIn: formatTimeOnly(checkIn?.timestamp),
        timeOut: formatTimeOnly(checkOut?.timestamp),
        rawTimeIn: checkIn?.timestamp ? new Date(checkIn.timestamp).toISOString() : null,
        rawTimeOut: checkOut?.timestamp ? new Date(checkOut.timestamp).toISOString() : null,
        durationMinutes: durationMins,
        durationFormatted: formatDurationHhMm(durationMins),
        customerId: outlet.outletCode || `PVP${String(stop.sequence).padStart(4, '0')}`,
        customerName: outlet.name || 'Outlet',
        customerAddress: outlet.address || '-',
        subChannel: outlet.subChannel || (outlet.type === 'MODERN_TRADE' ? 'MT' : 'RETAIL'),
        freq: 'F2',
        itny: outlet.itineraryCode || 'SLD002W2',
        planCall: 'Y',
        actualCall: isActual ? 'Y' : 'N',
        effectiveCall: isEc ? 'Y' : isActual ? 'N' : '',
        extraCall: 'N',
        skuSold,
        orderAmount,
        reason: checkOut?.reason || checkOut?.earlyReason || (!isEc && isActual ? 'Tidak Ada Order' : isSkipped ? 'Belum Dikunjungi / Terlewat' : ''),
        earlyReason: checkOut?.earlyReason || null,
        remark: checkOut?.notes || checkIn?.notes || '',
        deviationMeters: devMeters,
        targetAmount: 0,
        photoIn: checkIn?.photoUrl || null,
        photoOut: checkOut?.photoUrl || null,
        customerLat: outletLat,
        customerLng: outletLng,
        radiusMeters: outlet.radiusMeters || 50,
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
    const sId = off.user?.id || 'UNKNOWN';
    if (!salesMap[sId]) {
      salesMap[sId] = {
        salesmanId: sId,
        salesmanName: off.user?.name || 'Salesman',
        clusterName: off.user?.cluster?.name || 'Extra Call',
        stops: [],
      };
    }

    salesMap[sId].stops.push({
      id: off.id,
      sequence: 999,
      salesmanId: off.user?.id,
      salesmanName: off.user?.name || 'Salesman',
      clusterName: 'Extra Call',
      date: dateStr,
      timeIn: formatTimeOnly(off.createdAt),
      timeOut: formatTimeOnly(off.createdAt),
      rawTimeIn: new Date(off.createdAt).toISOString(),
      rawTimeOut: new Date(off.createdAt).toISOString(),
      durationMinutes: 5,
      durationFormatted: '00:05',
      customerId: off.outlet?.outletCode || 'EXTRA-CALL',
      customerName: off.outletName || 'Outlet Extra',
      customerAddress: off.address || '-',
      subChannel: 'RETAIL',
      freq: 'F1',
      itny: 'EXTRA',
      planCall: 'N',
      actualCall: 'Y',
      effectiveCall: 'N',
      extraCall: 'Y',
      skuSold: 0,
      orderAmount: 0,
      reason: off.reason || 'Extra Call / Off-PJP',
      earlyReason: null,
      remark: `Off-PJP: ${off.reason}`,
      deviationMeters: 0,
      targetAmount: 0,
      photoIn: off.photoUrl || null,
      photoOut: null,
      customerLat: off.latitude || 0,
      customerLng: off.longitude || 0,
      radiusMeters: 50,
      distanceWarning: 'OK',
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
      if (stop.effectiveCall === 'Y') sEc += 1;
      if (stop.isExtraCall) sExtra += 1;
      if (stop.isSkipped) sSkipped += 1;
      if (stop.isDurationAnomaly) sDurationAnomalies += 1;
      if (stop.isDistanceAnomaly) sDistanceAnomalies += 1;
      sTotalOmzet += stop.orderAmount || 0;
      sTotalSku += stop.skuSold || 0;

      // Travel Time calculation from prevStop to current stop
      let travelDistKm = 0;
      let travelMins = 0;
      let isTravelAnomaly = false;
      let travelAnomalyReason = null;
      let prevStopName = null;

      if (prevStop && prevStop.rawTimeIn && stop.rawTimeIn) {
        prevStopName = prevStop.customerName;
        // Reference time: out of prev stop or in of prev stop
        const prevTime = new Date(prevStop.rawTimeOut || prevStop.rawTimeIn).getTime();
        const currTime = new Date(stop.rawTimeIn).getTime();
        travelMins = Math.max(0, Math.round((currTime - prevTime) / 60000));

        if (prevStop.customerLat && prevStop.customerLng && stop.customerLat && stop.customerLng) {
          const meters = calculateDistanceMeters(
            prevStop.customerLat,
            prevStop.customerLng,
            stop.customerLat,
            stop.customerLng
          );
          travelDistKm = Math.round((meters / 1000) * 10) / 10;
        }

        // TRAVEL GAP ANOMALY DETECTION:
        // Case 1: Short distance (<= 3 km) but took >= 45 mins (e.g. 2 km took 2 hours)
        // Case 2: Medium distance (<= 8 km) but took >= 90 mins (1.5 hours)
        if (travelDistKm <= 3 && travelMins >= 45) {
          isTravelAnomaly = true;
          const hours = (travelMins / 60).toFixed(1);
          travelAnomalyReason = `Jarak tempuh hanya ${travelDistKm} km dari "${prevStopName}", namun waktu jeda perjalanan mencapai ${travelMins} menit (~${hours} jam).`;
        } else if (travelDistKm <= 8 && travelMins >= 90) {
          isTravelAnomaly = true;
          const hours = (travelMins / 60).toFixed(1);
          travelAnomalyReason = `Jarak ${travelDistKm} km memakan waktu ${travelMins} menit (~${hours} jam).`;
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
      stop.travelDurationFormatted = travelMins > 0 ? `${travelMins} m` : '-';
      stop.isTravelAnomaly = isTravelAnomaly;
      stop.travelAnomalyReason = travelAnomalyReason;
      stop.isOnTimeAndCompliant = isCompliant;

      if (stop.actualCall === 'Y') {
        prevStop = stop;
      }

      allEnrichedRows.push(stop);
    });

    const sTotalAnomalies = sDurationAnomalies + sDistanceAnomalies + sTravelAnomalies;
    const complianceRate = sPlan > 0 ? `${Math.round((sActual / sPlan) * 100)}%` : '0%';
    const ecRate = sActual > 0 ? `${Math.round((sEc / sActual) * 100)}%` : '0%';

    salesmanDailySummaries.push({
      salesmanId: sales.salesmanId,
      salesmanName: sales.salesmanName,
      clusterName: sales.clusterName,
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
  const totalAnomalies = totalDurationAnom + totalDistAnom + totalTravelAnom;

  const totalOmzet = allEnrichedRows.reduce((sum, r) => sum + (r.orderAmount || 0), 0);
  const totalSku = allEnrichedRows.reduce((sum, r) => sum + (r.skuSold || 0), 0);

  const durationSum = allEnrichedRows
    .filter((r) => r.durationMinutes > 0)
    .reduce((sum, r) => sum + r.durationMinutes, 0);
  const durationCount = allEnrichedRows.filter((r) => r.durationMinutes > 0).length;
  const avgDuration = durationCount > 0 ? Math.round((durationSum / durationCount) * 10) / 10 : 0;

  const complianceRate = totalPlan > 0 ? `${Math.round((totalActual / totalPlan) * 100)}%` : '0%';
  const ecRate = totalActual > 0 ? `${Math.round((totalEc / totalActual) * 100)}%` : '0%';

  return {
    meta: {
      date: dateStr,
      reportTitle: 'DAILY CALL & ATTENDANCE AUDIT REPORT',
      company: 'CV. SINAR ANUGRAH',
      branch: 'PADALARANG',
    },
    summary: {
      totalPlanCalls: totalPlan,
      totalActualCalls: totalActual,
      callComplianceRate: complianceRate,
      totalEffectiveCalls: totalEc,
      effectiveCallRate: ecRate,
      totalExtraCalls: totalExtra,
      totalSkippedCalls: totalSkipped,
      totalOnTimeCalls: totalOnTime,
      totalOrderAmount: totalOmzet,
      totalSkuSold: totalSku,
      avgDurationMinutes: avgDuration,
      totalDurationAnomalies: totalDurationAnom,
      totalDistanceAnomalies: totalDistAnom,
      totalTravelAnomalies: totalTravelAnom,
      totalAnomalies,
    },
    salesmanSummaries: salesmanDailySummaries,
    rows: filteredRows,
  };
};
