import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { PendingOrderCard } from './components/PendingOrderCard';
import { UnlockRequestCard } from './components/UnlockRequestCard';
import { TAB_IDS } from '../../constants/navigation';
import { PageHeader } from '../../shared/components/common/PageHeader';
import {
  LuArrowLeft,
  LuFileCheck,
  LuClock,
  LuLayers,
  LuFilter,
  LuShieldAlert,
} from 'react-icons/lu';

/**
 * AdminApprovalPage Component (Container Page for Admin Order & Unlock Approvals)
 * Single Responsibility: Admin workspace for order approval and unlock requests.
 */
export const AdminApprovalPage = ({ onGoBack }) => {
  const {
    orders = [],
    handleAdminOrderDecision,
    incidents = [],
    handleApproveUnlockRequest,
    handleRejectUnlockRequest,
    setActiveTab,
  } = useApp();

  const [orderFilter, setOrderFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'

  const unlockRequests = (incidents || []).filter((i) => i.type === 'UNLOCK_REQUEST');
  const pendingUnlockCount = unlockRequests.filter((r) => r.status === 'PENDING').length;

  const pendingOrders = useMemo(
    () => orders.filter((o) => o.status === 'PENDING_APPROVAL' || o.status === 'PENDING'),
    [orders]
  );
  const approvedOrders = useMemo(
    () => orders.filter((o) => o.status === 'APPROVED'),
    [orders]
  );

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

  const handleBackToHub = () => {
    if (onGoBack) {
      onGoBack();
    } else {
      setActiveTab(TAB_IDS.ROLE_WORKSPACE);
    }
  };

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    if (orderFilter === 'PENDING') {
      return o.status === 'PENDING_APPROVAL' || o.status === 'PENDING';
    }
    if (orderFilter === 'APPROVED') {
      return o.status === 'APPROVED';
    }
    if (orderFilter === 'REJECTED') {
      return o.status === 'REJECTED';
    }
    return true;
  });

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-24">
      {/* ── Standard PageHeader (Unified with Design System) ── */}
      <PageHeader
        badge={
          <span className="px-3 py-1 bg-surface-container text-on-surface border border-border-glass text-xs font-black rounded-full uppercase tracking-wider flex items-center gap-1.5">
            <LuFileCheck className="text-sm" /> MODUL PERSETUJUAN & VALIDASI ORDER
          </span>
        }
        title="Persetujuan Order Penjualan & Buka Kunci Presensi"
        subtitle="Verifikasi PO penjualan sales, periksa kredit limit & stok toko, serta persetujuan pembukaan kunci (unlock) presensi outlet."
        stats={[
          {
            label: 'Order Pending',
            value: `${pendingOrders.length} Order`,
            color: pendingOrders.length > 0 ? 'rose' : 'emerald',
          },
          {
            label: 'Unlock Pending',
            value: `${pendingUnlockCount} Menunggu`,
            color: pendingUnlockCount > 0 ? 'amber' : 'emerald',
          },
          {
            label: 'Order Disetujui',
            value: `${approvedOrders.length} Selesai`,
            color: 'neutral',
          },
          {
            label: 'Total Order',
            value: `${orders.length} Masuk`,
            color: 'neutral',
          },
        ]}
        actions={
          <button
            type="button"
            onClick={handleBackToHub}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary text-white hover:bg-neutral-800 font-bold text-xs shadow-xs transition-all cursor-pointer group shrink-0"
          >
            <LuArrowLeft className="text-sm group-hover:-translate-x-1 transition-transform" />
            <span>Kembali ke Menu Utama</span>
          </button>
        }
      />

      {/* ── Section 1: Permintaan Unlock Outlet dari Sales ── */}
      {unlockRequests.length > 0 && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between border-b border-border-glass pb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center text-sm">
                <LuClock />
              </div>
              <div>
                <h3 className="text-sm font-black text-on-surface uppercase tracking-tight m-0">
                  Permintaan Buka Kunci (Unlock) Presensi Outlet
                </h3>
                <p className="text-[11px] text-on-surface-variant m-0">
                  Permohonan pembukaan kunci dari Sales yang belum menyelesaikan absen toko sebelumnya
                </p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-800 border border-amber-500/20">
              {pendingUnlockCount} Menunggu
            </span>
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

      {/* ── Section 2: Daftar Order Penjualan ── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-glass pb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-surface-container text-primary border border-border-glass flex items-center justify-center text-sm">
              <LuFileCheck />
            </div>
            <div>
              <h3 className="text-sm font-black text-on-surface uppercase tracking-tight m-0">
                Daftar Order Penjualan Sales
              </h3>
              <p className="text-[11px] text-on-surface-variant m-0">
                Konfirmasi stok penjualan, cek plafon kredit, dan proses pesanan ke pengiriman
              </p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-surface-container p-1 rounded-xl border border-border-glass self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setOrderFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                orderFilter === 'ALL'
                  ? 'bg-surface text-on-surface shadow-2xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Semua ({orders.length})
            </button>
            <button
              type="button"
              onClick={() => setOrderFilter('PENDING')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                orderFilter === 'PENDING'
                  ? 'bg-primary text-white shadow-2xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Pending ({pendingOrders.length})
            </button>
            <button
              type="button"
              onClick={() => setOrderFilter('APPROVED')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                orderFilter === 'APPROVED'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Disetujui ({approvedOrders.length})
            </button>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="p-10 text-center bg-surface rounded-2xl border border-border-glass">
            <p className="text-xs text-on-surface-variant m-0">
              {orderFilter === 'PENDING'
                ? 'Tidak ada order pending saat ini. Semua pesanan telah diproses.'
                : 'Belum ada data order penjualan.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders.map((order) => (
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
