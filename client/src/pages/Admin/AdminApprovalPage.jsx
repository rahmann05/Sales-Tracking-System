import React from 'react';
import { useApp } from '../../context/AppContext';
import { AdminApprovalHeader } from './components/AdminApprovalHeader';
import { PendingOrderCard } from './components/PendingOrderCard';

/**
 * AdminApprovalPage Component (Container Page for Admin Role)
 * 1 File per Component
 */
export const AdminApprovalPage = () => {
  const { orders, handleAdminOrderDecision } = useApp();

  const handleDecision = (payload) => {
    handleAdminOrderDecision(payload);
    if (payload.approved) {
      alert('Order APPROVED! Stok dikunci dan Rute Pengiriman H+1 Driver & Helper otomatis dibuat.');
    } else {
      alert('Order REJECTED.');
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto pb-24">
      <AdminApprovalHeader />

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-on-surface">Daftar Order Penjualan Menunggu Persetujuan Admin</h3>
          <p className="text-xs text-on-surface-variant">
            Persetujuan akan mengunci stok gudang & menjadwalkan manifest pengiriman H+1 untuk Driver/Helper
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="p-8 text-center bg-surface border border-border-glass rounded-2xl text-on-surface-variant text-xs font-medium">
            Tidak ada antrean order yang perlu diproses saat ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orders.map((order) => (
              <PendingOrderCard key={order.id} order={order} onDecision={handleDecision} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
