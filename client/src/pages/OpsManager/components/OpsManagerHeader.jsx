import React from 'react';
import { useApp } from '../../../context/AppContext';
import { LuBriefcase, LuBellRing } from 'react-icons/lu';
import { FiCheckSquare } from 'react-icons/fi';

/**
 * OpsManagerHeader Component (Single Responsibility: Executive Header for Operational Manager)
 * 1 File per Component
 */
export const OpsManagerHeader = () => {
  const { user, incidents } = useApp();
  const pendingApprovals = incidents.filter((i) => i.status === 'RESOLVED_REROUTE_PENDING_OPS').length;
  const skipNotifs = incidents.filter((i) => i.status === 'RESOLVED_SKIP').length;

  return (
    <div className="bg-surface border border-border-glass rounded-2xl p-4 md:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <img src={user.avatar} alt={user.name} className="w-14 h-14 rounded-2xl object-cover ring-2 ring-rose-500/30" />
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-on-surface">{user.name}</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600">
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
          <FiCheckSquare className="text-2xl text-purple-600" />
          <div>
            <span className="text-on-surface-variant block">Approval Reroute SPV:</span>
            <span className="font-bold text-purple-600 text-sm">{pendingApprovals} Perlu Approval</span>
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
