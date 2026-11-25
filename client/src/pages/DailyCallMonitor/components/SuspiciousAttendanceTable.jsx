import { exportSuspiciousAttendance } from '../../../utils/export/reports/suspiciousAttendanceExport';
import { SuspiciousAttendanceSummary } from './SuspiciousAttendanceSummary';
import { SuspiciousAttendanceRows } from './SuspiciousAttendanceRows';
import React, { useId, useMemo, useState } from 'react';
import { LuSearch } from 'react-icons/lu';
import { notifyInfo } from '../../../services/notificationService';

const EMPTY_ROWS = [];

/**
 * SuspiciousAttendanceTable Component
 * Single Responsibility: Dedicated table and audit dashboard for abnormal / suspicious attendances.
 */
export const SuspiciousAttendanceTable = ({
  rows = EMPTY_ROWS,
  isLoading = false,
  onSelectRow,
}) => {
  const [filterAnomalyType, setFilterAnomalyType] = useState('ALL');
  const [search, setSearch] = useState('');
  const searchInputId = useId();

  const { allSuspiciousRows, categoryCounts } = useMemo(() => {
    const suspicious = [];
    const counts = { TRAVEL: 0, DURATION: 0, DISTANCE: 0, SKIPPED: 0 };

    for (const r of rows) {
      const isDuration = Boolean(r.isDurationAnomaly);
      const isDistance = Boolean(r.isDistanceAnomaly || r.distanceWarning === 'WARNING');
      const isTravel = Boolean(r.isTravelAnomaly);
      const isSkipped = Boolean(r.isSkipped);
      if (!isDuration && !isDistance && !isTravel && !isSkipped && !r.earlyReason) {
        continue;
      }
      suspicious.push(r);
      if (isTravel) counts.TRAVEL += 1;
      if (isDuration) counts.DURATION += 1;
      if (isDistance) counts.DISTANCE += 1;
      if (isSkipped) counts.SKIPPED += 1;
    }

    return { allSuspiciousRows: suspicious, categoryCounts: counts };
  }, [rows]);

  const filteredRows = useMemo(() => {
    const byType =
      filterAnomalyType === 'ALL'
        ? allSuspiciousRows
        : allSuspiciousRows.filter((r) => {
            if (filterAnomalyType === 'DURATION') return Boolean(r.isDurationAnomaly);
            if (filterAnomalyType === 'DISTANCE') {
              return Boolean(r.isDistanceAnomaly || r.distanceWarning === 'WARNING');
            }
            if (filterAnomalyType === 'TRAVEL') return Boolean(r.isTravelAnomaly);
            if (filterAnomalyType === 'SKIPPED') return Boolean(r.isSkipped);
            return true;
          });

    const q = search.trim().toLowerCase();
    if (!q) return byType;

    return byType.filter(
      (r) =>
        (r.customerName || '').toLowerCase().includes(q) ||
        (r.salesmanName || '').toLowerCase().includes(q) ||
        (r.earlyReason || '').toLowerCase().includes(q) ||
        (r.travelAnomalyReason || '').toLowerCase().includes(q) ||
        (r.reason || '').toLowerCase().includes(q)
    );
  }, [allSuspiciousRows, filterAnomalyType, search]);

  const currentDate = new Date().toISOString().split('T')[0];
  const exporters = exportSuspiciousAttendance({ rows: filteredRows, date: currentDate });
  const guardExport = (fn) => () => {
    if (filteredRows.length === 0) {
      notifyInfo('Tidak ada data absensi janggal untuk diekspor.');
      return;
    }
    return fn();
  };

  return (
    <div className="space-y-4">
      <SuspiciousAttendanceSummary
        filterAnomalyType={filterAnomalyType}
        setFilterAnomalyType={setFilterAnomalyType}
        totalCount={allSuspiciousRows.length}
        categoryCounts={categoryCounts}
        exportCount={filteredRows.length}
        onExportDocx={guardExport(exporters.toDocx)}
        onExportExcel={guardExport(exporters.toExcel)}
        onExportCsv={guardExport(exporters.toCsv)}
        onExportTxt={guardExport(exporters.toTxt)}
        onExportPdf={guardExport(exporters.toPdf)}
      />

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-sm">
          <label htmlFor={searchInputId} className="visually-hidden">
            Cari temuan absensi janggal
          </label>
          <LuSearch
            className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs pointer-events-none"
            aria-hidden="true"
          />
          <input
            id={searchInputId}
            type="search"
            placeholder="Cari nama toko, salesman, atau alasan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-surface rounded-lg text-xs text-on-surface border border-border-glass focus:border-primary outline-none"
          />
        </div>
        <span className="text-xs text-on-surface-variant font-medium tabular-nums">
          {isLoading
            ? 'Memuat temuan...'
            : `Menampilkan ${filteredRows.length} dari ${allSuspiciousRows.length} temuan`}
        </span>
      </div>

      <SuspiciousAttendanceRows filteredRows={filteredRows} onSelectRow={onSelectRow} />
    </div>
  );
};
