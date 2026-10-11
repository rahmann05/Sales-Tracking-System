import React from 'react';
import { useApp } from '../../../context/AppContext';
import { reportExportAllowed } from '../../../../../shared/report-presentation.mjs';
import { LuClock, LuMapPin, LuShieldAlert, LuCar } from "react-icons/lu";
import { ExportFormatMenu } from '../../../shared/components/common/ExportFormatMenu';

/**
 * SuspiciousAttendanceTable Component
 * Single Responsibility: Dedicated table and audit dashboard for abnormal / suspicious attendances
 * (Early checkout < 5 minutes, GPS deviation > 50 meters, Travel time gaps e.g. 2km in 2 hours, and Skipped visits).
 */
export function SuspiciousAttendanceSummary({
  filterAnomalyType,
  setFilterAnomalyType,
  suspiciousRows = [],
  onExportDocx,
  onExportExcel,
  onExportCsv,
  onExportTxt,
  onExportPdf,
}) {
  const { user, settings } = useApp();
  const canExport = reportExportAllowed(user, settings);

  return (
    <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 suspicious-header-mobile">
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
            Kunjungan yang memerlukan evaluasi: durasi di bawah batas aturan, posisi di luar radius, jeda perjalanan yang perlu diperiksa, atau jadwal terlewat. Penilaian mengikuti aturan dan bukti yang tersedia.
          </p>
        </div>
      </div>

      {/* Filter Pills & Export */}
      <div className="flex items-center gap-2 flex-wrap self-start md:self-auto suspicious-filter-pills-mobile w-full md:w-auto">
        <button
          type="button"
          onClick={() => setFilterAnomalyType('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filterAnomalyType === 'ALL'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-surface text-on-surface-variant border border-border-glass hover:bg-surface-container'
          }`}
        >
          Semua ({suspiciousRows.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterAnomalyType('TRAVEL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
            filterAnomalyType === 'TRAVEL'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-surface text-on-surface-variant border border-border-glass hover:bg-surface-container'
          }`}
        >
          <LuCar className="text-xs" /> Jeda Travel
        </button>
        <button
          type="button"
          onClick={() => setFilterAnomalyType('DURATION')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
            filterAnomalyType === 'DURATION'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-surface text-on-surface-variant border border-border-glass hover:bg-surface-container'
          }`}
        >
          <LuClock className="text-xs" /> Di bawah batas durasi
        </button>
        <button
          type="button"
          onClick={() => setFilterAnomalyType('DISTANCE')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
            filterAnomalyType === 'DISTANCE'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-surface text-on-surface-variant border border-border-glass hover:bg-surface-container'
          }`}
        >
          <LuMapPin className="text-xs" /> Di luar radius aturan
        </button>
        <button
          type="button"
          onClick={() => setFilterAnomalyType('SKIPPED')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
            filterAnomalyType === 'SKIPPED'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-surface text-on-surface-variant border border-border-glass hover:bg-surface-container'
          }`}
        >
          ⏳ Terlewat
        </button>

        <ExportFormatMenu
          onExportDocx={onExportDocx}
          onExportExcel={onExportExcel}
          onExportCsv={onExportCsv}
          onExportTxt={onExportTxt}
          onExportPdf={onExportPdf}
          disabled={!canExport}
          compact={true}
          className="md:ml-auto"
        />
      </div>
    </div>
  );
}
