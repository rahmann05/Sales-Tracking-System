import React from 'react';
import { LuClock, LuMapPin, LuShieldAlert, LuFileSpreadsheet, LuCar } from "react-icons/lu";

/**
 * SuspiciousAttendanceTable Component
 * Single Responsibility: Dedicated table and audit dashboard for abnormal / suspicious attendances
 * (Early checkout < 5 minutes, GPS deviation > 50 meters, Travel time gaps e.g. 2km in 2 hours, and Skipped visits).
 */
export function SuspiciousAttendanceSummary({
  exportSuspiciousCsv,
  filterAnomalyType,
  setFilterAnomalyType,
  suspiciousRows
}) {
  return <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 suspicious-header-mobile">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
            <LuShieldAlert className="text-xl" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-black text-rose-700 m-0 uppercase tracking-tight">
                Tabel Khusus Audit Absensi Janggal & Anomali Lapangan
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black">
                {suspiciousRows.length} Temuan
              </span>
            </div>
            <p className="text-xs text-rose-800/80 m-0 mt-0.5">
              Daftar kunjungan yang memerlukan evaluasi supervisor: durasi kunjungan &lt; 5 menit, deviasi GPS &gt; 50 meter, jeda perjalanan antar toko tidak wajar (misal 2 km vs 2 jam), atau jadwal terlewat.
            </p>
          </div>
        </div>

        {/* Filter Pills & Export */}
        <div className="flex items-center gap-2 flex-wrap self-start md:self-auto suspicious-filter-pills-mobile w-full md:w-auto">
          <button type="button" onClick={() => setFilterAnomalyType('ALL')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${filterAnomalyType === 'ALL' ? 'bg-rose-600 text-white shadow-xs' : 'bg-surface text-on-surface-variant border border-border-glass hover:bg-surface-container'}`}>
            Semua ({suspiciousRows.length})
          </button>
          <button type="button" onClick={() => setFilterAnomalyType('TRAVEL')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${filterAnomalyType === 'TRAVEL' ? 'bg-rose-600 text-white shadow-xs' : 'bg-surface text-on-surface-variant border border-border-glass hover:bg-surface-container'}`}>
            <LuCar className="text-xs" /> Jeda Travel
          </button>
          <button type="button" onClick={() => setFilterAnomalyType('DURATION')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${filterAnomalyType === 'DURATION' ? 'bg-rose-600 text-white shadow-xs' : 'bg-surface text-on-surface-variant border border-border-glass hover:bg-surface-container'}`}>
            <LuClock className="text-xs" /> Durasi &lt; 5m
          </button>
          <button type="button" onClick={() => setFilterAnomalyType('DISTANCE')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${filterAnomalyType === 'DISTANCE' ? 'bg-rose-600 text-white shadow-xs' : 'bg-surface text-on-surface-variant border border-border-glass hover:bg-surface-container'}`}>
            <LuMapPin className="text-xs" /> Radius GPS &gt; 50m
          </button>
          <button type="button" onClick={() => setFilterAnomalyType('SKIPPED')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${filterAnomalyType === 'SKIPPED' ? 'bg-rose-600 text-white shadow-xs' : 'bg-surface text-on-surface-variant border border-border-glass hover:bg-surface-container'}`}>
            ⏳ Terlewat
          </button>

          <button type="button" onClick={exportSuspiciousCsv} className="w-full md:w-auto px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-xs transition-all cursor-pointer md:ml-auto" title="Ekspor Daftar Anomali ke Excel/CSV">
            <LuFileSpreadsheet /> Ekspor Audit
          </button>
        </div>
      </div>;
}
