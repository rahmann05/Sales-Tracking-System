import React from 'react';
import { useApp } from '../../context/AppContext';
import { AdminApprovalHeader } from './components/AdminApprovalHeader';
import { PendingOrderCard } from './components/PendingOrderCard';
import { UnlockRequestCard } from './components/UnlockRequestCard';
import { TAB_IDS } from '../../constants/navigation';
import {
  LuPhoneCall,
  LuShieldAlert,
  LuFileSpreadsheet,
  LuNavigation,
  LuClipboardList,
  LuArrowRight,
  LuLayers,
} from 'react-icons/lu';
import { FiBarChart2 } from 'react-icons/fi';

/**
 * AdminApprovalPage Component (Container Page for Admin Role)
 * Single Responsibility: Admin workspace for order approval, unlock requests, and central oversight over all distribution flows (Attendance, PJP, Anomalies, Registration).
 */
export const AdminApprovalPage = () => {
  const {
    orders,
    handleAdminOrderDecision,
    incidents,
    handleApproveUnlockRequest,
    handleRejectUnlockRequest,
    setActiveTab,
  } = useApp();

  const unlockRequests = (incidents || []).filter((i) => i.type === 'UNLOCK_REQUEST');

  const handleDecision = (payload) => {
    handleAdminOrderDecision(payload);
    if (payload.approved) {
      alert('Order APPROVED! Stok penjualan telah disetujui.');
    } else {
      alert('Order REJECTED.');
    }
  };

  const handleApproveUnlock = (requestId, stopId) => {
    handleApproveUnlockRequest(requestId, stopId);
    alert('Permintaan Unlock disetujui! Outlet telah dibuka untuk presensi tim sales.');
  };

  const handleRejectUnlock = (requestId) => {
    handleRejectUnlockRequest(requestId);
    alert('Permintaan Unlock ditolak.');
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto pb-24">
      <AdminApprovalHeader />

      {/* Section 0: Pusat Kontrol & Monitoring Alur Laporan Admin (ND6 Oversight Hub) */}
      <div className="bg-surface border border-border-glass rounded-2xl p-4 md:p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-black text-on-surface m-0 uppercase tracking-tight flex items-center gap-2">
              <LuLayers className="text-primary" /> Pusat Monitoring Distribusi & Laporan Seluruh Alur (Admin Hub)
            </h3>
            <p className="text-xs text-on-surface-variant m-0 mt-0.5">
              Akses cepat pengawasan seluruh alur distribusi: presensi real-time, rute PJP, flagging absensi janggal, dan registrasi outlet.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* Card 1: Daily Call Monitor */}
          <div
            onClick={() => setActiveTab(TAB_IDS.DAILY_CALL_MONITOR)}
            className="p-3.5 rounded-xl bg-surface-variant/30 hover:bg-primary/10 border border-border-glass hover:border-primary/40 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-primary mb-1.5">
                <LuPhoneCall className="text-lg" />
                <LuArrowRight className="text-xs group-hover:translate-x-1 transition-transform" />
              </div>
              <h4 className="text-xs font-black text-on-surface m-0">Daily Call Monitor</h4>
              <p className="text-[11px] text-on-surface-variant m-0 mt-1 leading-snug">
                Presensi GPS in/out, durasi kunjungan toko, EC order of the day, dan timeline sales.
              </p>
            </div>
            <span className="text-[10px] font-bold text-primary mt-2 block">Buka Monitor &rarr;</span>
          </div>

          {/* Card 2: Flagging Absensi Janggal */}
          <div
            onClick={() => setActiveTab(TAB_IDS.REPORTS)}
            className="p-3.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/30 hover:border-rose-500/50 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-rose-600 mb-1.5">
                <LuShieldAlert className="text-lg" />
                <LuArrowRight className="text-xs group-hover:translate-x-1 transition-transform" />
              </div>
              <h4 className="text-xs font-black text-rose-800 m-0">Flagging Absensi Janggal</h4>
              <p className="text-[11px] text-rose-900/80 m-0 mt-1 leading-snug">
                Tabel audit anomali: durasi &lt;5m, radius GPS &gt;50m, dan jeda perjalanan (2km vs 2jam).
              </p>
            </div>
            <span className="text-[10px] font-bold text-rose-700 mt-2 block">Audit Temuan &rarr;</span>
          </div>

          {/* Card 3: Kelola Rute & PJP */}
          <div
            onClick={() => setActiveTab(TAB_IDS.ROUTE_PLANNING)}
            className="p-3.5 rounded-xl bg-surface-variant/30 hover:bg-primary/10 border border-border-glass hover:border-primary/40 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-primary mb-1.5">
                <LuNavigation className="text-lg" />
                <LuArrowRight className="text-xs group-hover:translate-x-1 transition-transform" />
              </div>
              <h4 className="text-xs font-black text-on-surface m-0">Jadwal Master RJP / PJP</h4>
              <p className="text-[11px] text-on-surface-variant m-0 mt-1 leading-snug">
                Alokasi rute kunjungan harian sales se-wilayah Padalarang & Cimahi.
              </p>
            </div>
            <span className="text-[10px] font-bold text-primary mt-2 block">Kelola RJP &rarr;</span>
          </div>

          {/* Card 4: Laporan Registrasi Outlet */}
          <div
            onClick={() => setActiveTab(TAB_IDS.OUTLET_REGISTRATION_REPORT)}
            className="p-3.5 rounded-xl bg-surface-variant/30 hover:bg-primary/10 border border-border-glass hover:border-primary/40 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-emerald-600 mb-1.5">
                <LuClipboardList className="text-lg" />
                <LuArrowRight className="text-xs group-hover:translate-x-1 transition-transform" />
              </div>
              <h4 className="text-xs font-black text-on-surface m-0">Registrasi Outlet</h4>
              <p className="text-[11px] text-on-surface-variant m-0 mt-1 leading-snug">
                Master customer baru, approval kode customer, dan ekspor data master.
              </p>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 mt-2 block">Laporan Master &rarr;</span>
          </div>
        </div>
      </div>

      {/* Section 1: Permintaan Unlock Outlet dari Sales */}
      {unlockRequests.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                <span>Permintaan Buka Kunci (Unlock) Presensi Outlet</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-800">
                  {unlockRequests.filter((r) => r.status === 'PENDING').length} Menunggu
                </span>
              </h3>
              <p className="text-xs text-on-surface-variant">
                Permohonan pembukaan kunci dari Sales yang belum menyelesaikan absen toko sebelumnya
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {unlockRequests.map((req) => (
              <UnlockRequestCard
                key={req.id}
                request={req}
                onApprove={handleApproveUnlock}
                onReject={handleRejectUnlock}
              />
            ))}
          </div>
        </div>
      )}

      {/* Section 2: Daftar Order Penjualan */}
      <div className="space-y-3">
        <div>
          <h3 className="text-lg font-bold text-on-surface">Daftar Order Penjualan Menunggu Persetujuan Admin</h3>
          <p className="text-xs text-on-surface-variant">
            Persetujuan akan mengonfirmasi stok penjualan dan memproses pesanan Sales
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="p-8 text-center bg-surface-container-low rounded-xl border border-outline/20">
            <p className="text-sm text-on-surface-variant">Belum ada order penjualan yang masuk saat ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.map((order) => (
              <PendingOrderCard
                key={order.id}
                order={order}
                onDecision={handleDecision}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
