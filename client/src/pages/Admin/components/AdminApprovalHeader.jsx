import React from 'react';
import { useApp } from '../../../context/AppContext';
import { LuFileCheck, LuClock } from 'react-icons/lu';
import { FiCheckCircle } from 'react-icons/fi';
import { Avatar } from '../../../components/common/Avatar';

/**
 * AdminApprovalHeader Component (Single Responsibility: Header Overview for Admin Sales Approval)
 * 1 File per Component
 */
export const AdminApprovalHeader = () => {
  const { user, orders } = useApp();
  const pendingOrders = orders.filter((o) => o.status === 'PENDING_APPROVAL');

  return (
    <div className="bg-surface border border-border-glass rounded-2xl p-4 md:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <Avatar src={user.avatar} name={user.name} size="lg" className="rounded-2xl ring-2 ring-amber-500/30" />
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-on-surface">{user.name}</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600">
              {user.roleLabel}
            </span>
          </div>
          <p className="text-xs text-on-surface-variant">
            Persetujuan Pesanan & Verifikasi Pesanan Pelanggan
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-surface-variant/40 p-3 rounded-xl border border-border-glass">
        <LuClock className="text-2xl text-amber-600" />
        <div>
          <span className="text-xs text-on-surface-variant font-medium block">Antrean Menunggu Approval Admin:</span>
          <span className="text-sm font-bold text-amber-600">{pendingOrders.length} Pesanan Masuk</span>
        </div>
      </div>
    </div>
  );
};
