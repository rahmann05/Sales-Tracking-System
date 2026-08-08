import React, { useMemo } from 'react';
import {
  LuTrendingUp,
  LuCompass,
  LuStore,
  LuClock,
  LuCircleCheck,
  LuUser,
  LuMapPin,
} from 'react-icons/lu';
import { calculateSalesPerformance } from '../../../services/salesPerformanceService';
import { Avatar } from '../../../components/common/Avatar';

/**
 * SupervisorPerformanceAnalytics Component
 * Single Responsibility: Visualize and evaluate Sales visit fulfillment, pure RJP compliance rate,
 * team member breakdown, and out-of-route attendance deviation for Supervisor review.
 * 1 File = 1 Component
 */
export const SupervisorPerformanceAnalytics = ({
  salesStops = [],
  offPjpAttendances = [],
}) => {
  const overallMetrics = useMemo(
    () =>
      calculateSalesPerformance({
        salesStops,
        offPjpAttendances,
        targetDailyVisits: 10,
      }),
    [salesStops, offPjpAttendances]
  );

  // Calculate breakdown for each sales rep
  const salesTeamBreakdown = useMemo(() => {
    const reps = [
      { name: 'Budi Santoso', cluster: 'Klaster Cimahi Tengah', plan: 'RJP-CIMAHI-01', day: 'Senin', stops: salesStops.slice(0, 10) },
      { name: 'Siti Rahma', cluster: 'Klaster Padalarang', plan: 'RJP-PADALARANG-01', day: 'Selasa', stops: salesStops.slice(10, 20) },
      { name: 'Agus Wijaya', cluster: 'Klaster Lembang', plan: 'RJP-LEMBANG-01', day: 'Rabu', stops: salesStops.slice(20, 30) },
    ];

    return reps.map((rep) => {
      const completed = rep.stops.filter((s) => s.status === 'COMPLETED' || s.status === 'ORDERED').length;
      const inVisit = rep.stops.filter((s) => s.status === 'IN_VISIT' || s.status === 'ARRIVED').length;
      const closed = rep.stops.filter((s) => s.status === 'CLOSED' || s.status === 'SKIPPED').length;
      const total = rep.stops.length || 10;
      const progress = Math.round((completed / total) * 100);

      return {
        ...rep,
        completed,
        inVisit,
        closed,
        total,
        progress,
      };
    });
  }, [salesStops]);

  return (
    <div className="space-y-6">
      {/* KPI Overview Box */}
      <div className="bg-surface border border-border-glass rounded-3xl p-5 md:p-6 shadow-sm space-y-6">
        {/* Section Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-glass pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-base">
                <LuTrendingUp />
              </span>
              <h3 className="text-lg font-black text-on-surface tracking-tight">
                Progres Kunjungan Tim Sales (Hari Ini)
              </h3>
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              Monitoring pemenuhan target kunjungan toko per sales dan rasio kepatuhan rute RJP terencana.
            </p>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 self-start sm:self-auto ${
              overallMetrics.complianceCategory === 'EXCELLENT'
                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                : overallMetrics.complianceCategory === 'MITIGATED'
                ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                : overallMetrics.complianceCategory === 'HIGH_DEVIATION'
                ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                : 'bg-surface-variant text-on-surface-variant'
            }`}
          >
            {overallMetrics.complianceVerdict}
          </span>
        </div>

        {/* 4 Analytical KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* 1. RJP Pure Visits */}
          <div className="p-4 bg-surface-variant/20 rounded-2xl border border-border-glass space-y-1">
            <span className="text-[11px] text-on-surface-variant font-medium flex items-center gap-1">
              <LuStore className="text-primary text-xs" /> Kunjungan Sesuai RJP
            </span>
            <div className="text-2xl font-black text-on-surface">
              {overallMetrics.rjpCompleted} <span className="text-xs font-normal text-on-surface-variant">/ {overallMetrics.rjpTotal} Toko</span>
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
              <LuCircleCheck className="text-[10px]" /> Disiplin Rute RJP
            </div>
          </div>

          {/* 2. Off-PJP Extra Visits */}
          <div className="p-4 bg-surface-variant/20 rounded-2xl border border-border-glass space-y-1">
            <span className="text-[11px] text-on-surface-variant font-medium flex items-center gap-1">
              <LuCompass className="text-tertiary text-xs" /> Absen di Luar RJP
            </span>
            <div className="text-2xl font-black text-on-surface">
              {overallMetrics.offPjpTotal} <span className="text-xs font-normal text-on-surface-variant">Kunjungan</span>
            </div>
            <div className="text-[10px] text-on-surface-variant">
              {overallMetrics.offPjpValidated} Sah • {overallMetrics.offPjpPending} Menunggu SPV
            </div>
          </div>

          {/* 3. Adherence Ratio */}
          <div className="p-4 bg-surface-variant/20 rounded-2xl border border-border-glass space-y-1">
            <span className="text-[11px] text-on-surface-variant font-medium flex items-center gap-1">
              <LuCompass className="text-primary text-xs" /> Kepatuhan Rute RJP
            </span>
            <div className="text-2xl font-black text-on-surface">
              {overallMetrics.rjpAdherenceRate}%
            </div>
            <div className="text-[10px] text-on-surface-variant">
              {overallMetrics.offPjpDeviationRate}% Deviasi Luar Rute
            </div>
          </div>

          {/* 4. Target Fulfillment */}
          <div className="p-4 bg-surface-variant/20 rounded-2xl border border-border-glass space-y-1">
            <span className="text-[11px] text-on-surface-variant font-medium flex items-center gap-1">
              <LuTrendingUp className="text-primary text-xs" /> Total Kunjungan Tim
            </span>
            <div className="text-2xl font-black text-on-surface">
              {overallMetrics.totalValidVisits} <span className="text-xs font-normal text-on-surface-variant">Toko</span>
            </div>
            <div className="text-[10px] font-semibold text-emerald-600">
              3 Tim Sales Aktif Hari Ini
            </div>
          </div>
        </div>

        {/* Visual Route Adherence Ratio Gauge */}
        <div className="space-y-2 p-4 bg-surface-variant/15 rounded-2xl border border-border-glass">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-on-surface">Distribusi Kunjungan Lapangan:</span>
            <span className="text-on-surface-variant font-mono text-[11px]">
              Total {overallMetrics.totalAttemptedVisits} Aktivitas Kunjungan
            </span>
          </div>

          <div className="h-3 w-full bg-surface-variant/40 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${overallMetrics.rjpAdherenceRate}%` }}
              className="bg-primary h-full transition-all"
              title={`Kunjungan Murni RJP: ${overallMetrics.rjpAdherenceRate}%`}
            />
            <div
              style={{ width: `${overallMetrics.offPjpDeviationRate}%` }}
              className="bg-tertiary h-full transition-all"
              title={`Deviasi Luar RJP: ${overallMetrics.offPjpDeviationRate}%`}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-on-surface-variant flex-wrap gap-2 pt-0.5">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                <span>Kunjungan RJP Terencana ({overallMetrics.rjpAdherenceRate}%)</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-tertiary inline-block" />
                <span>Kunjungan Luar RJP ({overallMetrics.offPjpDeviationRate}%)</span>
              </span>
            </div>

            {overallMetrics.offPjpPending > 0 && (
              <span className="text-blue-600 font-semibold flex items-center gap-1">
                <LuClock className="text-xs" />
                Ada {overallMetrics.offPjpPending} absen luar RJP menunggu validasi Anda.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Individual Sales Rep Progress Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-base font-bold text-on-surface flex items-center gap-2">
              <LuUser className="text-primary text-base" />
              <span>Progres per Sales Representative</span>
            </h4>
            <p className="text-xs text-on-surface-variant">
              Realisasi kunjungan harian per sales person di bawah supervisi Anda
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {salesTeamBreakdown.map((rep) => (
            <div
              key={rep.name}
              className="bg-surface border border-border-glass rounded-2xl p-4 shadow-sm hover:border-primary/30 transition-all flex flex-col justify-between gap-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={rep.name} size="md" className="rounded-xl ring-1 ring-primary/20" />
                  <div>
                    <h5 className="font-bold text-on-surface text-sm">{rep.name}</h5>
                    <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
                      <LuMapPin className="text-[10px] text-primary" />
                      {rep.cluster}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-lg">
                  {rep.progress}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5 pt-1">
                <div className="w-full h-2 bg-surface-variant/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(rep.progress, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                  <span className="text-emerald-600 font-semibold">
                    {rep.completed} Selesai
                  </span>
                  {rep.inVisit > 0 && (
                    <span className="text-blue-600 font-semibold">
                      {rep.inVisit} Sedang Kunjung
                    </span>
                  )}
                  {rep.closed > 0 && (
                    <span className="text-rose-600 font-semibold">
                      {rep.closed} Tutup
                    </span>
                  )}
                  <span>Target: {rep.total} Toko</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
