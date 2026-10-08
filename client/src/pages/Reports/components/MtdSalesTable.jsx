import { DataTable } from '../../../shared/components/common/DataTable';
import React from 'react';
import { SalesTargetEditor } from './SalesTargetEditor';
import { formatTarget } from '../../../../../shared/sales-targets.mjs';
import { LuDownload, LuPrinter, LuRefreshCw, LuUser, LuSearch } from "react-icons/lu";
export function MtdSalesTable({
  MONTH_OPTIONS,
  exportToCsv,
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
  year
}) {
  return <div className="bg-surface border border-border-glass rounded-3xl shadow-xs overflow-hidden">
        {/* Workspace Card Header */}
        <div className="p-4 sm:p-5 border-b border-border-glass bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-on-surface tracking-tight m-0 flex items-center gap-2">
              Matriks Pencapaian Month-to-Date (MTD)
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-container border border-border-glass text-on-surface-variant">
                {reportData.period?.monthName || ''} {year}
              </span>
            </h3>
            <p className="text-xs text-on-surface-variant m-0 mt-0.5">
              Evaluasi target vs realisasi, perbandingan LMA, dan kinerja sales per klaster
            </p>
          </div>

          {/* Utility Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button type="button" onClick={loadData} disabled={isLoading} className="p-2.5 bg-surface hover:bg-surface-container text-on-surface border border-border-glass rounded-xl text-xs font-bold transition-all flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-50 shadow-xs" title="Refresh Data">
              <LuRefreshCw className={isLoading ? 'animate-spin' : ''} />
            </button>

            <button type="button" onClick={exportToCsv} className="py-2 px-3 bg-surface hover:bg-surface-container text-on-surface border border-border-glass rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer">
              <LuDownload /> Excel
            </button>

            <button type="button" onClick={() => setIsPdfModalOpen(true)} className="py-2 px-3 bg-primary hover:bg-primary/90 text-on-primary rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer">
              <LuPrinter /> Cetak PDF
            </button>
          </div>
        </div>

        {/* Workspace Toolbar: Filter Controls */}
        <div className="p-4 border-b border-border-glass bg-surface-container/30">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                Bulan Periode
              </label>
              <select value={month} onChange={e => setMonth(Number(e.target.value))} className="w-full p-2 bg-surface rounded-xl text-xs font-semibold text-on-surface border border-border-glass focus:ring-2 focus:ring-primary outline-none">
                {MONTH_OPTIONS.map(m => <option key={m.value} value={m.value}>
                    {m.label}
                  </option>)}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                Tahun
              </label>
              <select value={year} onChange={e => setYear(Number(e.target.value))} className="w-full p-2 bg-surface rounded-xl text-xs font-semibold text-on-surface border border-border-glass focus:ring-2 focus:ring-primary outline-none">
                {[2025, 2026, 2027].map(y => <option key={y} value={y}>
                    {y}
                  </option>)}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                Pilih Salesman
              </label>
              <div className="relative flex items-center">
                <LuUser className="absolute left-3 text-on-surface-variant text-sm" />
                <select value={salesmanId} onChange={e => setSalesmanId(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-surface rounded-xl text-xs font-semibold text-on-surface border border-border-glass focus:ring-2 focus:ring-primary outline-none">
                  <option value="">Semua Salesman (Tim)</option>
                  {salesTeam.map(sales => <option key={sales.id} value={sales.id}>
                      {sales.name} ({sales.cluster?.name || 'Belum ditugaskan'}){sales.historicalOnly ? ' · Riwayat periode' : ''}
                    </option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                Cari Salesman
              </label>
              <div className="relative flex items-center">
                <LuSearch className="absolute left-3 text-on-surface-variant text-sm" />
                <input type="text" placeholder="Ketik nama salesman..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-surface rounded-xl text-xs font-semibold text-on-surface border border-border-glass focus:ring-2 focus:ring-primary outline-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Workspace Body: Salesman MTD Breakdown Table */}
        <div className="overflow-x-auto mobile-card-table-wrapper">
          <DataTable className="w-full text-left border-collapse text-xs mobile-card-table">
            <thead>
              <tr className="bg-surface-container border-b border-border-glass text-[11px] font-black text-on-surface-variant uppercase tracking-wider">
                <th className="">Salesman</th>
                <th className="">Klaster</th>
                <th className="text-right">Target (Rp)</th>
                <th className="text-right">MTD Actual (Rp)</th>
                <th className="text-center">% Achv</th>
                <th className="text-right">LMA (Rp)</th>
                <th className="text-center">% MTD/LMA</th>
                <th className="text-center">MTD Call (A/P)</th>
                <th className="text-center">Call %</th>
                <th className="text-center">EC %</th>
                <th className="text-center">SKU Sold</th>
              </tr>
            </thead>
            <tbody>
              {filteredSalesmen.map(s => <tr key={s.salesmanId} className="hover:bg-surface-variant/20 transition-colors border-b border-border-glass/60">
                  <td data-label="Salesman" className="font-bold text-on-surface whitespace-nowrap">
                    {s.salesmanName}
                  </td>
                  <td data-label="Klaster" className="text-on-surface-variant text-[11px] whitespace-nowrap">
                    {s.clusterName}
                  </td>
                  <td data-label="Target" className="text-right font-mono text-on-surface-variant whitespace-nowrap">
                    <div>{formatTarget(s.monthlyTarget,s.target?.status)}</div>
                    {s.target?.status!=='COMPARISON_ONLY'&&<SalesTargetEditor sales={s} kind="MONTH" period={`${reportData.period?.year}-${String(reportData.period?.month).padStart(2,'0')}`} onSaved={loadData}/>}
                  </td>
                  <td data-label="MTD Actual" className="text-right font-mono font-black text-on-surface whitespace-nowrap">
                    Rp {(s.mtdActualAmount || 0).toLocaleString('id-ID')}
                  </td>
                  <td data-label="% Achv" className="text-center font-mono font-bold text-purple-600">
                    <span className="px-2 py-0.5 rounded-md bg-purple-500/10">
                      {s.achievementRate}
                    </span>
                  </td>
                  <td data-label="LMA" className="text-right font-mono text-on-surface-variant whitespace-nowrap">
                    Rp {(s.lastMonthActual || 0).toLocaleString('id-ID')}
                  </td>
                  <td data-label="% MTD/LMA" className="text-center font-mono font-bold text-emerald-600">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10">
                      {s.mtdToLmaRate}
                    </span>
                  </td>
                  <td data-label="MTD Call" className="text-center font-mono whitespace-nowrap">
                    {s.mtdActualCalls} / {s.mtdPlanCalls}
                  </td>
                  <td data-label="Call %" className="text-center font-mono text-blue-600 font-bold">
                    {s.callComplianceRate}
                  </td>
                  <td data-label="EC %" className="text-center font-mono text-emerald-600 font-bold">
                    {s.effectiveCallRate}
                  </td>
                  <td data-label="SKU Sold" className="text-center font-mono">
                    {s.totalSkuSold} SKU
                  </td>
                </tr>)}

              {filteredSalesmen.length === 0 && <tr>
                  <td colSpan="11" className="text-center text-on-surface-variant font-semibold">
                    Tidak ada data MTD untuk filter yang dipilih.
                  </td>
                </tr>}
            </tbody>

            {/* Subtotal Footer */}
            {filteredSalesmen.length > 0 && <tfoot>
                <tr className="bg-surface-container border-t-2 border-border-glass font-black text-xs">
                  <td className="" colSpan="2">
                    TOTAL HASIL LAPORAN (sebelum pencarian nama)
                  </td>
                  <td className="text-right font-mono whitespace-nowrap">
                    {formatTarget(summary.monthlyTargetAmount)}
                  </td>
                  <td className="text-right font-mono font-black text-on-surface whitespace-nowrap">
                    Rp {(summary.mtdActualAmount || 0).toLocaleString('id-ID')}
                  </td>
                  <td className="text-center font-mono text-purple-700">
                    {summary.overallAchievementRate}
                  </td>
                  <td className="text-right font-mono whitespace-nowrap text-on-surface-variant">
                    Rp {(summary.lastMonthActual || 0).toLocaleString('id-ID')}
                  </td>
                  <td className="text-center font-mono text-emerald-700">
                    {summary.mtdToLmaRate}
                  </td>
                  <td className="text-center font-mono">
                    {summary.totalMtdActualCalls}/{summary.totalMtdPlanCalls}
                  </td>
                  <td className="text-center font-mono text-blue-600">
                    {summary.mtdCallComplianceRate}
                  </td>
                  <td className="text-center font-mono text-emerald-600">
                    {summary.mtdEffectiveCallRate}
                  </td>
                  <td className="text-center font-mono">
                    {summary.totalMtdSkuSold} SKU
                  </td>
                </tr>
              </tfoot>}
          </DataTable>
        </div>
      </div>;
}
