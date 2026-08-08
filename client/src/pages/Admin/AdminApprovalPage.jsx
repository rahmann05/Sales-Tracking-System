import React from 'react';
import { useApp } from '../../context/AppContext';
import { AdminApprovalHeader } from './components/AdminApprovalHeader';
import { PendingOrderCard } from './components/PendingOrderCard';
import { UnlockRequestCard } from './components/UnlockRequestCard';

/**
 * AdminApprovalPage Component (Container Page for Admin Role)
 * Single Responsibility: Admin view for reviewing orders and approving/rejecting outlet unlock requests.
 */
export const AdminApprovalPage = () => {
  const {
    orders,
    handleAdminOrderDecision,
    incidents,
    handleApproveUnlockRequest,
    handleRejectUnlockRequest,
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

  const handleApproveUnlock = (requestId, stopId, userRole) => {
    handleApproveUnlockRequest(requestId, stopId, userRole);
    alert('Permintaan Unlock disetujui! Outlet telah dibuka untuk presensi tim lapangan.');
  };

  const handleRejectUnlock = (requestId) => {
    handleRejectUnlockRequest(requestId);
    alert('Permintaan Unlock ditolak.');
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto pb-24">
      <AdminApprovalHeader />

      {/* Section 1: Permintaan Unlock Outlet dari Sales & Logistik */}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
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

      {/* Section 2: Order Approval */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-on-surface">Daftar Order Penjualan Menunggu Persetujuan Admin</h3>
          <p className="text-xs text-on-surface-variant">
            Persetujuan akan mengonfirmasi stok penjualan dan memproses pesanan Sales
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="p-8 text-center bg-surface border border-border-glass rounded-2xl text-on-surface-variant text-xs font-medium">
            Tidak ada antrean order yang perlu diproses saat ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
            {orders.map((order) => (
              <PendingOrderCard key={order.id} order={order} onDecision={handleDecision} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
