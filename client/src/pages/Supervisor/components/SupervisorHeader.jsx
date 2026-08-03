import React from 'react';
import { useApp } from '../../../context/AppContext';
import { LuUsers } from 'react-icons/lu';
import { FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

/**
 * SupervisorHeader Component (Single Responsibility: Display SPV Overview Metrics)
 * 1 File per Component
 */
export const SupervisorHeader = () => {
  const { user, incidents, salesStops } = useApp();
  const pendingIncidents = incidents.filter((i) => i.status === 'PENDING_SPV').length;

  return (
    <div className="bg-surface border border-border-glass rounded-2xl p-4 md:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <img src={user.avatar} alt={user.name} className="w-14 h-14 rounded-2xl object-cover ring-2 ring-purple-500/30" />
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-on-surface">{user.name}</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600">
              {user.roleLabel}
            </span>
          </div>
          <p className="text-xs text-on-surface-variant">
            Supervisi {user.teamCount || 8} Tim Sales & Logistik • Klaster Jakarta Barat
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="bg-surface-variant/40 p-3 rounded-xl border border-border-glass flex items-center gap-3">
          <LuUsers className="text-2xl text-purple-600" />
          <div>
            <span className="text-on-surface-variant block">Kunjungan Sales:</span>
            <span className="font-bold text-on-surface text-sm">
              {salesStops.filter((s) => s.status === 'ORDERED').length} / {salesStops.length} Toko
            </span>
          </div>
        </div>

        <div className="bg-surface-variant/40 p-3 rounded-xl border border-border-glass flex items-center gap-3">
          <FiAlertCircle className="text-2xl text-rose-600" />
          <div>
            <span className="text-on-surface-variant block">Laporan Toko Tutup:</span>
            <span className="font-bold text-rose-600 text-sm">{pendingIncidents} Membutuhkan SPV</span>
          </div>
        </div>
      </div>
    </div>
  );
};
