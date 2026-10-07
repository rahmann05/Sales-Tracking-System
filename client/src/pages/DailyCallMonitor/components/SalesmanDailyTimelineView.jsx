import { SalesmanTimelineList } from './SalesmanTimelineList';
import React, { useState } from 'react';
import { LuUser, LuNavigation } from 'react-icons/lu';
/**
 * SalesmanDailyTimelineView Component
 * Single Responsibility: Render per-salesman daily attendance audit and chronological route timeline
 * (Tracking On-time compliance, Extra calls, Skipped calls, Early checkout, GPS deviations, and Travel gap anomalies).
 */
export const SalesmanDailyTimelineView = ({
  salesmanSummaries = [],
  isLoading = false,
  onSelectStop
}) => {
  const [expandedSalesmanId, setExpandedSalesmanId] = useState(() => {
    return salesmanSummaries[0]?.salesmanId || null;
  });
  if (isLoading) {
    return <div className="p-8 bg-surface rounded-2xl border border-border-glass text-center space-y-2">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-on-surface-variant font-bold">Menyiapkan Rekap Rute Per Sales...</p>
      </div>;
  }
  if (!salesmanSummaries || salesmanSummaries.length === 0) {
    return <div className="p-8 bg-surface rounded-2xl border border-border-glass text-center space-y-2">
        <LuUser className="text-3xl text-on-surface-variant/40 mx-auto" />
        <h4 className="text-sm font-bold text-on-surface m-0">Tidak Ada Rute Sales Terjadwal</h4>
        <p className="text-xs text-on-surface-variant m-0">
          Tidak ditemukan jadwal PJP atau riwayat absensi untuk kriteria yang dipilih.
        </p>
      </div>;
  }
  return <div className="space-y-4">
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
      <SalesmanTimelineList expandedSalesmanId={expandedSalesmanId} onSelectStop={onSelectStop} salesmanSummaries={salesmanSummaries} setExpandedSalesmanId={setExpandedSalesmanId} />
    </div>;
};
