import React, { useMemo } from 'react';
import { 
  LuStore, 
  LuShuffle, 
  LuClock, 
  LuPrinter, 
  LuTrendingUp,
  LuFileSpreadsheet,
  LuExternalLink
} from 'react-icons/lu';
import { FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { useApp } from '../../../context/AppContext';
import { TAB_IDS } from '../../../constants/navigation';

/**
 * SupervisorDailyRecapTab Component
 * Single Responsibility: Unified Daily Recap & Sales Team Performance Tab for Supervisor.
 * Menggabungkan ringkasan KPI kunjungan, tingkat kepatuhan rute, dan breakdown performa per salesman.
 */
export const SupervisorDailyRecapTab = ({
  salesStops = [],
  salesList = [],
  incidents = [],
  offPjpAttendances = [],
  user,
}) => {
  const { setActiveTab } = useApp();

  const todayStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Calculate Consolidated Metrics
  const metrics = useMemo(() => {
    const totalTarget = salesStops.length || 20;
    const completedStops = salesStops.filter((s) => s.status === 'VISITED' || s.status === 'COMPLETED' || s.checkOutTime);
    const completed = completedStops.length;
    const skippedIncidents = incidents.filter((i) => i.status === 'RESOLVED_SKIP' || i.status === 'SKIPPED');
    const skipped = skippedIncidents.length;
    const reroutedIncidents = incidents.filter((i) => i.status === 'RESOLVED_DIRECT_REROUTE' || i.status === 'RESOLVED_REROUTE_APPROVED');
    const rerouted = reroutedIncidents.length;
    
    const complianceRate = totalTarget > 0 ? Math.min(100, Math.round(((completed + skipped + rerouted) / totalTarget) * 100)) : 0;

    return {
      totalTarget,
      completed,
      skipped,
      rerouted,
      complianceRate,
      offPjpCount: offPjpAttendances.length,
      skippedList: skippedIncidents,
      reroutedList: reroutedIncidents,
    };
  }, [salesStops, incidents, offPjpAttendances]);

  // Breakdown per sales representative
  const salesSummary = useMemo(() => {
    const team = salesList && salesList.length > 0
      ? salesList
      : [
          { id: 'usr-sales-1', name: 'Budi Santoso', phone: '081234567890', cluster: { name: 'Klaster Cimahi' } },
          { id: 'usr-sales-2', name: 'Siti Aminah', phone: '081298765432', cluster: { name: 'Klaster Bandung Barat' } },
        ];

    return team.map((sales) => {
      const stopsForSales = salesStops.filter((s) => s.salesId === sales.id || s.salesName === sales.name);
      const target = stopsForSales.length || 10;
      const done = stopsForSales.filter((s) => s.status === 'VISITED' || s.status === 'COMPLETED' || s.checkOutTime).length;
      const skips = incidents.filter((i) => (i.salesId === sales.id || i.salesName === sales.name) && (i.status === 'RESOLVED_SKIP' || i.status === 'SKIPPED')).length;
      const reroutes = incidents.filter((i) => (i.salesId === sales.id || i.salesName === sales.name) && (i.status === 'RESOLVED_DIRECT_REROUTE' || i.status === 'RESOLVED_REROUTE_APPROVED')).length;
      const offPjp = offPjpAttendances.filter((a) => a.userId === sales.id || a.userName === sales.name).length;

      const rate = target > 0 ? Math.min(100, Math.round(((done + skips + reroutes) / target) * 100)) : 0;

      return {
        ...sales,
        target,
        done,
        skips,
        reroutes,
        offPjp,
        complianceRate: rate,
        status: done === target ? 'Selesai' : done > 0 ? 'Sedang Kunjungan' : 'Belum Mulai',
      };
    });
  }, [salesList, salesStops, incidents, offPjpAttendances]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* 1. Symmetrical KPI Metric Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 w-full">
        <div className="bg-surface border border-border-glass rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant mb-1">
            <span className="text-xs font-semibold">Total Target RJP</span>
            <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface text-sm">
              <LuStore />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight my-1">
            {metrics.totalTarget} <span className="text-xs font-normal text-on-surface-variant">Toko</span>
          </div>
          <p className="text-[11px] text-on-surface-variant mt-1 m-0">Rute jadwal hari {todayStr.split(',')[0]}</p>
        </div>

        <div className="bg-surface border border-border-glass rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant mb-1">
            <span className="text-xs font-semibold">Kunjungan Berhasil</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/60 flex items-center justify-center text-sm">
              <FiCheckCircle />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight my-1">
            {metrics.completed} <span className="text-xs font-normal text-on-surface-variant">Toko</span>
          </div>
          <div className="w-full bg-surface-container rounded-full h-1.5 mt-1 overflow-hidden">
            <div 
              className="bg-primary h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.round((metrics.completed / (metrics.totalTarget || 1)) * 100))}%` }}
            />
          </div>
        </div>

        <div className="bg-surface border border-border-glass rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant mb-1">
            <span className="text-xs font-semibold">Kepatuhan (Call %)</span>
            <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface text-sm">
              <LuTrendingUp />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight my-1">
            {metrics.complianceRate}%
          </div>
          <p className="text-[11px] text-on-surface-variant mt-1 m-0">Realisasi kunjungan rute</p>
        </div>

        <div className="bg-surface border border-border-glass rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant mb-1">
            <span className="text-xs font-semibold">Penanganan Toko Tutup</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/60 flex items-center justify-center text-sm">
              <LuShuffle />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight my-1">
            {metrics.skipped + metrics.rerouted} <span className="text-xs font-normal text-on-surface-variant">Kasus</span>
          </div>
          <p className="text-[11px] text-on-surface-variant mt-1 m-0">
            {metrics.skipped} skip, {metrics.rerouted} reroute
          </p>
        </div>
      </div>

      {/* 2. Team Performance Breakdown Table */}
      <div className="bg-surface border border-border-glass rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-glass">
          <div>
            <h3 className="text-base font-black text-on-surface m-0">Kinerja Harian Sales Lapangan</h3>
            <p className="text-xs text-on-surface-variant mt-0.5 m-0">
              Monitoring progres kunjungan toko dan kepatuhan rute per sales per {todayStr}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 bg-surface border border-border-glass hover:bg-surface-container rounded-xl text-xs font-bold text-on-surface flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <LuPrinter className="text-sm" />
              <span>Cetak Rekap</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab(TAB_IDS.REPORTS)}
              className="px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs hover:bg-primary/90 transition-all cursor-pointer"
            >
              <LuExternalLink className="text-sm" />
              <span>Laporan ND6 Lengkap</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border-glass text-on-surface-variant font-bold">
                <th className="pb-3 px-3">Nama Salesman</th>
                <th className="pb-3 px-3">Kluster Wilayah</th>
                <th className="pb-3 px-3 text-center">Target RJP</th>
                <th className="pb-3 px-3 text-center">Selesai</th>
                <th className="pb-3 px-3 text-center">Toko Tutup</th>
                <th className="pb-3 px-3 text-center">Luar RJP</th>
                <th className="pb-3 px-3">Kepatuhan</th>
                <th className="pb-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-glass">
              {salesSummary.map((s) => (
                <tr key={s.id} className="hover:bg-surface-variant/20 transition-colors">
                  <td className="py-3 px-3 font-bold text-on-surface">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0">
                        {s.name.charAt(0)}
                      </div>
                      <div>
                        <span>{s.name}</span>
                        <div className="text-[10px] text-on-surface-variant font-normal">{s.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-on-surface-variant">
                    {s.cluster?.name || 'Klaster Bandung'}
                  </td>
                  <td className="py-3 px-3 text-center font-bold">{s.target}</td>
                  <td className="py-3 px-3 text-center font-extrabold text-emerald-600">{s.done}</td>
                  <td className="py-3 px-3 text-center text-amber-600 font-semibold">
                    {s.skips + s.reroutes > 0 ? `${s.skips + s.reroutes} toko` : '-'}
                  </td>
                  <td className="py-3 px-3 text-center text-blue-600 font-semibold">
                    {s.offPjp > 0 ? `${s.offPjp} toko` : '-'}
                  </td>
                  <td className="py-3 px-3 min-w-[120px]">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-surface-container rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-1.5 rounded-full ${
                            s.complianceRate >= 80 ? 'bg-emerald-500' : s.complianceRate >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${s.complianceRate}%` }}
                        />
                      </div>
                      <span className="font-extrabold text-[11px] w-8 text-right">{s.complianceRate}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      s.status === 'Selesai'
                        ? 'bg-emerald-500/10 text-emerald-700'
                        : s.status === 'Sedang Kunjungan'
                        ? 'bg-blue-500/10 text-blue-700'
                        : 'bg-surface-container text-on-surface-variant'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
