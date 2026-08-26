import React, { useState, useEffect, useCallback } from 'react';
import { reportsApi, usersApi } from '../../../services/api';
import { WeeklyReportPdfView } from './WeeklyReportPdfView';
import {
  LuCalendarRange,
  LuPhoneCall,
  LuShoppingBag,
  LuCircleCheck,
  LuDownload,
  LuPrinter,
  LuRefreshCw,
  LuUser,
  LuSearch,
} from 'react-icons/lu';
import { FiAlertTriangle } from 'react-icons/fi';

/**
 * WeeklyReportView Component
 * Single Responsibility: Weekly Performance Analysis (WTD) & 6-Day Work Week Matrix Table ala ND6.
 */
export const WeeklyReportView = () => {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = (day + 6) % 7;
    d.setDate(d.getDate() - diff);
    return d.toISOString().split('T')[0];
  });

  const [salesmanId, setSalesmanId] = useState('');
  const [search, setSearch] = useState('');
  const [salesTeam, setSalesTeam] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const [reportData, setReportData] = useState({
    period: { startDate: '', endDate: '', weekDays: [] },
    summary: {
      totalPlanCalls: 0,
      totalActualCalls: 0,
      callComplianceRate: '0%',
      totalEffectiveCalls: 0,
      effectiveCallRate: '0%',
      totalOrderAmount: 0,
      totalSkuSold: 0,
      avgDurationMinutes: 0,
      totalAnomalies: 0,
    },
    daysSummary: [],
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
        console.warn('[WeeklyReportView] Failed to fetch sales team:', err.message);
      }
    };
    fetchTeam();
  }, []);

  // Fetch Weekly Data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await reportsApi.getWeekly({
        startDate,
        userId: salesmanId || undefined,
      });
      if (res?.data) {
        setReportData(res.data);
      }
    } catch (err) {
      console.warn('[WeeklyReportView] Failed to load weekly report:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, salesmanId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedSalesman = salesTeam.find((s) => s.id === salesmanId);
  const salesmanName = selectedSalesman?.name || '';

  // Export to CSV/Excel
  const exportToCsv = () => {
    if (!reportData?.salesmen || reportData.salesmen.length === 0) {
      alert('Tidak ada data mingguan untuk diekspor.');
      return;
    }

    const headers = [
      'Salesman',
      'Klaster',
      'Senin Plan',
      'Senin Act',
      'Senin EC',
      'Senin Omzet',
      'Selasa Plan',
      'Selasa Act',
      'Selasa EC',
      'Selasa Omzet',
      'Rabu Plan',
      'Rabu Act',
      'Rabu EC',
      'Rabu Omzet',
      'Kamis Plan',
      'Kamis Act',
      'Kamis EC',
      'Kamis Omzet',
      'Jumat Plan',
      'Jumat Act',
      'Jumat EC',
      'Jumat Omzet',
      'Sabtu Plan',
      'Sabtu Act',
      'Sabtu EC',
      'Sabtu Omzet',
      'Total Plan',
      'Total Actual',
      'Call Compliance Rate',
      'Total EC',
      'EC Rate',
      'Total Omzet (Rp)',
      'Target Mingguan',
      'Target Achievement',
    ];

    const csvRows = [headers.join(',')];

    reportData.salesmen.forEach((s) => {
      const getD = (k) => s.days?.[k] || { plan: 0, actual: 0, ec: 0, omzet: 0 };
      const sen = getD('senin');
      const sel = getD('selasa');
      const rab = getD('rabu');
      const kam = getD('kamis');
      const jum = getD('jumat');
      const sab = getD('sabtu');

      const row = [
        `"${(s.salesmanName || '').replace(/"/g, '""')}"`,
        `"${(s.clusterName || '').replace(/"/g, '""')}"`,
        sen.plan, sen.actual, sen.ec, sen.omzet,
        sel.plan, sel.actual, sel.ec, sel.omzet,
        rab.plan, rab.actual, rab.ec, rab.omzet,
        kam.plan, kam.actual, kam.ec, kam.omzet,
        jum.plan, jum.actual, jum.ec, jum.omzet,
        sab.plan, sab.actual, sab.ec, sab.omzet,
        s.weeklyTotal?.plan,
        s.weeklyTotal?.actual,
        `"${s.weeklyTotal?.callRate}"`,
        s.weeklyTotal?.ec,
        `"${s.weeklyTotal?.ecRate}"`,
        s.weeklyTotal?.omzet,
        s.weeklyTotal?.target,
        `"${s.weeklyTotal?.targetAchievement}"`,
      ];
      csvRows.push(row.join(','));
    });

    const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WEEKLY_PERFORMANCE_REPORT_${startDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const { summary = {}, salesmen = [], daysSummary = [] } = reportData;

  const filteredSalesmen = search
    ? salesmen.filter((s) => s.salesmanName.toLowerCase().includes(search.toLowerCase()))
    : salesmen;

  return (
    <div className="space-y-5">
      {/* 1. Top Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-surface border border-border-glass rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-on-surface-variant font-semibold">Total Kunjungan Mingguan</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <LuPhoneCall className="text-base" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-xl md:text-2xl font-black text-on-surface">
              {summary.totalActualCalls} <span className="text-xs font-normal text-on-surface-variant">/ {summary.totalPlanCalls} Plan</span>
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-lg">
              {summary.callComplianceRate}
            </span>
          </div>
          <p className="text-[11px] text-on-surface-variant m-0">Kepatuhan rute 6 hari kerja</p>
        </div>

        <div className="bg-surface border border-border-glass rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-on-surface-variant font-semibold">Effective Call (EC)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <LuCircleCheck className="text-base" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-xl md:text-2xl font-black text-emerald-600">
              {summary.totalEffectiveCalls} <span className="text-xs font-normal text-on-surface-variant">Toko Order</span>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-lg">
              {summary.effectiveCallRate}
            </span>
          </div>
          <p className="text-[11px] text-on-surface-variant m-0">Rasio toko menghasilkan pesanan</p>
        </div>

        <div className="bg-surface border border-border-glass rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-on-surface-variant font-semibold">Omzet Mingguan (WTD)</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <LuShoppingBag className="text-base" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-lg md:text-xl font-black text-on-surface">
              Rp {(summary.totalOrderAmount || 0).toLocaleString('id-ID')}
            </div>
            <span className="text-xs font-bold text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded-lg">
              {summary.totalSkuSold} SKU
            </span>
          </div>
          <p className="text-[11px] text-on-surface-variant m-0">Rata-rata durasi: {summary.avgDurationMinutes} Menit/toko</p>
        </div>

        <div
          className={`border rounded-2xl p-4 shadow-sm space-y-2 ${
            summary.totalAnomalies > 0 ? 'bg-rose-500/5 border-rose-500/30' : 'bg-surface border-border-glass'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-on-surface-variant font-semibold">Anomali Lapangan</span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                summary.totalAnomalies > 0 ? 'bg-rose-500/15 text-rose-600' : 'bg-emerald-500/10 text-emerald-600'
              }`}
            >
              <FiAlertTriangle className="text-base" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div
              className={`text-xl md:text-2xl font-black ${
                summary.totalAnomalies > 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {summary.totalAnomalies} <span className="text-xs font-normal text-on-surface-variant">Kasus</span>
            </div>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                summary.totalAnomalies > 0 ? 'bg-rose-500/10 text-rose-600' : 'bg-emerald-500/10 text-emerald-600'
              }`}
            >
              {summary.totalAnomalies > 0 ? 'Perlu Evaluasi' : 'Normal'}
            </span>
          </div>
          <p className="text-[11px] text-on-surface-variant m-0">Total kunjungan &lt; 5m atau deviasi radius</p>
        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="bg-surface border border-border-glass rounded-2xl p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
              Tanggal Mulai (Senin)
            </label>
            <div className="relative flex items-center">
              <LuCalendarRange className="absolute left-3 text-on-surface-variant text-sm" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-surface-container rounded-xl text-xs font-semibold text-on-surface border border-border-glass focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
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
                className="w-full pl-9 pr-3 py-2 bg-surface-container rounded-xl text-xs font-semibold text-on-surface border border-border-glass focus:ring-2 focus:ring-primary outline-none"
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
              Cari Nama Salesman
            </label>
            <div className="relative flex items-center">
              <LuSearch className="absolute left-3 text-on-surface-variant text-sm" />
              <input
                type="text"
                placeholder="Ketik nama salesman..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-surface-container rounded-xl text-xs font-semibold text-on-surface border border-border-glass focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>

          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={loadData}
              disabled={isLoading}
              className="p-2.5 bg-surface-container hover:bg-surface-container-high text-on-surface border border-border-glass rounded-xl text-xs font-bold transition-all flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-50"
              title="Refresh Data"
            >
              <LuRefreshCw className={isLoading ? 'animate-spin' : ''} />
            </button>

            <button
              type="button"
              onClick={exportToCsv}
              className="flex-1 py-2 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer"
            >
              <LuDownload /> Excel
            </button>

            <button
              type="button"
              onClick={() => setIsPdfModalOpen(true)}
              className="flex-1 py-2 px-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer"
            >
              <LuPrinter /> Cetak PDF
            </button>
          </div>
        </div>
      </div>

      {/* 3. Day-by-Day Performance Matrix Table */}
      <div className="bg-surface border border-border-glass rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-container border-b border-border-glass text-[11px] font-black text-on-surface-variant uppercase tracking-wider">
                <th className="py-3 px-3">Salesman</th>
                <th className="py-3 px-3">Klaster</th>
                <th className="py-3 px-2 text-center">Senin</th>
                <th className="py-3 px-2 text-center">Selasa</th>
                <th className="py-3 px-2 text-center">Rabu</th>
                <th className="py-3 px-2 text-center">Kamis</th>
                <th className="py-3 px-2 text-center">Jumat</th>
                <th className="py-3 px-2 text-center">Sabtu</th>
                <th className="py-3 px-3 text-center">Total Act / Plan</th>
                <th className="py-3 px-3 text-center">Call %</th>
                <th className="py-3 px-3 text-center">EC %</th>
                <th className="py-3 px-3 text-right">Omzet Mingguan (Rp)</th>
              </tr>
            </thead>
            <tbody>
              {filteredSalesmen.map((s) => (
                <tr
                  key={s.salesmanId}
                  className="hover:bg-surface-variant/20 transition-colors border-b border-border-glass/60"
                >
                  <td className="py-3 px-3 font-bold text-on-surface whitespace-nowrap">
                    {s.salesmanName}
                  </td>
                  <td className="py-3 px-3 text-on-surface-variant text-[11px] whitespace-nowrap">
                    {s.clusterName}
                  </td>

                  {/* 6 Day Breakdown */}
                  {['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'].map((dayKey) => {
                    const d = s.days?.[dayKey] || { plan: 0, actual: 0, ec: 0 };
                    return (
                      <td key={dayKey} className="py-3 px-2 text-center font-mono text-[11px]">
                        {d.plan > 0 ? (
                          <div className="space-y-0.5">
                            <span className="font-bold text-on-surface">
                              {d.actual}/{d.plan}
                            </span>
                            <span className="text-[10px] text-purple-600 block">
                              EC:{d.ec}
                            </span>
                          </div>
                        ) : (
                          <span className="text-on-surface-variant/40 font-mono">-</span>
                        )}
                      </td>
                    );
                  })}

                  {/* Weekly Totals */}
                  <td className="py-3 px-3 text-center font-mono font-bold text-on-surface whitespace-nowrap">
                    {s.weeklyTotal?.actual} / {s.weeklyTotal?.plan}
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-blue-600">
                    {s.weeklyTotal?.callRate}
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-emerald-600">
                    {s.weeklyTotal?.ecRate}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-black text-on-surface whitespace-nowrap">
                    Rp {(s.weeklyTotal?.omzet || 0).toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}

              {filteredSalesmen.length === 0 && (
                <tr>
                  <td colSpan="12" className="py-12 text-center text-on-surface-variant font-semibold">
                    Tidak ada data performa mingguan untuk filter yang dipilih.
                  </td>
                </tr>
              )}
            </tbody>

            {/* Subtotal Footer */}
            {filteredSalesmen.length > 0 && (
              <tfoot>
                <tr className="bg-surface-container border-t-2 border-border-glass font-black text-xs">
                  <td className="py-3 px-3" colSpan="2">
                    TOTAL TIM SALES ({filteredSalesmen.length} Sales)
                  </td>
                  {daysSummary.map((ds, idx) => (
                    <td key={idx} className="py-3 px-2 text-center font-mono text-[11px]">
                      <div>{ds.actualCalls}/{ds.planCalls}</div>
                      <div className="text-[10px] text-purple-600 font-bold">EC:{ds.effectiveCalls}</div>
                    </td>
                  ))}
                  <td className="py-3 px-3 text-center font-mono">
                    {summary.totalActualCalls}/{summary.totalPlanCalls}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-blue-600">
                    {summary.callComplianceRate}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-emerald-600">
                    {summary.effectiveCallRate}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-700">
                    Rp {(summary.totalOrderAmount || 0).toLocaleString('id-ID')}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* PDF Modal */}
      {isPdfModalOpen && (
        <WeeklyReportPdfView
          reportData={reportData}
          salesmanName={salesmanName}
          onClose={() => setIsPdfModalOpen(false)}
        />
      )}
    </div>
  );
};

