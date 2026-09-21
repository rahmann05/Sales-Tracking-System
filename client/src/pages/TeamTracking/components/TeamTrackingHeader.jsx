import React from 'react';
import { LuPlus, LuUsers, LuShieldCheck } from 'react-icons/lu';
import { PageHeader } from '../../../shared/components/common/PageHeader';

/**
 * TeamTrackingHeader Component
 * Single Responsibility: Standardized header banner for TeamTracking page.
 */
export const TeamTrackingHeader = ({ user, onCreateRjpTeam, onCreateUser }) => {
  const isSupervisor = user?.role === 'SUPERVISOR';
  const isAdmin = user?.role === 'ADMIN';

  if (isSupervisor) {
    return (
      <PageHeader
        badge={
          <span className="px-3 py-1 bg-surface-container text-on-surface border border-border-glass text-xs font-black rounded-full uppercase tracking-wider flex items-center gap-1.5">
            <LuShieldCheck className="text-sm" /> TIM SUPERVISOR • {user?.name || 'FIELD'}
          </span>
        }
        title="Monitoring Tim & Sales Bawahan"
        subtitle="Pantau profil personil lapangan, wilayah kluster aktif, pergerakan live GPS real-time, dan status penugasan rute harian."
      />
    );
  }

  return (
    <PageHeader
      badge={
        <span className="px-3 py-1 bg-surface-container text-on-surface border border-border-glass text-xs font-black rounded-full uppercase tracking-wider flex items-center gap-1.5">
          <LuUsers className="text-sm" /> MANAJEMEN TIM DISTRIBUSI
        </span>
      }
      title="Manajemen Tim Supervisor & Personel Area"
      subtitle="Kelola struktur hierarki tim supervisor, direktori personel sales, dan penerbitan penugasan Tim RJP khusus area distribusi."
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          {onCreateUser && (
            <button
              type="button"
              onClick={onCreateUser}
              className="px-4 py-2.5 bg-surface border border-border-glass hover:bg-surface-variant/40 text-on-surface font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <span>+ Tambah Personel</span>
            </button>
          )}
          {onCreateRjpTeam && (
            <button
              type="button"
              onClick={onCreateRjpTeam}
              className="px-4 py-2.5 bg-primary text-on-primary font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm hover:opacity-90 transition-all cursor-pointer"
            >
              <LuPlus className="text-base" />
              <span>+ Terbitkan Tim RJP Baru</span>
            </button>
          )}
        </div>
      }
    />
  );
};
