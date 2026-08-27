import React, { useState } from 'react';
import {
  LuUser,
  LuClock,
  LuMapPin,
  LuChevronDown,
  LuChevronUp,
  LuNavigation,
  LuCheck,
  LuPlus,
  LuHourglass,
  LuShieldAlert,
} from 'react-icons/lu';
import { FiAlertTriangle } from 'react-icons/fi';

/**
 * SalesmanDailyTimelineView Component
 * Single Responsibility: Render per-salesman daily attendance audit and chronological route timeline
 * (Tracking On-time compliance, Extra calls, Skipped calls, Early checkout, GPS deviations, and Travel gap anomalies).
 */
export const SalesmanDailyTimelineView = ({
  salesmanSummaries = [],
  isLoading = false,
  onSelectStop,
}) => {
  const [expandedSalesmanId, setExpandedSalesmanId] = useState(() => {
    return salesmanSummaries[0]?.salesmanId || null;
  });

  if (isLoading) {
    return (
      <div className="p-8 bg-surface rounded-2xl border border-border-glass text-center space-y-2">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-on-surface-variant font-bold">Menyiapkan Rekap Rute Per Sales...</p>
      </div>
    );
  }

  if (!salesmanSummaries || salesmanSummaries.length === 0) {
    return (
      <div className="p-8 bg-surface rounded-2xl border border-border-glass text-center space-y-2">
        <LuUser className="text-3xl text-on-surface-variant/40 mx-auto" />
        <h4 className="text-sm font-bold text-on-surface m-0">Tidak Ada Rute Sales Terjadwal</h4>
        <p className="text-xs text-on-surface-variant m-0">
          Tidak ditemukan jadwal PJP atau riwayat absensi untuk kriteria yang dipilih.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* View Title */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-black text-on-surface uppercase tracking-wider flex items-center gap-1.5 m-0">
            <LuNavigation className="text-primary" /> Audit Rute & Timeline Kronologis Per Salesman
          </h4>
          <p className="text-[11px] text-on-surface-variant m-0 mt-0.5">
            Melacak konsistensi rute, waktu tempuh antar-titik toko (misal 2 km vs 2 jam), extra call di luar PJP, dan kunjungan yang terlewat.
          </p>
        </div>

        <span className="px-2.5 py-1 rounded-xl bg-surface-container text-xs font-bold text-on-surface border border-border-glass">
          {salesmanSummaries.length} Sales Aktif
        </span>
      </div>

      {/* Accordion Cards per Salesman */}
      <div className="space-y-3">
        {salesmanSummaries.map((sales) => {
          const isExpanded = expandedSalesmanId === sales.salesmanId;
          const hasAnomalies = sales.travelAnomalies > 0 || sales.durationAnomalies > 0;

          return (
            <div
              key={sales.salesmanId}
              className={`rounded-2xl border transition-all overflow-hidden bg-surface shadow-xs ${
                hasAnomalies ? 'border-amber-500/40' : 'border-border-glass hover:border-primary/40'
              }`}
            >
              {/* Salesman Header Summary Bar */}
              <div
                onClick={() => setExpandedSalesmanId(isExpanded ? null : sales.salesmanId)}
                className="p-4 cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-3 select-none"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary font-black flex items-center justify-center text-sm shrink-0 mt-0.5">
                    {sales.salesmanName
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-black text-on-surface m-0">
                        {sales.salesmanName}
                      </h4>
                      <span className="text-xs text-on-surface-variant font-medium">
                        ({sales.clusterName})
                      </span>

                      {sales.travelAnomalies === 0 && sales.durationAnomalies === 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold inline-flex items-center gap-1">
                          <LuCheck className="text-[10px]" /> 100% Tertib SOP
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-on-surface-variant mt-1 flex-wrap font-medium">
                      <span>
                        Call: <strong>{sales.visitedCalls}/{sales.totalPlannedCalls} ({sales.callComplianceRate})</strong>
                      </span>
                      <span>•</span>
                      <span>
                        EC: <strong className="text-purple-600">{sales.effectiveCalls} Toko ({sales.effectiveCallRate})</strong>
                      </span>
                      <span>•</span>
                      <span className="font-bold text-emerald-600">
                        Rp {(sales.totalOmzet || 0).toLocaleString('id-ID')} ({sales.totalSkuSold} SKU)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Counters Pills */}
                <div className="flex items-center gap-2 flex-wrap lg:self-auto">
                  <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 text-[10px] font-black border border-emerald-500/20 inline-flex items-center gap-1">
                    <LuCheck className="text-xs" /> Sesuai: {sales.onTimeCompliantCalls}
                  </span>

                  {sales.extraCalls > 0 && (
                    <span className="px-2 py-1 rounded-lg bg-blue-500/10 text-blue-700 text-[10px] font-black border border-blue-500/20 inline-flex items-center gap-1">
                      <LuPlus className="text-xs" /> Extra: {sales.extraCalls}
                    </span>
                  )}

                  {sales.skippedCalls > 0 && (
                    <span className="px-2 py-1 rounded-lg bg-gray-500/10 text-gray-700 text-[10px] font-black border border-gray-500/20 inline-flex items-center gap-1">
                      <LuHourglass className="text-xs" /> Terlewat: {sales.skippedCalls}
                    </span>
                  )}

                  {sales.travelAnomalies > 0 && (
                    <span className="px-2 py-1 rounded-lg bg-rose-500/10 text-rose-700 text-[10px] font-black border border-rose-500/20 inline-flex items-center gap-1">
                      <LuShieldAlert className="text-xs" /> Jeda Travel: {sales.travelAnomalies}
                    </span>
                  )}

                  {sales.durationAnomalies > 0 && (
                    <span className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-700 text-[10px] font-black border border-amber-500/20 inline-flex items-center gap-1">
                      <FiAlertTriangle className="text-xs" /> Durasi &lt;5m: {sales.durationAnomalies}
                    </span>
                  )}

                  <div className="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant ml-1">
                    {isExpanded ? <LuChevronUp /> : <LuChevronDown />}
                  </div>
                </div>
              </div>

              {/* Expanded Route Timeline */}
              {isExpanded && (
                <div className="p-4 pt-0 border-t border-border-glass bg-surface-container/30 space-y-3">
                  <div className="py-2 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                    Kronologi Perjalanan Rute Harian (Stop 1 s/d Stop {sales.stops.length}):
                  </div>

                  <div className="space-y-3 relative pl-4 border-l-2 border-primary/20 ml-2">
                    {sales.stops.map((stop, sIdx) => {
                      const isShort = stop.isDurationAnomaly;
                      const isFar = stop.isDistanceAnomaly;
                      const isTravelAnom = stop.isTravelAnomaly;
                      const isSkipped = stop.isSkipped;
                      const isExtra = stop.isExtraCall;

                      return (
                        <div key={stop.id || sIdx} className="relative space-y-2">
                          {/* Travel Gap Indicator between Stop (sIdx - 1) and Stop (sIdx) */}
                          {stop.prevStopName && (
                            <div
                              className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 ${
                                isTravelAnom
                                  ? 'bg-rose-500/15 border border-rose-500/40 text-rose-800'
                                  : 'bg-surface-container border border-border-glass text-on-surface-variant'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <LuNavigation className={`text-sm ${isTravelAnom ? 'text-rose-600 animate-bounce' : 'text-primary'}`} />
                                <span>
                                  Jarak dari <strong>"{stop.prevStopName}"</strong>: {stop.travelDistanceKm} km • Waktu Jeda: <strong>{stop.travelDurationFormatted}</strong>
                                </span>
                              </div>

                              {isTravelAnom ? (
                                <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                                  <LuShieldAlert className="text-[10px]" /> Jeda Perjalanan Janggal!
                                </span>
                              ) : (
                                <span className="text-[10px] text-emerald-600 font-bold">Normal</span>
                              )}
                            </div>
                          )}

                          {/* Stop Card */}
                          <div
                            onClick={() => onSelectStop && onSelectStop(stop)}
                            className={`p-3.5 rounded-xl border transition-all cursor-pointer bg-surface ${
                              isTravelAnom || isShort || isFar
                                ? 'border-rose-500/30 hover:border-rose-500'
                                : isSkipped
                                ? 'border-dashed border-gray-300 opacity-75'
                                : 'border-border-glass hover:border-primary/40'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-start gap-2.5">
                                <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                                  #{sIdx + 1}
                                </span>

                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h5 className="text-xs font-black text-on-surface m-0">
                                      {stop.customerName}
                                    </h5>
                                    <span className="text-[10px] font-mono text-on-surface-variant">
                                      ({stop.customerId})
                                    </span>

                                    {isExtra && (
                                      <span className="px-1.5 py-0.2 rounded-md bg-blue-500/10 text-blue-700 text-[10px] font-black inline-flex items-center gap-0.5">
                                        <LuPlus className="text-[9px]" /> Extra Call
                                      </span>
                                    )}
                                    {isSkipped && (
                                      <span className="px-1.5 py-0.2 rounded-md bg-gray-500/10 text-gray-700 text-[10px] font-black inline-flex items-center gap-0.5">
                                        <LuHourglass className="text-[9px]" /> Belum Dikunjungi
                                      </span>
                                    )}
                                    {stop.effectiveCall === 'Y' && (
                                      <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-700 text-[10px] font-black inline-flex items-center gap-0.5">
                                        <LuCheck className="text-[9px]" /> EC (Rp {(stop.orderAmount || 0).toLocaleString('id-ID')})
                                      </span>
                                    )}
                                  </div>

                                  <p className="text-[11px] text-on-surface-variant m-0 mt-0.5">
                                    {stop.customerAddress}
                                  </p>
                                </div>
                              </div>

                              {/* Time & Duration Info */}
                              <div className="flex items-center gap-3 text-xs self-start sm:self-auto font-mono">
                                <div>
                                  <span className="text-[10px] text-on-surface-variant block">Jam In &rarr; Out</span>
                                  <strong>{stop.timeIn || '-'} &rarr; {stop.timeOut || '-'}</strong>
                                </div>

                                <div>
                                  <span className="text-[10px] text-on-surface-variant block">Durasi</span>
                                  <span
                                    className={`font-black px-2 py-0.5 rounded-md ${
                                      isShort
                                        ? 'bg-rose-500/15 text-rose-600 border border-rose-500/30'
                                        : 'bg-surface-container text-on-surface'
                                    }`}
                                  >
                                    {stop.durationFormatted}
                                  </span>
                                </div>

                                <div>
                                  <span className="text-[10px] text-on-surface-variant block">Deviasi GPS</span>
                                  <span
                                    className={`font-bold px-1.5 py-0.5 rounded-md ${
                                      isFar ? 'bg-amber-500/15 text-amber-700' : 'text-on-surface'
                                    }`}
                                  >
                                    {stop.deviationMeters} m
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Anomaly Alerts Details */}
                            {(isTravelAnom || isShort || isFar || stop.earlyReason) && (
                              <div className="mt-2.5 pt-2 border-t border-rose-500/20 space-y-1 text-xs">
                                {stop.travelAnomalyReason && (
                                  <div className="text-rose-700 font-bold flex items-center gap-1.5">
                                    <FiAlertTriangle className="shrink-0" />
                                    <span>{stop.travelAnomalyReason}</span>
                                  </div>
                                )}

                                {isShort && (
                                  <div className="text-rose-700 font-semibold flex items-center gap-1.5">
                                    <LuClock className="shrink-0" />
                                    <span>Kunjungan terlalu singkat (&lt; 5 menit). {stop.earlyReason ? `Alasan: "${stop.earlyReason}"` : ''}</span>
                                  </div>
                                )}

                                {isFar && (
                                  <div className="text-amber-700 font-semibold flex items-center gap-1.5">
                                    <LuMapPin className="shrink-0" />
                                    <span>Check-in berada {stop.deviationMeters} meter di luar koordinat fisik toko (radius 50m).</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
