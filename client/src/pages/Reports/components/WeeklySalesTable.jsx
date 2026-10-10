import { DataTable } from '../../../shared/components/common/DataTable';
import {useApp} from '../../../context/AppContext';
import {selectedReportItems,reportExportAllowed} from '../../../../../shared/report-presentation.mjs';
import React from 'react';
import { SalesTargetEditor } from './SalesTargetEditor';
import { formatTarget } from '../../../../../shared/sales-targets.mjs';
import { calendarDayLabel } from '../../../../../shared/report-calendar.mjs';
import { LuCalendarRange, LuDownload, LuPrinter, LuRefreshCw, LuUser, LuSearch } from 'react-icons/lu';
/**
 * WeeklyReportView Component
 * Single Responsibility: Weekly Performance Analysis (WTD) & 6-Day Work Week Matrix Table ala ND6.
 */
export function WeeklySalesTable({
  daysSummary,
  exportToCsv,
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
  summary
}) {
  const {settings,user}=useApp(),columns=new Set(selectedReportItems(settings,'REPORT_WEEKLY_COLUMNS'));
  const hidden=column=>!columns.has(column),canExport=reportExportAllowed(user,settings);
  const visibleCount=1+columns.size-(columns.has('days')?1:0)+(columns.has('days')?daysSummary.length:0);
  return <div className={`bg-surface border border-border-glass rounded-3xl shadow-xs overflow-hidden ${settings.REPORT_TABLE_DENSITY==='COMPACT'?'report-compact':''}`}>
        {/* Workspace Card Header */}
        <div className="p-4 sm:p-5 border-b border-border-glass bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-on-surface tracking-tight m-0 flex items-center gap-2">
              Matriks Kinerja Mingguan (WTD)
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-container border border-border-glass text-on-surface-variant">
                Kunjungan per hari dalam periode
              </span>
            </h3>
            <p className="text-xs text-on-surface-variant m-0 mt-0.5">
              Evaluasi kepatuhan rute, efektivitas call, dan nilai order disetujui per salesman
            </p>
          </div>

          {/* Utility Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button type="button" onClick={loadData} disabled={isLoading} className="p-2.5 bg-surface hover:bg-surface-container text-on-surface border border-border-glass rounded-xl text-xs font-bold transition-all flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-50 shadow-xs" title="Refresh Data">
              <LuRefreshCw className={isLoading ? 'animate-spin' : ''} />
            </button>

            <button type="button" disabled={!canExport||isLoading} onClick={exportToCsv} className="py-2 px-3 bg-surface hover:bg-surface-container text-on-surface border border-border-glass rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer">
              <LuDownload /> Excel
            </button>

            <button type="button" disabled={!canExport||isLoading} onClick={() => setIsPdfModalOpen(true)} className="py-2 px-3 bg-primary hover:bg-primary/90 text-on-primary rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer">
              <LuPrinter /> Cetak PDF
            </button>
          </div>
        </div>

        {/* Workspace Toolbar: Filter Controls */}
        <div className="p-4 border-b border-border-glass bg-surface-container/30">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                Tanggal Mulai Periode
              </label>
              <div className="relative flex items-center">
                <LuCalendarRange className="absolute left-3 text-on-surface-variant text-sm" />
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-surface rounded-xl text-xs font-semibold text-on-surface border border-border-glass focus:ring-2 focus:ring-primary outline-none" />
              </div>
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
                Cari Nama Salesman
              </label>
              <div className="relative flex items-center">
                <LuSearch className="absolute left-3 text-on-surface-variant text-sm" />
                <input type="text" placeholder="Ketik nama salesman..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-surface rounded-xl text-xs font-semibold text-on-surface border border-border-glass focus:ring-2 focus:ring-primary outline-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Workspace Body: Day-by-Day Performance Matrix Table */}
        <div className="overflow-x-auto mobile-card-table-wrapper">
          <DataTable className="w-full text-left border-collapse text-xs mobile-card-table">
            <thead>
              <tr className="bg-surface-container border-b border-border-glass text-[11px] font-black text-on-surface-variant uppercase tracking-wider">
                <th className="">Salesman</th>
                <th hidden={hidden('cluster')}>Klaster</th>
                {columns.has('days')&&daysSummary.map(day => <th key={day.dateStr} className="text-center">{day.dayName}<br />{day.formattedDate || day.dateStr}<br /><span className="font-normal">{calendarDayLabel(day.isWorkingDay)}</span></th>)}
                <th hidden={hidden('calls')} className="text-center">Total Act / Plan</th>
                <th hidden={hidden('callRate')} className="text-center">Call %</th>
                <th hidden={hidden('ecRate')} className="text-center">EC %</th>
                <th hidden={hidden('revenue')} className="text-right">Nilai order disetujui Mingguan (Rp)</th>
              </tr>
            </thead>
            <tbody>
              {filteredSalesmen.map(s => <tr key={s.salesmanId} className="hover:bg-surface-variant/20 transition-colors border-b border-border-glass/60">
                  <td data-label="Salesman" className="font-bold text-on-surface whitespace-nowrap">
                    {s.salesmanName}
                    <p className="text-xs font-normal">Target: {formatTarget(s.weeklyTotal?.target,s.target?.status)} · {s.weeklyTotal?.targetAchievement}</p>
                    <SalesTargetEditor sales={s} kind="WEEK" period={targetPeriod} onSaved={loadData}/>
                  </td>
                  <td hidden={hidden('cluster')} data-label="Klaster" className="text-on-surface-variant text-[11px] whitespace-nowrap">
                    {s.clusterName}
                  </td>

                  {columns.has('days')&&daysSummary.map(day => {
              const d = s.days?.[day.dayName.toLowerCase()] || {
                plan: 0,
                actual: 0,
                ec: 0
              };
              return <td key={day.dateStr} data-label={`${day.dayName} ${day.formattedDate || day.dateStr}`} className="text-center font-mono text-[11px]">
                        {d.plan > 0 || d.actual > 0 ? <div className="space-y-0.5">
                            <span className="font-bold text-on-surface">
                              {d.actual}/{d.plan}
                            </span>
                            <span className="text-[10px] text-purple-600 block">
                              EC:{d.ec}
                            </span>
                          </div> : <span className="text-on-surface-variant/40 font-mono">-</span>}
                      </td>;
            })}

                  {/* Weekly Totals */}
                  <td hidden={hidden('calls')} data-label="Total Act/Plan" className="text-center font-mono font-bold text-on-surface whitespace-nowrap">
                    {s.weeklyTotal?.actual} / {s.weeklyTotal?.plan}
                  </td>
                  <td hidden={hidden('callRate')} data-label="Call %" className="text-center font-mono font-bold text-blue-600">
                    {s.weeklyTotal?.callRate}
                  </td>
                  <td hidden={hidden('ecRate')} data-label="EC %" className="text-center font-mono font-bold text-emerald-600">
                    {s.weeklyTotal?.ecRate}
                  </td>
                  <td hidden={hidden('revenue')} data-label="Nilai order disetujui" className="text-right font-mono font-black text-on-surface whitespace-nowrap">
                    Rp {(s.weeklyTotal?.omzet || 0).toLocaleString('id-ID')}
                  </td>
                </tr>)}

              {filteredSalesmen.length === 0 && <tr>
                  <td colSpan={visibleCount} className="text-center text-on-surface-variant font-semibold">
                    Tidak ada data performa mingguan untuk filter yang dipilih.
                  </td>
                </tr>}
            </tbody>

            {/* Subtotal Footer */}
            {filteredSalesmen.length > 0 && <tfoot>
                <tr className="bg-surface-container border-t-2 border-border-glass font-black text-xs">
                  <td colSpan={columns.has('cluster')?2:1}>
                    TOTAL HASIL LAPORAN (sebelum pencarian nama)
                  </td>
                  {columns.has('days')&&daysSummary.map((ds, idx) => <td key={idx} className="text-center font-mono text-[11px]">
                      <div>{ds.actualCalls}/{ds.planCalls}</div>
                      <div className="text-[10px] text-purple-600 font-bold">EC:{ds.effectiveCalls}</div>
                    </td>)}
                  <td hidden={hidden('calls')} className="text-center font-mono">
                    {summary.totalActualCalls}/{summary.totalPlanCalls}
                  </td>
                  <td hidden={hidden('callRate')} className="text-center font-mono text-blue-600">
                    {summary.callComplianceRate}
                  </td>
                  <td hidden={hidden('ecRate')} className="text-center font-mono text-emerald-600">
                    {summary.effectiveCallRate}
                  </td>
                  <td hidden={hidden('revenue')} className="text-right font-mono text-emerald-700">
                    Rp {(summary.totalOrderAmount || 0).toLocaleString('id-ID')}
                  </td>
                </tr>
              </tfoot>}
          </DataTable>
        </div>
      </div>;
}
