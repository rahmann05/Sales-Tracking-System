import { reportMoney } from '../../../../../shared/report-visibility.mjs';
import { DataTable } from '../../../shared/components/common/DataTable';
import { ReportTableScroller } from '../../../shared/components/common/ReportTableScroller';
import { useApp } from '../../../context/AppContext';
import {
  selectedReportItems,
  reportExportAllowed,
} from '../../../../../shared/report-presentation.mjs';
import React from 'react';
import { SalesTargetEditor } from './SalesTargetEditor';
import { formatTarget } from '../../../../../shared/sales-targets.mjs';
import { calendarDayLabel } from '../../../../../shared/report-calendar.mjs';
import { LuCalendarRange, LuPrinter, LuRefreshCw, LuUser, LuSearch } from 'react-icons/lu';
import { ExportFormatMenu } from '../../../shared/components/common/ExportFormatMenu';
/**
 * WeeklySalesTable Component
 * Single Responsibility: Weekly Performance Analysis (WTD) & 6-Day Work Week Matrix Table ala ND6.
 */
export function WeeklySalesTable({
  daysSummary,
  exportToDocx,
  exportToExcel,
  exportToCsv,
  exportToTxt,
  exportToPdf,
  filteredSalesmen,
  isLoading,
  loadData,
  salesTeam,
  salesmanId,
  search,
  setIsPdfModalOpen,
  setSalesmanId,
  setSearch,
  setStartDate,
  startDate,
  targetPeriod,
  summary,
}) {
  const { settings, user } = useApp(),
    columns = new Set(selectedReportItems(settings, 'REPORT_WEEKLY_COLUMNS'));
  const hidden = (column) => !columns.has(column),
    canExport = reportExportAllowed(user, settings);
  const visibleCount =
    1 +
    columns.size -
    (columns.has('days') ? 1 : 0) +
    (columns.has('days') ? daysSummary.length : 0);
  const tableResetKey = `${filteredSalesmen.length}-${daysSummary.length}-${columns.size}-${isLoading}`;

  return (
    <div
      className={`bg-surface border border-border-glass rounded-xl overflow-clip ${settings.REPORT_TABLE_DENSITY === 'COMPACT' ? 'report-compact' : ''}`}
    >
      {/* Workspace Card Header */}
      <div className="p-4 sm:p-5 border-b border-border-glass bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold text-on-surface tracking-tight m-0 flex flex-wrap items-center gap-2">
            Matriks Kinerja Mingguan (WTD)
            <span className="admin-status">Kunjungan per hari dalam periode</span>
          </h3>
          <p className="text-xs text-on-surface-variant m-0 mt-0.5">
            Evaluasi kepatuhan rute, efektivitas call, dan nilai order disetujui per salesman
          </p>
        </div>

        {/* Utility Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="h-9 w-9 bg-surface hover:bg-surface-container text-on-surface border border-border-glass rounded-lg text-xs font-semibold transition-all flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-50"
            title="Refresh Data"
          >
            <LuRefreshCw className={isLoading ? 'animate-spin' : ''} aria-hidden="true" />
          </button>

          <ExportFormatMenu
            disabled={!canExport || isLoading}
            onExportDocx={exportToDocx}
            onExportExcel={exportToExcel}
            onExportCsv={exportToCsv}
            onExportTxt={exportToTxt}
            onExportPdf={exportToPdf}
          />

          <button
            type="button"
            disabled={!canExport || isLoading}
            onClick={() => setIsPdfModalOpen(true)}
            className="h-9 px-3 bg-primary hover:bg-primary/90 text-on-primary rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            title="Buka pratinjau cetak formulir resmi"
          >
            <LuPrinter aria-hidden="true" /> Cetak Printer
          </button>
        </div>
      </div>

      {/* Workspace Toolbar: Filter Controls */}
      <div className="p-4 border-b border-border-glass bg-surface-container/25">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label
              htmlFor="weekly-start-date"
              className="block text-xs font-medium text-on-surface-variant mb-1.5"
            >
              Tanggal Mulai Periode
            </label>
            <div className="relative flex items-center">
              <LuCalendarRange
                aria-hidden="true"
                className="absolute left-3 text-on-surface-variant text-sm pointer-events-none z-10"
              />
              <input
                id="weekly-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="report-filter-with-icon w-full h-10 bg-surface rounded-lg text-[13px] font-medium text-on-surface border border-border-glass focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="weekly-salesman-filter"
              className="block text-xs font-medium text-on-surface-variant mb-1.5"
            >
              Pilih Salesman
            </label>
            <div className="relative flex items-center">
              <LuUser
                aria-hidden="true"
                className="absolute left-3 text-on-surface-variant text-sm pointer-events-none z-10"
              />
              <select
                id="weekly-salesman-filter"
                value={salesmanId}
                onChange={(e) => setSalesmanId(e.target.value)}
                className="report-filter-with-icon w-full h-10 bg-surface rounded-lg text-[13px] font-medium text-on-surface border border-border-glass focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="">Semua Salesman (Tim)</option>
                {salesTeam.map((sales) => (
                  <option key={sales.id} value={sales.id}>
                    {sales.name} ({sales.cluster?.name || 'Belum ditugaskan'})
                    {sales.historicalOnly ? ' · Riwayat periode' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="weekly-salesman-search"
              className="block text-xs font-medium text-on-surface-variant mb-1.5"
            >
              Cari Nama Salesman
            </label>
            <div className="relative flex items-center">
              <LuSearch
                aria-hidden="true"
                className="absolute left-3 text-on-surface-variant text-sm pointer-events-none z-10"
              />
              <input
                id="weekly-salesman-search"
                type="text"
                placeholder="Ketik nama salesman..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="report-filter-with-icon w-full h-10 bg-surface rounded-lg text-[13px] font-medium text-on-surface border border-border-glass focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Workspace Body: Day-by-Day Performance Matrix Table */}
      <ReportTableScroller
        ariaLabel="Matriks kinerja mingguan per salesman"
        resetKey={tableResetKey}
      >
        <DataTable
          embedded
          className="w-full text-left mobile-card-table report-matrix-table report-matrix-weekly"
        >
          <thead>
            <tr className="bg-surface-container border-b border-border-glass text-on-surface-variant">
              <th className="matrix-col-salesman text-left">Salesman</th>
              <th hidden={hidden('cluster')} className="matrix-col-cluster text-left">
                Klaster
              </th>
              {columns.has('days')
                ? daysSummary.map((day) => (
                    <th key={day.dateStr} className="matrix-col-day text-center">
                      <span className="block font-semibold text-on-surface">{day.dayName}</span>
                      <span className="block text-[11px] font-normal text-on-surface-variant tabular-nums">
                        {day.formattedDate || day.dateStr}
                      </span>
                      <span className="block text-[11px] font-normal text-on-surface-variant/75">
                        {calendarDayLabel(day.isWorkingDay)}
                      </span>
                    </th>
                  ))
                : null}
              <th hidden={hidden('calls')} className="matrix-col-num matrix-col-total text-center">
                Total Act / Plan
              </th>
              <th hidden={hidden('callRate')} className="matrix-col-num matrix-col-rate text-center">
                Call %
              </th>
              <th hidden={hidden('ecRate')} className="matrix-col-num matrix-col-rate text-center">
                EC %
              </th>
              <th
                hidden={hidden('revenue')}
                className="matrix-col-num matrix-col-money text-right"
              >
                Nilai order disetujui (Rp)
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredSalesmen.map((s) => (
              <tr
                key={s.salesmanId}
                className="hover:bg-surface-variant/20 transition-colors border-b border-border-glass/60"
              >
                <th
                  scope="row"
                  data-label="Salesman"
                  className="matrix-col-salesman font-semibold text-on-surface"
                >
                  <div className="space-y-1.5">
                    <div className="text-[13px] font-semibold text-on-surface">
                      {s.salesmanName}
                    </div>
                    <p className="text-xs font-normal text-on-surface-variant tabular-nums m-0">
                      Target: {formatTarget(s.weeklyTotal?.target, s.target?.status)} ·{' '}
                      {s.weeklyTotal?.targetAchievement}
                    </p>
                    <SalesTargetEditor
                      sales={s}
                      kind="WEEK"
                      period={targetPeriod}
                      onSaved={loadData}
                    />
                  </div>
                </th>
                <td
                  hidden={hidden('cluster')}
                  data-label="Klaster"
                  className="matrix-col-cluster text-xs text-on-surface-variant"
                >
                  {s.clusterName}
                </td>

                {columns.has('days')
                  ? daysSummary.map((day) => {
                      const d = s.days?.[day.dayName.toLowerCase()] || {
                        plan: 0,
                        actual: 0,
                        ec: 0,
                      };
                      return (
                        <td
                          key={day.dateStr}
                          data-label={`${day.dayName} ${day.formattedDate || day.dateStr}`}
                          className="matrix-col-day text-center text-xs"
                        >
                          {d.plan > 0 || d.actual > 0 ? (
                            <div className="space-y-0.5 tabular-nums">
                              <span className="font-semibold text-on-surface">
                                {d.actual}/{d.plan}
                              </span>
                              <span
                                className={`block text-[11px] font-medium ${
                                  d.ec > 0 ? 'text-emerald-700' : 'text-on-surface-variant/70'
                                }`}
                              >
                                EC {d.ec}
                              </span>
                            </div>
                          ) : (
                            <span className="text-on-surface-variant/40 tabular-nums">—</span>
                          )}
                        </td>
                      );
                    })
                  : null}

                {/* Weekly Totals */}
                <td
                  hidden={hidden('calls')}
                  data-label="Total Act/Plan"
                  className="matrix-col-num matrix-col-total text-center font-semibold text-on-surface"
                >
                  {s.weeklyTotal?.actual} / {s.weeklyTotal?.plan}
                </td>
                <td
                  hidden={hidden('callRate')}
                  data-label="Call %"
                  className="matrix-col-num matrix-col-rate text-center font-semibold text-primary"
                >
                  {s.weeklyTotal?.callRate}
                </td>
                <td
                  hidden={hidden('ecRate')}
                  data-label="EC %"
                  className="matrix-col-num matrix-col-rate text-center font-semibold text-emerald-700"
                >
                  {s.weeklyTotal?.ecRate}
                </td>
                <td
                  hidden={hidden('revenue')}
                  data-label="Nilai order disetujui"
                  className="matrix-col-num matrix-col-money text-right font-semibold text-on-surface"
                >
                  {reportMoney(s.weeklyTotal?.omzet)}
                </td>
              </tr>
            ))}

            {filteredSalesmen.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleCount}
                  className="py-10 text-center text-sm text-on-surface-variant font-medium"
                >
                  Tidak ada data performa mingguan untuk filter yang dipilih.
                </td>
              </tr>
            ) : null}
          </tbody>

          {/* Subtotal Footer */}
          {filteredSalesmen.length > 0 ? (
            <tfoot>
              <tr className="bg-surface-container border-t border-border-glass text-xs">
                <td
                  colSpan={columns.has('cluster') ? 2 : 1}
                  className="mobile-full-width font-semibold text-on-surface"
                >
                  Total laporan (sebelum pencarian nama)
                </td>
                {columns.has('days')
                  ? daysSummary.map((ds) => (
                      <td
                        key={ds.dateStr}
                        data-label={`${ds.dayName} ${ds.formattedDate}`}
                        className="matrix-col-day text-center text-xs tabular-nums"
                      >
                        <div className="font-semibold text-on-surface">
                          {ds.actualCalls}/{ds.planCalls}
                        </div>
                        <div
                          className={`text-[11px] font-medium ${
                            ds.effectiveCalls > 0
                              ? 'text-emerald-700'
                              : 'text-on-surface-variant/70'
                          }`}
                        >
                          EC {ds.effectiveCalls}
                        </div>
                      </td>
                    ))
                  : null}
                <td
                  hidden={hidden('calls')}
                  data-label="Total Calls"
                  className="matrix-col-num matrix-col-total text-center font-semibold text-on-surface"
                >
                  {summary.totalActualCalls}/{summary.totalPlanCalls}
                </td>
                <td
                  hidden={hidden('callRate')}
                  data-label="% Call"
                  className="matrix-col-num matrix-col-rate text-center font-semibold text-primary"
                >
                  {summary.callComplianceRate}
                </td>
                <td
                  hidden={hidden('ecRate')}
                  data-label="% EC"
                  className="matrix-col-num matrix-col-rate text-center font-semibold text-emerald-700"
                >
                  {summary.effectiveCallRate}
                </td>
                <td
                  hidden={hidden('revenue')}
                  data-label="Total Order"
                  className="matrix-col-num matrix-col-money text-right font-semibold text-emerald-700"
                >
                  {reportMoney(summary.totalOrderAmount)}
                </td>
              </tr>
            </tfoot>
          ) : null}
        </DataTable>
      </ReportTableScroller>
    </div>
  );
}
