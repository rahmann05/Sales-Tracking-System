import React, { useState, useEffect, useCallback } from 'react';
import { reportsApi, usersApi } from '../../../services/api';
import { MtdReportPdfView } from './MtdReportPdfView';
import {
  LuCalendar,
  LuTarget,
  LuTrendingUp,
  LuShoppingBag,
  LuCircleCheck,
  LuDownload,
  LuPrinter,
  LuRefreshCw,
  LuUser,
  LuSearch,
  LuLayers,
} from 'react-icons/lu';

const MONTH_OPTIONS = [
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Desember' },
];

/**
 * MtdReportView Component
 * Single Responsibility: Month-to-Date (MTD) Target Achievement, LMA Comparison & Channel Performance ala ND6.
 */
export const MtdReportView = () => {
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [salesmanId, setSalesmanId] = useState('');
  const [search, setSearch] = useState('');
  const [salesTeam, setSalesTeam] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const [reportData, setReportData] = useState({
    period: { month: 8, monthName: 'Agustus', year: 2026, workingDaysElapsed: 0, totalWorkingDays: 26, workingDaysRate: '0%' },
    summary: {
      monthlyTargetAmount: 0,
      mtdActualAmount: 0,
      overallAchievementRate: '0%',
      overallAchievementRateNum: 0,
      lastMonthActual: 0,
      mtdToLmaRate: '0%',
      totalMtdPlanCalls: 0,
      totalMtdActualCalls: 0,
      mtdCallComplianceRate: '0%',
      totalMtdEffectiveCalls: 0,
      mtdEffectiveCallRate: '0%',
      totalMtdSkuSold: 0,
      avgDailyRevenue: 0,
    },
    channelBreakdown: [],
    salesmen: [],
  });

  // Fetch Sales Team
  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const res = await usersApi.getUsers();
        if (res?.data) {
          setSalesTeam(res.data.filter((u) => u.role === 'SALES'));
        }
      } catch (err) {
        console.warn('[MtdReportView] Failed to fetch sales team:', err.message);
      }
    };
    fetchTeam();
  }, []);

  // Fetch MTD Data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await reportsApi.getMtd({
        month,
        year,
        userId: salesmanId || undefined,
      });
      if (res?.data) {
        setReportData(res.data);
      }
    } catch (err) {
      console.warn('[MtdReportView] Failed to load MTD report:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [month, year, salesmanId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedSalesman = salesTeam.find((s) => s.id === salesmanId);
  const salesmanName = selectedSalesman?.name || '';

  // Export to CSV/Excel
  const exportToCsv = () => {
    if (!reportData?.salesmen || reportData.salesmen.length === 0) {
      alert('Tidak ada data MTD untuk diekspor.');
      return;
    }

    const headers = [
      'No',
      'Salesman',
      'Klaster',
      'Target Bulanan (Rp)',
      'MTD Actual (Rp)',
      '% Target Achievement',
      'Last Month Actual (LMA Rp)',
      '% MTD to LMA (Growth)',
      'MTD Plan Calls',
      'MTD Actual Calls',
      'Call Compliance Rate',
      'MTD Effective Calls',
      'Effective Call Rate',
      'Total SKU Sold',
      'Avg SKU per Call',
    ];

    const csvRows = [headers.join(',')];

    reportData.salesmen.forEach((s, idx) => {
      const row = [
        idx + 1,
        `"${(s.salesmanName || '').replace(/"/g, '""')}"`,
        `"${(s.clusterName || '').replace(/"/g, '""')}"`,
        s.monthlyTarget,
        s.mtdActualAmount,
        `"${s.achievementRate}"`,
        s.lastMonthActual,
        `"${s.mtdToLmaRate}"`,
        s.mtdPlanCalls,
        s.mtdActualCalls,
        `"${s.callComplianceRate}"`,
        s.mtdEffectiveCalls,
        `"${s.effectiveCallRate}"`,
        s.totalSkuSold,
        s.avgSkuPerCall,
      ];
      csvRows.push(row.join(','));
    });

    const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MTD_PERFORMANCE_REPORT_${reportData.period.monthName}_${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const { period = {}, summary = {}, channelBreakdown = [], salesmen = [] } = reportData;

  const filteredSalesmen = search
    ? salesmen.filter((s) => s.salesmanName.toLowerCase().includes(search.toLowerCase()))
    : salesmen;

  return (
    <div className="space-y-5">
      {/* 1. Top Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 w-full">
        {/* Working Days Card */}
        <div className="bg-surface border border-border-glass rounded-2xl p-4 shadow-xs space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-on-surface-variant font-semibold">Hari Kerja Berjalan</span>
            <div className="w-9 h-9 rounded-xl bg-surface-container text-on-surface border border-border-glass flex items-center justify-center shrink-0">
              <LuCalendar className="text-base" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-xl md:text-2xl font-black text-on-surface tracking-tight">
              {period.workingDaysElapsed} <span className="text-xs font-normal text-on-surface-variant">/ {period.totalWorkingDays} Hari</span>
            </div>
            <span className="text-xs font-bold font-mono text-on-surface bg-surface-container border border-border-glass px-2 py-0.5 rounded-lg">
              {period.workingDaysRate}
            </span>
          </div>
          <p className="text-[11px] text-on-surface-variant m-0 truncate">Progress {period.monthName} {period.year}</p>
        </div>

        {/* Target vs Actual MTD */}
        <div className="bg-surface border border-border-glass rounded-2xl p-4 shadow-xs space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-on-surface-variant font-semibold">Pencapaian Target MTD</span>
            <div className="w-9 h-9 rounded-xl bg-surface-container text-on-surface border border-border-glass flex items-center justify-center shrink-0">
              <LuTarget className="text-base" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-lg md:text-xl font-black text-on-surface tracking-tight">
              Rp {(summary.mtdActualAmount || 0).toLocaleString('id-ID')}
            </div>
            <span className="text-xs font-bold font-mono text-on-surface bg-surface-container border border-border-glass px-2 py-0.5 rounded-lg">
              {summary.overallAchievementRate}
            </span>
          </div>
          <p className="text-[11px] text-on-surface-variant m-0 truncate">
            Target: Rp {(summary.monthlyTargetAmount || 0).toLocaleString('id-ID')}
          </p>
        </div>

        {/* MTD vs LMA (Growth) */}
        <div className="bg-surface border border-border-glass rounded-2xl p-4 shadow-xs space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-on-surface-variant font-semibold">MTD vs LMA (Bulan Lalu)</span>
            <div className="w-9 h-9 rounded-xl bg-surface-container text-on-surface border border-border-glass flex items-center justify-center shrink-0">
              <LuTrendingUp className="text-base" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-lg md:text-xl font-black text-on-surface tracking-tight">
              {summary.mtdToLmaRate}
            </div>
            <span className="text-xs font-bold font-mono text-on-surface bg-surface-container border border-border-glass px-2 py-0.5 rounded-lg">
              MoM Growth
            </span>
          </div>
          <p className="text-[11px] text-on-surface-variant m-0 truncate">
            LMA: Rp {(summary.lastMonthActual || 0).toLocaleString('id-ID')}
          </p>
        </div>

        {/* Call & EC Compliance */}
        <div className="bg-surface border border-border-glass rounded-2xl p-4 shadow-xs space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-on-surface-variant font-semibold">Call & Effective Call</span>
            <div className="w-9 h-9 rounded-xl bg-surface-container text-on-surface border border-border-glass flex items-center justify-center shrink-0">
              <LuCircleCheck className="text-base" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-xl md:text-2xl font-black text-on-surface tracking-tight">
              {summary.mtdEffectiveCallRate} <span className="text-xs font-normal text-on-surface-variant">EC</span>
            </div>
            <span className="text-xs font-bold font-mono text-on-surface bg-surface-container border border-border-glass px-2 py-0.5 rounded-lg">
              Call: {summary.mtdCallComplianceRate}
            </span>
          </div>
          <p className="text-[11px] text-on-surface-variant m-0 truncate">
            {summary.totalMtdEffectiveCalls} toko order ({summary.totalMtdSkuSold} SKU)
          </p>
        </div>
      </div>

      {/* 2. Channel Contribution Cards */}
      {channelBreakdown.length > 0 && (
        <div className="bg-surface border border-border-glass rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <LuLayers className="text-primary text-base" />
            <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider m-0">
              Distribusi Penjualan per Saluran (Channel Contribution)
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {channelBreakdown.map((c) => (
              <div key={c.channelKey} className="p-3 bg-surface-container rounded-xl border border-border-glass space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-on-surface">{c.channelName}</span>
                  <span className="text-xs font-black text-primary px-2 py-0.5 rounded-md bg-primary/10">
                    {c.contributionRate}
                  </span>
                </div>
                <div className="flex items-baseline justify-between text-xs text-on-surface-variant font-mono">
                  <span>Omzet: <strong>Rp {(c.mtdOmzet || 0).toLocaleString('id-ID')}</strong></span>
                  <span>{c.mtdEc} EC ({c.mtdVisits} Visit)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Unified Workspace Card: Header + Filters + MTD Breakdown Table */}
      <div className="bg-surface border border-border-glass rounded-3xl shadow-xs overflow-hidden">
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
            <button
              type="button"
              onClick={loadData}
              disabled={isLoading}
              className="p-2.5 bg-surface hover:bg-surface-container text-on-surface border border-border-glass rounded-xl text-xs font-bold transition-all flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-50 shadow-xs"
              title="Refresh Data"
            >
              <LuRefreshCw className={isLoading ? 'animate-spin' : ''} />
            </button>

            <button
              type="button"
              onClick={exportToCsv}
              className="py-2 px-3 bg-surface hover:bg-surface-container text-on-surface border border-border-glass rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <LuDownload /> Excel
            </button>

            <button
              type="button"
              onClick={() => setIsPdfModalOpen(true)}
              className="py-2 px-3 bg-primary hover:bg-primary/90 text-on-primary rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
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
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full p-2 bg-surface rounded-xl text-xs font-semibold text-on-surface border border-border-glass focus:ring-2 focus:ring-primary outline-none"
              >
                {MONTH_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                Tahun
              </label>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full p-2 bg-surface rounded-xl text-xs font-semibold text-on-surface border border-border-glass focus:ring-2 focus:ring-primary outline-none"
              >
                {[2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                Pilih Salesman
              </label>
              <div className="relative flex items-center">
                <LuUser className="absolute left-3 text-on-surface-variant text-sm" />
                <select
                  value={salesmanId}
                  onChange={(e) => setSalesmanId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-surface rounded-xl text-xs font-semibold text-on-surface border border-border-glass focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="">Semua Salesman (Tim)</option>
                  {salesTeam.map((sales) => (
                    <option key={sales.id} value={sales.id}>
                      {sales.name} ({sales.cluster?.name || 'Klaster Terjadwal'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                Cari Salesman
              </label>
              <div className="relative flex items-center">
                <LuSearch className="absolute left-3 text-on-surface-variant text-sm" />
                <input
                  type="text"
                  placeholder="Ketik nama salesman..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-surface rounded-xl text-xs font-semibold text-on-surface border border-border-glass focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Workspace Body: Salesman MTD Breakdown Table */}
        <div className="overflow-x-auto mobile-card-table-wrapper">
          <table className="w-full text-left border-collapse text-xs mobile-card-table">
            <thead>
              <tr className="bg-surface-container border-b border-border-glass text-[11px] font-black text-on-surface-variant uppercase tracking-wider">
                <th className="py-3 px-3">Salesman</th>
                <th className="py-3 px-3">Klaster</th>
                <th className="py-3 px-3 text-right">Target (Rp)</th>
                <th className="py-3 px-3 text-right">MTD Actual (Rp)</th>
                <th className="py-3 px-3 text-center">% Achv</th>
                <th className="py-3 px-3 text-right">LMA (Rp)</th>
                <th className="py-3 px-3 text-center">% MTD/LMA</th>
                <th className="py-3 px-3 text-center">MTD Call (A/P)</th>
                <th className="py-3 px-3 text-center">Call %</th>
                <th className="py-3 px-3 text-center">EC %</th>
                <th className="py-3 px-3 text-center">SKU Sold</th>
              </tr>
            </thead>
            <tbody>
              {filteredSalesmen.map((s) => (
                <tr
                  key={s.salesmanId}
                  className="hover:bg-surface-variant/20 transition-colors border-b border-border-glass/60"
                >
                  <td data-label="Salesman" className="py-3 px-3 font-bold text-on-surface whitespace-nowrap">
                    {s.salesmanName}
                  </td>
                  <td data-label="Klaster" className="py-3 px-3 text-on-surface-variant text-[11px] whitespace-nowrap">
                    {s.clusterName}
                  </td>
                  <td data-label="Target" className="py-3 px-3 text-right font-mono text-on-surface-variant whitespace-nowrap">
                    Rp {(s.monthlyTarget || 0).toLocaleString('id-ID')}
                  </td>
                  <td data-label="MTD Actual" className="py-3 px-3 text-right font-mono font-black text-on-surface whitespace-nowrap">
                    Rp {(s.mtdActualAmount || 0).toLocaleString('id-ID')}
                  </td>
                  <td data-label="% Achv" className="py-3 px-3 text-center font-mono font-bold text-purple-600">
                    <span className="px-2 py-0.5 rounded-md bg-purple-500/10">
                      {s.achievementRate}
                    </span>
                  </td>
                  <td data-label="LMA" className="py-3 px-3 text-right font-mono text-on-surface-variant whitespace-nowrap">
                    Rp {(s.lastMonthActual || 0).toLocaleString('id-ID')}
                  </td>
                  <td data-label="% MTD/LMA" className="py-3 px-3 text-center font-mono font-bold text-emerald-600">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10">
                      {s.mtdToLmaRate}
                    </span>
                  </td>
                  <td data-label="MTD Call" className="py-3 px-3 text-center font-mono whitespace-nowrap">
                    {s.mtdActualCalls} / {s.mtdPlanCalls}
                  </td>
                  <td data-label="Call %" className="py-3 px-3 text-center font-mono text-blue-600 font-bold">
                    {s.callComplianceRate}
                  </td>
                  <td data-label="EC %" className="py-3 px-3 text-center font-mono text-emerald-600 font-bold">
                    {s.effectiveCallRate}
                  </td>
                  <td data-label="SKU Sold" className="py-3 px-3 text-center font-mono">
                    {s.totalSkuSold} SKU
                  </td>
                </tr>
              ))}

              {filteredSalesmen.length === 0 && (
                <tr>
                  <td colSpan="11" className="py-12 text-center text-on-surface-variant font-semibold">
                    Tidak ada data MTD untuk filter yang dipilih.
                  </td>
                </tr>
              )}
            </tbody>

            {/* Subtotal Footer */}
            {filteredSalesmen.length > 0 && (
              <tfoot>
                <tr className="bg-surface-container border-t-2 border-border-glass font-black text-xs">
                  <td className="py-3 px-3" colSpan="2">
                    TOTAL TIM DISTRIBUSI ({filteredSalesmen.length} Sales)
                  </td>
                  <td className="py-3 px-3 text-right font-mono whitespace-nowrap">
                    Rp {(summary.monthlyTargetAmount || 0).toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-black text-on-surface whitespace-nowrap">
                    Rp {(summary.mtdActualAmount || 0).toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-purple-700">
                    {summary.overallAchievementRate}
                  </td>
                  <td className="py-3 px-3 text-right font-mono whitespace-nowrap text-on-surface-variant">
                    Rp {(summary.lastMonthActual || 0).toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-emerald-700">
                    {summary.mtdToLmaRate}
                  </td>
                  <td className="py-3 px-3 text-center font-mono">
                    {summary.totalMtdActualCalls}/{summary.totalMtdPlanCalls}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-blue-600">
                    {summary.mtdCallComplianceRate}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-emerald-600">
                    {summary.mtdEffectiveCallRate}
                  </td>
                  <td className="py-3 px-3 text-center font-mono">
                    {summary.totalMtdSkuSold} SKU
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* PDF Modal */}
      {isPdfModalOpen && (
        <MtdReportPdfView
          reportData={reportData}
          salesmanName={salesmanName}
          onClose={() => setIsPdfModalOpen(false)}
        />
      )}
    </div>
  );
};

