import React from 'react';
import { useApp } from '../../../context/AppContext';
import { LuUsers } from 'react-icons/lu';
import { FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { Avatar } from '../../../components/common/Avatar';

/**
 * SupervisorHeader Component (Single Responsibility: Display SPV Overview Metrics)
 * 1 File per Component
 */
export const SupervisorHeader = () => {
  const { user, incidents, salesStops } = useApp();
  const pendingIncidents = incidents.filter((i) => i.status === 'PENDING_SPV').length;

  return (
    <div className="app-card flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <Avatar src={user.avatar} name={user.name} size="lg" className="rounded-2xl ring-2 ring-tertiary/30" />
        <div>
          <div className="flex items-center gap-2">
            <h2 className="page-title">{user.name}</h2>
            <span className="badge-tertiary">
              {user.roleLabel}
            </span>
          </div>
          <p className="text-xs text-on-surface-variant">
            Supervisi {user.teamCount || 8} Tim Sales & Logistik • Klaster Cimahi & Bandung Barat
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="bg-surface-variant/40 p-3 rounded-xl border border-border-glass flex items-center gap-3">
          <LuUsers className="text-2xl text-tertiary" />
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
