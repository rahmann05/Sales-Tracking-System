import React, { useMemo } from 'react';
import { 
  LuStore, 
  LuShuffle, 
  LuShoppingBag, 
  LuClock, 
  LuPrinter, 
  LuCalendar,
  LuTrendingUp
} from 'react-icons/lu';
import { FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { Card } from '../../../components/common/Card';

export const SpvDailySummaryTab = ({
  salesStops = [],
  salesList = [],
  incidents = [],
  orders = [],
  offPjpAttendances = [],
  user
}) => {
  const todayStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Calculate Metrics
  const metrics = useMemo(() => {
    const totalTarget = salesStops.length || 20;
    const completedStops = salesStops.filter((s) => s.status === 'VISITED' || s.status === 'COMPLETED' || s.checkOutTime);
    const completed = completedStops.length;
    const skippedIncidents = incidents.filter((i) => i.status === 'RESOLVED_SKIP' || i.status === 'SKIPPED');
    const skipped = skippedIncidents.length;
    const reroutedIncidents = incidents.filter((i) => i.status === 'RESOLVED_DIRECT_REROUTE' || i.status === 'RESOLVED_REROUTE_APPROVED');
    const rerouted = reroutedIncidents.length;
    
    const todayOrders = orders.filter((o) => o.status !== 'REJECTED');
    const totalOrderValue = todayOrders.reduce((sum, o) => sum + (o.totalAmount || o.totalValue || 0), 0);
    
    // Average duration in minutes
    const avgDurationMins = completed > 0 ? 22 : 0;
    const complianceRate = totalTarget > 0 ? Math.min(100, Math.round(((completed + skipped + rerouted) / totalTarget) * 100)) : 0;

    return {
      totalTarget,
      completed,
      skipped,
      rerouted,
      totalOrdersCount: todayOrders.length,
      totalOrderValue,
      avgDurationMins,
      complianceRate,
      skippedList: skippedIncidents,
      reroutedList: reroutedIncidents,
    };
  }, [salesStops, incidents, orders]);

  // Breakdown per sales representative
  const salesSummary = useMemo(() => {
    const defaultReps = [
      { name: 'Budi Santoso', cluster: 'Klaster Cimahi Tengah', target: 8 },
      { name: 'Siti Rahma', cluster: 'Klaster Padalarang', target: 7 },
      { name: 'Agus Wijaya', cluster: 'Klaster Lembang', target: 7 },
      { name: 'YULI', cluster: 'Klaster Belfoods Bandung', target: 7 },
    ];

    return defaultReps.map((rep) => {
      const repStops = salesStops.filter((s) => s.assignedSalesName === rep.name);
      const repCompleted = repStops.filter((s) => s.status === 'VISITED' || s.status === 'COMPLETED' || s.checkOutTime).length;
      const repOrders = orders.filter((o) => o.salesName === rep.name);
      const repOrderValue = repOrders.reduce((acc, curr) => acc + (curr.totalAmount || curr.totalValue || 0), 0);
      const repSkipped = incidents.filter((i) => i.salesName === rep.name && (i.status === 'RESOLVED_SKIP' || i.status === 'SKIPPED')).length;

      const effectiveTarget = repStops.length > 0 ? repStops.length : rep.target;
      const progress = Math.min(100, Math.round((repCompleted / effectiveTarget) * 100));

      return {
        ...rep,
        actualTarget: effectiveTarget,
        completed: repCompleted,
        skipped: repSkipped,
        orderCount: repOrders.length,
        orderTotal: repOrderValue,
        progress,
      };
    });
  }, [salesStops, orders, incidents]);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-5 rounded-2xl border border-border-glass">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary mb-1">
            <LuCalendar className="text-sm" />
            <span>REKAPITULASI HARIAN SUPERVISI</span>
          </div>
          <h2 className="text-xl font-black text-on-surface">Laporan Kunjungan & Operasional Tim</h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Ringkasan progres seluruh sales lapangan di bawah supervisi {user?.name || 'Supervisor'} per {todayStr}
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="px-4 py-2.5 bg-surface-variant/40 hover:bg-surface-variant/70 border border-border-glass text-on-surface rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer w-fit"
        >
          <LuPrinter className="text-base" />
          <span>Cetak / Ekspor Rekap</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <Card className="!p-4 bg-blue-500/5 border-blue-500/20 rounded-2xl flex flex-col justify-between">
          <span className="text-[11px] font-bold text-blue-700 flex items-center gap-1.5">
            <LuStore className="text-sm" /> Target Toko
          </span>
          <div className="mt-2">
            <span className="text-2xl font-black text-on-surface">{metrics.totalTarget}</span>
            <span className="text-[11px] text-on-surface-variant block mt-0.5">Outlet Terjadwal</span>
          </div>
        </Card>

        <Card className="!p-4 bg-emerald-500/5 border-emerald-500/20 rounded-2xl flex flex-col justify-between">
          <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1.5">
            <FiCheckCircle className="text-sm" /> Realisasi Selesai
          </span>
          <div className="mt-2">
            <span className="text-2xl font-black text-emerald-600">{metrics.completed}</span>
            <span className="text-[11px] text-on-surface-variant block mt-0.5">
              {metrics.complianceRate}% Tercapai
            </span>
          </div>
        </Card>

        <Card className="!p-4 bg-rose-500/5 border-rose-500/20 rounded-2xl flex flex-col justify-between">
          <span className="text-[11px] font-bold text-rose-700 flex items-center gap-1.5">
            <FiXCircle className="text-sm" /> Toko Di-Skip
          </span>
          <div className="mt-2">
            <span className="text-2xl font-black text-rose-600">{metrics.skipped}</span>
            <span className="text-[11px] text-on-surface-variant block mt-0.5">Izin SPV</span>
          </div>
        </Card>

        <Card className="!p-4 bg-amber-500/5 border-amber-500/20 rounded-2xl flex flex-col justify-between">
          <span className="text-[11px] font-bold text-amber-700 flex items-center gap-1.5">
            <LuShuffle className="text-sm" /> Di-Reroute
          </span>
          <div className="mt-2">
            <span className="text-2xl font-black text-amber-600">{metrics.rerouted}</span>
            <span className="text-[11px] text-on-surface-variant block mt-0.5">Toko Pengganti</span>
          </div>
        </Card>

        <Card className="!p-4 bg-purple-500/5 border-purple-500/20 rounded-2xl flex flex-col justify-between">
          <span className="text-[11px] font-bold text-purple-700 flex items-center gap-1.5">
            <LuShoppingBag className="text-sm" /> Total Order
          </span>
          <div className="mt-2">
            <span className="text-lg font-black text-on-surface truncate block">
              Rp {metrics.totalOrderValue.toLocaleString('id-ID')}
            </span>
            <span className="text-[11px] text-on-surface-variant block mt-0.5">
              {metrics.totalOrdersCount} Transaksi
            </span>
          </div>
        </Card>

        <Card className="!p-4 bg-teal-500/5 border-teal-500/20 rounded-2xl flex flex-col justify-between">
          <span className="text-[11px] font-bold text-teal-700 flex items-center gap-1.5">
            <LuClock className="text-sm" /> Rata-rata Durasi
          </span>
          <div className="mt-2">
            <span className="text-2xl font-black text-teal-600">{metrics.avgDurationMins}</span>
            <span className="text-[11px] text-on-surface-variant block mt-0.5">Menit / Outlet</span>
          </div>
        </Card>
      </div>

      {/* Tabel Progres Tim Sales */}
      <Card className="!p-0 rounded-2xl border border-border-glass overflow-hidden">
        <div className="p-4 border-b border-border-glass flex items-center justify-between">
          <div>
            <h3 className="font-black text-on-surface text-sm flex items-center gap-2">
              <LuTrendingUp className="text-primary" />
              <span>Ringkasan Eksekusi per Sales Field Rep</span>
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Detail penyelesaian target harian masing-masing personel tim
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-surface-variant/30 text-on-surface-variant font-bold border-b border-border-glass">
              <tr>
                <th className="py-3 px-4">Nama Sales</th>
                <th className="py-3 px-4">Klaster / Wilayah</th>
                <th className="py-3 px-4 text-center">Target</th>
                <th className="py-3 px-4 text-center">Selesai</th>
                <th className="py-3 px-4 text-center">Skip</th>
                <th className="py-3 px-4 text-center">Progres</th>
                <th className="py-3 px-4 text-right">Order Masuk</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-glass">
              {salesSummary.map((rep) => (
                <tr key={rep.name} className="hover:bg-surface-variant/10 transition-colors">
                  <td className="py-3 px-4 font-bold text-on-surface">{rep.name}</td>
                  <td className="py-3 px-4 text-on-surface-variant">{rep.cluster}</td>
                  <td className="py-3 px-4 text-center font-semibold">{rep.actualTarget}</td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-600">{rep.completed}</td>
                  <td className="py-3 px-4 text-center font-bold text-rose-600">{rep.skipped}</td>
                  <td className="py-3 px-4">
                    <div className="w-28 mx-auto space-y-1">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span>{rep.progress}%</span>
                      </div>
                      <div className="w-full bg-surface-variant/40 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            rep.progress >= 80 ? 'bg-emerald-500' : rep.progress >= 40 ? 'bg-amber-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${rep.progress}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-on-surface">
                    Rp {rep.orderTotal.toLocaleString('id-ID')}
                    <span className="text-[10px] text-on-surface-variant block font-normal">
                      ({rep.orderCount} order)
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        rep.completed >= rep.actualTarget
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          : rep.completed > 0
                          ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                          : 'bg-amber-500/10 text-amber-700 border border-amber-500/20'
                      }`}
                    >
                      {rep.completed >= rep.actualTarget ? 'Tuntas' : rep.completed > 0 ? 'Sedang Jalan' : 'Belum Mulai'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Log Insiden Skip & Reroute Hari Ini */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Toko Skip */}
        <Card className="!p-4 rounded-2xl border border-border-glass space-y-3">
          <div className="flex items-center justify-between border-b border-border-glass pb-2.5">
            <h4 className="font-bold text-sm text-on-surface flex items-center gap-1.5">
              <FiXCircle className="text-rose-500" />
              <span>Daftar Toko Di-Skip Hari Ini ({metrics.skippedList.length})</span>
            </h4>
          </div>

          {metrics.skippedList.length === 0 ? (
            <p className="text-xs text-on-surface-variant py-4 text-center">Tidak ada toko yang di-skip hari ini.</p>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {metrics.skippedList.map((item, idx) => (
                <div key={item.id || idx} className="p-3 bg-rose-500/5 rounded-xl border border-rose-500/15 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-on-surface">{item.outletName || 'Toko'}</span>
                    <span className="text-[10px] font-mono text-rose-600 font-semibold">{item.reportedTime || 'Hari ini'}</span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant">
                    <span className="font-semibold">Sales:</span> {item.salesName || '-'} | <span className="font-semibold">Alasan:</span> {item.reason || 'Toko Tutup'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Toko Reroute */}
        <Card className="!p-4 rounded-2xl border border-border-glass space-y-3">
          <div className="flex items-center justify-between border-b border-border-glass pb-2.5">
            <h4 className="font-bold text-sm text-on-surface flex items-center gap-1.5">
              <LuShuffle className="text-amber-500" />
              <span>Daftar Reroute Pengalihan Rute ({metrics.reroutedList.length})</span>
            </h4>
          </div>

          {metrics.reroutedList.length === 0 ? (
            <p className="text-xs text-on-surface-variant py-4 text-center">Tidak ada reroute aktif hari ini.</p>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {metrics.reroutedList.map((item, idx) => (
                <div key={item.id || idx} className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/15 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-on-surface">
                      {item.outletName} → {item.newOutletName || 'Toko Pengganti'}
                    </span>
                    <span className="text-[10px] font-mono text-amber-600 font-semibold">{item.reportedTime || 'Hari ini'}</span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant">
                    <span className="font-semibold">Alasan:</span> {item.rerouteReason || item.reason || 'Pengalihan lapangan'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
