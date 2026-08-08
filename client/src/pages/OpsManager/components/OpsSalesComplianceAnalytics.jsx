import React, { useMemo } from 'react';
import { LuTrendingUp, LuCompass, LuShieldAlert, LuCircleCheck, LuTriangleAlert, LuUsers } from 'react-icons/lu';
import { calculateSalesPerformance } from '../../../services/salesPerformanceService';

/**
 * OpsSalesComplianceAnalytics Component
 * Single Responsibility: Macro-level executive dashboard for Operational Manager
 * to evaluate sales quota fulfillment, pure RJP adherence, and out-of-route deviations.
 * 1 File = 1 Component
 */
export const OpsSalesComplianceAnalytics = ({
  salesStops = [],
  offPjpAttendances = [],
  rjpTeams = [],
}) => {
  const regionalMetrics = useMemo(
    () =>
      calculateSalesPerformance({
        salesStops,
        offPjpAttendances,
        targetDailyVisits: 5,
      }),
    [salesStops, offPjpAttendances]
  );

  return (
    <div className="bg-surface border border-border-glass rounded-2xl p-5 md:p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-glass pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
              <LuCompass />
            </span>
            <h3 className="text-base font-bold text-on-surface">
              Audit Kepatuhan Rute RJP & Deviasi Kunjungan (Manajerial)
            </h3>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            Penilaian efektivitas master RJP: Membandingkan realisasi kunjungan murni RJP vs frekuensi presensi di luar RJP.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="px-3 py-1 bg-primary/10 text-primary rounded-full border border-primary/20">
            Rasio Kepatuhan Regional: {regionalMetrics.rjpAdherenceRate}%
          </span>
        </div>
      </div>

      {/* 3 Executive Insight Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pillar 1: Pure RJP Execution */}
        <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
              <LuCircleCheck className="text-emerald-600" /> Kunjungan Murni RJP
            </span>
            <span className="text-xs font-mono font-bold text-emerald-600">
              {regionalMetrics.rjpAdherenceRate}%
            </span>
          </div>
          <div className="text-2xl font-extrabold text-on-surface">
            {regionalMetrics.rjpCompleted} <span className="text-xs font-normal text-on-surface-variant">/ {regionalMetrics.rjpTotal} Toko Target</span>
          </div>
          <p className="text-[11px] text-on-surface-variant">
            Kunjungan sales yang 100% disiplin mengikuti jadwal klaster & urutan TSP optimal.
          </p>
        </div>

        {/* Pillar 2: Out of Route (Off-PJP) */}
        <div className="p-4 bg-tertiary/10 rounded-2xl border border-tertiary/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-tertiary flex items-center gap-1.5">
              <LuCompass /> Presensi di Luar RJP
            </span>
            <span className="text-xs font-mono font-bold text-tertiary">
              {regionalMetrics.offPjpTotal} Total
            </span>
          </div>
          <div className="text-2xl font-extrabold text-on-surface">
            {regionalMetrics.offPjpValidated} <span className="text-xs font-normal text-emerald-600 font-semibold">Tervalidasi Sah</span>
          </div>
          <p className="text-[11px] text-on-surface-variant">
            Mitigasi insiden toko tutup / order dadakan yang telah disetujui Supervisor ({regionalMetrics.offPjpPending} pending).
          </p>
        </div>

        {/* Pillar 3: Evaluation Verdict */}
        <div className="p-4 bg-surface-variant/20 rounded-2xl border border-border-glass space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
              <LuTrendingUp className="text-primary" /> Evaluasi Master RJP
            </span>
          </div>
          <div className="text-base font-bold text-on-surface truncate">
            {regionalMetrics.complianceVerdict}
          </div>
          <p className="text-[11px] text-on-surface-variant">
            {regionalMetrics.offPjpDeviationRate > 30
              ? 'Tingkat deviasi di luar RJP cukup tinggi. Disarankan evaluasi master routing titik toko yang sering tutup.'
              : 'Perencanaan master RJP efektif dan ditaati dengan baik oleh tim lapangan.'}
          </p>
        </div>
      </div>

      {/* Cluster & Team Breakdown Preview */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
          <LuUsers className="text-primary text-sm" /> Ringkasan Evaluasi Kepatuhan Per Tim Supervisor ({rjpTeams.length} Tim Aktif):
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {rjpTeams.map((team, idx) => {
            // Mock individual team compliance ratio
            const isTeam1 = idx === 0;
            const teamAdherence = isTeam1 ? regionalMetrics.rjpAdherenceRate : 92;
            const teamOffPjp = isTeam1 ? regionalMetrics.offPjpTotal : 0;

            return (
              <div
                key={team.id || idx}
                className="p-4 bg-surface-variant/15 rounded-2xl border border-border-glass space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-on-surface text-sm">{team.teamName}</h5>
                    <p className="text-xs text-on-surface-variant">SPV: {team.spvName || 'Ahmad Subagja'}</p>
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      teamAdherence >= 80
                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-700 border border-amber-500/20'
                    }`}
                  >
                    {teamAdherence}% Kepatuhan RJP
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs bg-surface/80 p-2.5 rounded-xl border border-border-glass">
                  <div>
                    <div className="text-[10px] text-on-surface-variant">RJP Selesai</div>
                    <div className="font-bold text-on-surface">{isTeam1 ? regionalMetrics.rjpCompleted : 4} Toko</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-on-surface-variant">Luar RJP</div>
                    <div className="font-bold text-tertiary">{teamOffPjp} Presensi</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-on-surface-variant">Status Target</div>
                    <div className="font-bold text-emerald-600">Tercapai</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
