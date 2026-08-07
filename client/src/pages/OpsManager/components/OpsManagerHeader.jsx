import React from 'react';
import { useApp } from '../../../context/AppContext';
import { LuBriefcase, LuBellRing } from 'react-icons/lu';
import { FiCheckSquare } from 'react-icons/fi';
import { Avatar } from '../../../components/common/Avatar';

/**
 * OpsManagerHeader Component (Single Responsibility: Executive Header for Operational Manager)
 * 1 File per Component
 */
export const OpsManagerHeader = () => {
  const { user, incidents } = useApp();
  const pendingApprovals = incidents.filter((i) => i.status === 'RESOLVED_REROUTE_PENDING_OPS').length;
  const skipNotifs = incidents.filter((i) => i.status === 'RESOLVED_SKIP').length;

  return (
    <div className="app-card flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <Avatar src={user.avatar} name={user.name} size="lg" className="rounded-2xl ring-2 ring-primary/30" />
        <div>
          <div className="flex items-center gap-2">
            <h2 className="page-title">{user.name}</h2>
            <span className="badge-primary">
              {user.roleLabel}
            </span>
          </div>
          <p className="text-xs text-on-surface-variant">
            Otoritas Pengelolaan Master PJP & Persetujuan Perubahan Rute Lapangan
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="bg-surface-variant/40 p-3 rounded-xl border border-border-glass flex items-center gap-3">
          <FiCheckSquare className="text-2xl text-tertiary" />
          <div>
            <span className="text-on-surface-variant block">Approval Reroute SPV:</span>
            <span className="font-bold text-tertiary text-sm">{pendingApprovals} Perlu Approval</span>
          </div>
        </div>

        <div className="bg-surface-variant/40 p-3 rounded-xl border border-border-glass flex items-center gap-3">
          <LuBellRing className="text-2xl text-amber-600" />
          <div>
            <span className="text-on-surface-variant block">Notifikasi Skip Toko:</span>
            <span className="font-bold text-amber-600 text-sm">{skipNotifs} Log Masuk</span>
          </div>
        </div>
      </div>
    </div>
  );
};
