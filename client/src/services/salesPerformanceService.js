/**
 * Sales Performance & RJP Adherence Service
 * Single Responsibility: Pure mathematical & analytical calculation of Sales visit metrics,
 * daily quota fulfillment, and RJP compliance vs Off-PJP deviation ratios.
 * 1 File = 1 Pure Logic Service
 */

/**
 * Calculates comprehensive daily sales performance and route compliance metrics.
 *
 * @param {Object} params
 * @param {Array} params.salesStops - List of daily scheduled PJP stops.
 * @param {Array} params.offPjpAttendances - List of off-PJP attendance records.
 * @param {number} [params.targetDailyVisits=5] - Minimum required daily attendance visits.
 * @param {string} [params.salesName] - Optional filter for a specific sales rep.
 * @returns {Object} Calculated metrics and compliance evaluation.
 */
export const calculateSalesPerformance = ({
  salesStops = [],
  offPjpAttendances = [],
  targetDailyVisits = 5,
  salesName = null,
}) => {
  // Filter for specific sales rep if provided
  const relevantOffPjp = salesName
    ? offPjpAttendances.filter((a) => !a.salesName || a.salesName.toLowerCase() === salesName.toLowerCase())
    : offPjpAttendances;

  // 1. RJP Metrics
  const rjpCompleted = salesStops.filter(
    (s) => s.status === 'ORDERED' || s.status === 'COMPLETED' || s.status === 'VISITED'
  ).length;
  const rjpSkipped = salesStops.filter((s) => s.status === 'SKIPPED').length;
  const rjpClosed = salesStops.filter((s) => s.status === 'CLOSED').length;
  const rjpRemaining = salesStops.filter(
    (s) => s.status !== 'ORDERED' && s.status !== 'COMPLETED' && s.status !== 'VISITED' && s.status !== 'SKIPPED'
  ).length;
  const rjpTotal = salesStops.length;

  // 2. Off-PJP Breakdown by Status
  const offPjpTotal = relevantOffPjp.length;
  const offPjpValidated = relevantOffPjp.filter((a) => a.validationStatus === 'TERVALIDASI').length;
  const offPjpPending = relevantOffPjp.filter((a) => a.validationStatus === 'MENUNGGU').length;
  const offPjpUnvalidated = relevantOffPjp.filter((a) => a.validationStatus === 'TIDAK_TERVALIDASI').length;
  const offPjpRejected = relevantOffPjp.filter((a) => a.validationStatus === 'DITOLAK').length;

  // 3. Quota & Target Calculations
  // Total valid visits = purely completed RJP + SPV-validated Off-PJP
  const totalValidVisits = rjpCompleted + offPjpValidated;
  // Total all recorded visit attempts
  const totalAttemptedVisits = rjpCompleted + offPjpTotal;

  const targetAchievementPercent = Math.round((totalValidVisits / Math.max(1, targetDailyVisits)) * 100);
  const isTargetMet = totalValidVisits >= targetDailyVisits;
  const remainingToTarget = Math.max(0, targetDailyVisits - totalValidVisits);

  // 4. RJP Compliance vs Off-PJP Ratio
  const rjpAdherenceRate =
    totalAttemptedVisits > 0 ? Math.round((rjpCompleted / totalAttemptedVisits) * 100) : 100;
  const offPjpDeviationRate = 100 - rjpAdherenceRate;

  // 5. Performance Verdict
  let complianceVerdict = 'Belum Ada Aktivitas';
  let complianceCategory = 'NEUTRAL'; // 'EXCELLENT', 'MITIGATED', 'HIGH_DEVIATION', 'IN_PROGRESS', 'DEFICIT'

  if (totalAttemptedVisits === 0) {
    complianceVerdict = 'Belum Ada Kunjungan Dicatat';
    complianceCategory = 'NEUTRAL';
  } else if (isTargetMet && rjpAdherenceRate >= 80) {
    complianceVerdict = 'Target Terpenuhi Murni Disiplin RJP';
    complianceCategory = 'EXCELLENT';
  } else if (isTargetMet && rjpAdherenceRate < 80) {
    complianceVerdict = 'Target Terpenuhi dengan Mitigasi Luar RJP';
    complianceCategory = 'MITIGATED';
  } else if (!isTargetMet && rjpAdherenceRate >= 80) {
    complianceVerdict = 'Sedang Berjalan (Disiplin Rute RJP)';
    complianceCategory = 'IN_PROGRESS';
  } else {
    complianceVerdict = 'Tinggi Deviasi Luar RJP (Perlu Review SPV)';
    complianceCategory = 'HIGH_DEVIATION';
  }

  return {
    targetDailyVisits,
    rjpTotal,
    rjpCompleted,
    rjpSkipped,
    rjpClosed,
    rjpRemaining,
    offPjpTotal,
    offPjpValidated,
    offPjpPending,
    offPjpUnvalidated,
    offPjpRejected,
    totalValidVisits,
    totalAttemptedVisits,
    targetAchievementPercent,
    isTargetMet,
    remainingToTarget,
    rjpAdherenceRate,
    offPjpDeviationRate,
    complianceVerdict,
    complianceCategory,
    relevantOffPjp,
  };
};
