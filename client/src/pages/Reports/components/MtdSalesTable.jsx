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
import { LuPrinter, LuRefreshCw, LuUser, LuSearch } from 'react-icons/lu';
import { ExportFormatMenu } from '../../../shared/components/common/ExportFormatMenu';

const YEAR_OPTIONS = [2025, 2026, 2027];

export function MtdSalesTable({
  MONTH_OPTIONS,
  exportToDocx,
  exportToExcel,
  exportToCsv,
  exportToTxt,
  exportToPdf,
  filteredSalesmen,
  isLoading,
  loadData,
  month,
  reportData,
  salesTeam,
  salesmanId,
  search,
  setIsPdfModalOpen,
  setMonth,
  setSalesmanId,
  setSearch,
  setYear,
  summary,
  year,
}) {
  const { settings, user } = useApp(),
    columns = new Set(selectedReportItems(settings, 'REPORT_MTD_COLUMNS'));
  const hidden = (column) => !columns.has(column),
    canExport = reportExportAllowed(user, settings);
  const tableResetKey = `${filteredSalesmen.length}-${columns.size}-${month}-${year}-${isLoading}`;

  return (
    <div
      className={`bg-surface border border-border-glass rounded-xl overflow-clip ${settings.REPORT_TABLE_DENSITY === 'COMPACT' ? 'report-compact' : ''}`}
    >
      {/* Workspace Card Header */}
      <div className="p-4 sm:p-5 border-b border-border-glass bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold text-on-surface tracking-tight m-0 flex flex-wrap items-center gap-2">
            Matriks Pencapaian Month-to-Date (MTD)
            <span className="admin-status">
              {reportData.period?.monthName || ''} {year}
            </span>
          </h3>
          <p className="text-xs text-on-surface-variant m-0 mt-0.5">
            Evaluasi target vs realisasi, perbandingan LMA, dan kinerja sales per klaster
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label
              htmlFor="mtd-month-filter"
              className="block text-xs font-medium text-on-surface-variant mb-1.5"
            >
              Bulan Periode
            </label>
            <select
              id="mtd-month-filter"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="w-full px-3 h-10 bg-surface rounded-lg text-[13px] font-medium text-on-surface border border-border-glass focus:ring-2 focus:ring-primary outline-none"
            >
              {MONTH_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="mtd-year-filter"
              className="block text-xs font-medium text-on-surface-variant mb-1.5"
            >
              Tahun
            </label>
            <select
              id="mtd-year-filter"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full px-3 h-10 bg-surface rounded-lg text-[13px] font-medium text-on-surface border border-border-glass focus:ring-2 focus:ring-primary outline-none"
            >
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="mtd-salesman-filter"
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
                id="mtd-salesman-filter"
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
              htmlFor="mtd-salesman-search"
              className="block text-xs font-medium text-on-surface-variant mb-1.5"
            >
              Cari Salesman
            </label>
            <div className="relative flex items-center">
              <LuSearch
                aria-hidden="true"
                className="absolute left-3 text-on-surface-variant text-sm pointer-events-none z-10"
              />
              <input
                id="mtd-salesman-search"
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

      {/* Workspace Body: Salesman MTD Breakdown Table */}
      <ReportTableScroller
        ariaLabel="Matriks pencapaian bulanan per salesman"
        resetKey={tableResetKey}
      >
        <DataTable
          embedded
          className="w-full text-left mobile-card-table report-matrix-table report-matrix-mtd"
        >
          <thead>
            <tr className="bg-surface-container border-b border-border-glass text-on-surface-variant">
              <th className="matrix-col-salesman text-left">Salesman</th>
              <th hidden={hidden('cluster')} className="matrix-col-cluster text-left">
                Klaster
              </th>
              <th hidden={hidden('target')} className="matrix-col-num matrix-col-money text-right">
                Target (Rp)
              </th>
              <th hidden={hidden('revenue')} className="matrix-col-num matrix-col-money text-right">
                MTD Actual (Rp)
              </th>
              <th
                hidden={hidden('achievement')}
                className="matrix-col-num matrix-col-rate text-center"
              >
                % Achv
              </th>
              <th
                hidden={hidden('lastMonth')}
                className="matrix-col-num matrix-col-money text-right"
              >
                LMA (Rp)
              </th>
              <th
                hidden={hidden('comparison')}
                className="matrix-col-num matrix-col-total text-center"
              >
                % MTD/LMA
              </th>
              <th hidden={hidden('calls')} className="matrix-col-num matrix-col-total text-center">
                MTD Call (A/P)
              </th>
              <th hidden={hidden('callRate')} className="matrix-col-num matrix-col-rate text-center">
                Call %
              </th>
              <th hidden={hidden('ecRate')} className="matrix-col-num matrix-col-rate text-center">
                EC %
              </th>
              <th hidden={hidden('sku')} className="matrix-col-num matrix-col-rate text-center">
                SKU Sold
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
                  {s.salesmanName}
                </th>
                <td
                  hidden={hidden('cluster')}
                  data-label="Klaster"
                  className="matrix-col-cluster text-on-surface-variant text-xs"
                >
                  {s.clusterName}
                </td>
                <td
                  hidden={hidden('target')}
                  data-label="Target"
                  className="matrix-col-num matrix-col-money text-right text-on-surface-variant"
                >
                  <div className="space-y-1">
                    <div>{formatTarget(s.monthlyTarget, s.target?.status)}</div>
                    {s.target?.status !== 'COMPARISON_ONLY' ? (
                      <SalesTargetEditor
                        sales={s}
                        kind="MONTH"
                        period={`${reportData.period?.year}-${String(reportData.period?.month).padStart(2, '0')}`}
                        onSaved={loadData}
                      />
                    ) : null}
                  </div>
                </td>
                <td
                  hidden={hidden('revenue')}
                  data-label="MTD Actual"
                  className="matrix-col-num matrix-col-money text-right font-semibold text-on-surface"
                >
                  {reportMoney(s.mtdActualAmount)}
                </td>
                <td
                  hidden={hidden('achievement')}
                  data-label="% Achv"
                  className="matrix-col-num matrix-col-rate text-center font-semibold text-primary"
                >
                  <span className="inline-block px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                    {s.achievementRate}
                  </span>
                </td>
                <td
                  hidden={hidden('lastMonth')}
                  data-label="LMA"
                  className="matrix-col-num matrix-col-money text-right text-on-surface-variant"
                >
                  {reportMoney(s.lastMonthActual)}
                </td>
                <td
                  hidden={hidden('comparison')}
                  data-label="% MTD/LMA"
                  className="matrix-col-num matrix-col-total text-center font-semibold text-emerald-700"
                >
                  <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
                    {s.mtdToLmaRate}
                  </span>
                </td>
                <td
                  hidden={hidden('calls')}
                  data-label="MTD Call"
                  className="matrix-col-num matrix-col-total text-center font-semibold text-on-surface"
                >
                  {s.mtdActualCalls} / {s.mtdPlanCalls}
                </td>
                <td
                  hidden={hidden('callRate')}
                  data-label="Call %"
                  className="matrix-col-num matrix-col-rate text-center font-semibold text-primary"
                >
                  {s.callComplianceRate}
                </td>
                <td
                  hidden={hidden('ecRate')}
                  data-label="EC %"
                  className="matrix-col-num matrix-col-rate text-center font-semibold text-emerald-700"
                >
                  {s.effectiveCallRate}
                </td>
                <td
                  hidden={hidden('sku')}
                  data-label="SKU Sold"
                  className="matrix-col-num matrix-col-rate text-center text-on-surface"
                >
                  {s.totalSkuSold} SKU
                </td>
              </tr>
            ))}

            {filteredSalesmen.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.size + 1}
                  className="py-10 text-center text-sm text-on-surface-variant font-medium"
                >
                  Tidak ada data MTD untuk filter yang dipilih.
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
                <td
                  hidden={hidden('target')}
                  data-label="Target"
                  className="matrix-col-num matrix-col-money text-right font-semibold text-on-surface"
                >
                  {formatTarget(summary.monthlyTargetAmount)}
                </td>
                <td
                  hidden={hidden('revenue')}
                  data-label="MTD Omzet"
                  className="matrix-col-num matrix-col-money text-right font-semibold text-on-surface"
                >
                  {reportMoney(summary.mtdActualAmount)}
                </td>
                <td
                  hidden={hidden('achievement')}
                  data-label="Pencapaian"
                  className="matrix-col-num matrix-col-rate text-center font-semibold text-primary"
                >
                  {summary.overallAchievementRate}
                </td>
                <td
                  hidden={hidden('lastMonth')}
                  data-label="LMA"
                  className="matrix-col-num matrix-col-money text-right text-on-surface-variant"
                >
                  {reportMoney(summary.lastMonthActual)}
                </td>
                <td
                  hidden={hidden('comparison')}
                  data-label="Perbandingan"
                  className="matrix-col-num matrix-col-total text-center font-semibold text-emerald-700"
                >
                  {summary.mtdToLmaRate}
                </td>
                <td
                  hidden={hidden('calls')}
                  data-label="Calls"
                  className="matrix-col-num matrix-col-total text-center font-semibold text-on-surface"
                >
                  {summary.totalMtdActualCalls}/{summary.totalMtdPlanCalls}
                </td>
                <td
                  hidden={hidden('callRate')}
                  data-label="% Call"
                  className="matrix-col-num matrix-col-rate text-center font-semibold text-primary"
                >
                  {summary.mtdCallComplianceRate}
                </td>
                <td
                  hidden={hidden('ecRate')}
                  data-label="% EC"
                  className="matrix-col-num matrix-col-rate text-center font-semibold text-emerald-700"
                >
                  {summary.mtdEffectiveCallRate}
                </td>
                <td
                  hidden={hidden('sku')}
                  data-label="SKU"
                  className="matrix-col-num matrix-col-rate text-center font-semibold text-on-surface"
                >
                  {summary.totalMtdSkuSold} SKU
                </td>
              </tr>
            </tfoot>
          ) : null}
        </DataTable>
      </ReportTableScroller>
    </div>
  );
}
