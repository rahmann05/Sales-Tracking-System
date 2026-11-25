import React from 'react';
import { useApp } from '../../../context/AppContext';
import { reportExportAllowed } from '../../../../../shared/report-presentation.mjs';
import {
  LuClock,
  LuMapPin,
  LuShieldAlert,
  LuCar,
  LuHourglass,
  LuCircleCheck,
} from 'react-icons/lu';
import { ExportFormatMenu } from '../../../shared/components/common/ExportFormatMenu';

const EMPTY_COUNTS = { TRAVEL: 0, DURATION: 0, DISTANCE: 0, SKIPPED: 0 };

const FILTER_OPTIONS = [
  { key: 'ALL', label: 'Semua', Icon: null },
  { key: 'TRAVEL', label: 'Jeda perjalanan', Icon: LuCar },
  { key: 'DURATION', label: 'Durasi singkat', Icon: LuClock },
  { key: 'DISTANCE', label: 'Di luar radius', Icon: LuMapPin },
  { key: 'SKIPPED', label: 'Terlewat', Icon: LuHourglass },
];

/**
 * SuspiciousAttendanceSummary Component
 * Single Responsibility: Header, conditional finding status indicator, category filters, and export actions.
 */
export function SuspiciousAttendanceSummary({
  filterAnomalyType,
  setFilterAnomalyType,
  totalCount = 0,
  categoryCounts = EMPTY_COUNTS,
  exportCount = 0,
  onExportDocx,
  onExportExcel,
  onExportCsv,
  onExportTxt,
  onExportPdf,
}) {
  const { user, settings } = useApp();
  const canExport = reportExportAllowed(user, settings);

  return (
    <div className="bg-surface border border-border-glass rounded-xl p-4 space-y-3 suspicious-header-mobile">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-on-surface m-0">
              Audit absensi &amp; indikasi lapangan
            </h3>
            {totalCount === 0 ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-[#e4f7ea] text-[#15803d]">
                <LuCircleCheck className="text-xs shrink-0" aria-hidden="true" />
                Tidak ada temuan
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-[#fff1f2] text-[#9f1239] border border-[#fecdd3]">
                <LuShieldAlert className="text-xs shrink-0" aria-hidden="true" />
                {totalCount} temuan
              </span>
            )}
          </div>
          <p className="text-xs text-on-surface-variant m-0 mt-1">
            Kunjungan yang perlu dievaluasi: durasi di bawah batas aturan, posisi di luar radius,
            jeda perjalanan, atau jadwal terlewat. Penilaian mengikuti aturan dan bukti yang
            tersedia.
          </p>
        </div>

        <ExportFormatMenu
          onExportDocx={onExportDocx}
          onExportExcel={onExportExcel}
          onExportCsv={onExportCsv}
          onExportTxt={onExportTxt}
          onExportPdf={onExportPdf}
          disabled={!canExport || exportCount === 0}
          compact={true}
          className="shrink-0 self-start"
        />
      </div>

      {/* Category Filter Toolbar */}
      <div
        role="group"
        aria-label="Filter kategori temuan absensi"
        className="border-t border-border-glass pt-3 flex items-center gap-2 flex-wrap suspicious-filter-pills-mobile"
      >
        {FILTER_OPTIONS.map(({ key, label, Icon }) => {
          const isActive = filterAnomalyType === key;
          const count = key === 'ALL' ? totalCount : categoryCounts[key] || 0;
          const showCount = key === 'ALL' || count > 0;

          return (
            <button
              key={key}
              type="button"
              aria-pressed={isActive}
              onClick={() => setFilterAnomalyType(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5 border ${
                isActive
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-surface text-on-surface-variant border-border-glass hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              {Icon ? <Icon className="text-xs shrink-0" aria-hidden="true" /> : null}
              <span>{showCount ? `${label} (${count})` : label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
