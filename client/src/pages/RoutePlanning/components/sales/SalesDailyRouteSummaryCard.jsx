import React from 'react';
import { LuNavigation, LuStore, LuMapPin, LuClock } from 'react-icons/lu';
import '../../../../styles/components/SalesDailyRouteSummaryCard.css';

/**
 * SalesDailyRouteSummaryCard Component
 * Single Responsibility: Display today's assigned active route with TSP sequence for Sales Rep.
 * 1 File = 1 Component
 */
export const SalesDailyRouteSummaryCard = ({ activeRoute, stops = [] }) => {
  return (
    <div className="sales-daily-summary-card">
      <div className="sales-daily-header">
        <div>
          <div className="sales-daily-badge mb-1">
            <LuNavigation className="text-xs" />
            <span>Rute Aktif Hari Ini: {activeRoute?.day || 'Senin'}</span>
          </div>
          <h2 className="sales-daily-title">{activeRoute?.name || 'Klaster Cimahi Selatan & Leuwigajah'}</h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Ditugaskan oleh Supervisor: <strong className="text-on-surface">Ahmad Subagja</strong>
          </p>
        </div>

        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold flex items-center gap-1">
            <LuStore /> {stops.length} Toko Target
          </span>
          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-xs font-bold flex items-center gap-1">
            <LuClock /> Urutan TSP Teroptimasi
          </span>
        </div>
      </div>

      {/* Sequence of stops */}
      <div className="sales-stops-sequence-list">
        <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
          Urutan Titik Kunjungan (Tanpa Zigzag):
        </h4>
        {stops.slice(0, 4).map((stop, idx) => (
          <div key={stop.id || idx} className="sales-stop-mini-item">
            <div className="flex items-center gap-3">
              <div className="sales-stop-seq-num">#{idx + 1}</div>
              <div>
                <div className="font-bold text-on-surface">{stop.customerName || stop.outletName}</div>
                <div className="text-xs text-on-surface-variant flex items-center gap-1">
                  <LuMapPin className="text-[11px] text-primary" />
                  {stop.address}
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-surface-container font-mono">
                {stop.callFrequency || 'F2'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
