import React, { useMemo } from 'react';
import { LuTarget, LuCircleCheck, LuClock, LuCompass, LuSparkles } from 'react-icons/lu';
import { calculateSalesPerformance } from '../../../services/salesPerformanceService';

/**
 * SalesDailyPerformanceTracker Component
 * Single Responsibility: Display a live visual tracker of daily visit quota and RJP compliance for Sales Rep.
 * 1 File = 1 Component
 */
export const SalesDailyPerformanceTracker = ({
  salesStops = [],
  offPjpAttendances = [],
  targetDailyVisits = 5,
}) => {
  const metrics = useMemo(
    () =>
      calculateSalesPerformance({
        salesStops,
        offPjpAttendances,
        targetDailyVisits,
      }),
    [salesStops, offPjpAttendances, targetDailyVisits]
  );

  const rjpPercent = Math.min(100, Math.round((metrics.rjpCompleted / metrics.targetDailyVisits) * 100));
  const offPjpValidPercent = Math.min(
    100 - rjpPercent,
    Math.round((metrics.offPjpValidated / metrics.targetDailyVisits) * 100)
  );

  return (
    <div className="bg-surface border border-border-glass rounded-2xl p-4 md:p-5 shadow-sm space-y-4">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg shrink-0">
            <LuTarget />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-on-surface">
                Target Kunjungan & Absensi Harian
              </h3>
              {metrics.isTargetMet ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
                  <LuCircleCheck className="text-xs" /> Target Tercapai
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20">
                  Kurang {metrics.remainingToTarget} Toko
                </span>
              )}
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Standar harian: minimum <strong>{metrics.targetDailyVisits} kunjungan absensi</strong> per hari.
            </p>
          </div>
        </div>

        {/* Adherence Rate Badge */}
        <div className="flex items-center gap-2 bg-surface-variant/30 px-3 py-1.5 rounded-xl border border-border-glass shrink-0 text-xs">
          <LuCompass className="text-primary text-sm shrink-0" />
          <div>
            <div className="text-on-surface-variant text-[10px]">Kepatuhan Rute RJP:</div>
            <div className="font-bold text-on-surface">
              {metrics.rjpAdherenceRate}% Kunjungan Terencana
            </div>
          </div>
        </div>
      </div>

      {/* Segmented Progress Bar */}
      <div className="space-y-2">
        <div className="h-3 w-full bg-surface-variant/50 rounded-full overflow-hidden flex">
          {/* RJP Completed bar */}
          <div
            style={{ width: `${rjpPercent}%` }}
            className="bg-primary h-full transition-all duration-500"
            title={`RJP Selesai: ${metrics.rjpCompleted} Toko`}
          />
          {/* Validated Off-PJP bar */}
          <div
            style={{ width: `${offPjpValidPercent}%` }}
            className="bg-tertiary h-full transition-all duration-500"
            title={`Luar RJP Tervalidasi: ${metrics.offPjpValidated} Toko`}
          />
        </div>

        {/* Progress Legend */}
        <div className="flex items-center justify-between text-xs text-on-surface-variant flex-wrap gap-2 pt-1">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" />
              <span>RJP Selesai: <strong className="text-on-surface">{metrics.rjpCompleted}</strong></span>
            </span>

            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-tertiary inline-block" />
              <span>Luar RJP Sah (SPV): <strong className="text-on-surface">{metrics.offPjpValidated}</strong></span>
            </span>

            {metrics.offPjpPending > 0 && (
              <span className="flex items-center gap-1.5 text-blue-600 font-medium">
                <LuClock className="text-xs" />
                <span>Menunggu Validasi: {metrics.offPjpPending}</span>
              </span>
            )}
          </div>

          <div className="font-bold text-on-surface">
            Total Valid: {metrics.totalValidVisits} / {metrics.targetDailyVisits} Kunjungan ({metrics.targetAchievementPercent}%)
          </div>
        </div>
      </div>
    </div>
  );
};
