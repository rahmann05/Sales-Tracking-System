import React from 'react';
import { LuPlus } from 'react-icons/lu';

export const TeamTrackingHeader = ({ user, onCreateRjpTeam }) => {
  const isSales = user?.role === 'SALES';
  const isSupervisor = user?.role === 'SUPERVISOR';

  if (isSales) {
    return (
      <div className="app-card border-l-4 border-l-tertiary space-y-3">
        <div className="flex-between">
          <div>
            <span className="badge-tertiary mb-1">TIM SUPERVISOR SAYA</span>
            <h2 className="page-title">Ringkasan Tim Supervisor Sales</h2>
            <p className="card-subtitle mt-0.5">
              Pengawasan tim sales terdaftar di bawah Supervisor Ahmad Subagja.
            </p>
          </div>
          <span className="badge-primary">Cluster Cimahi & KBB</span>
        </div>
      </div>
    );
  }

  if (isSupervisor) {
    return (
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-glass pb-4">
        <div>
          <span className="badge-secondary mb-1">PANEL SUPERVISOR FIELD</span>
          <h2 className="page-title">Kelola Sales & Tim RJP (SPV {user?.name})</h2>
          <p className="card-subtitle mt-0.5">
            Pantau status presensi sales bawahan dan buat penugasan Tim RJP Kunjungan.
          </p>
        </div>

        <button
          onClick={onCreateRjpTeam}
          className="btn-primary self-start md:self-auto"
        >
          <LuPlus className="text-base" />
          <span>Buat Tim RJP Khusus Tim Saya</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-glass pb-4">
      <div>
        <span className="badge-primary mb-1">KONSOL OP MANAGER</span>
        <h2 className="page-title">Manajemen Seluruh Tim Supervisor & Sales Area</h2>
        <p className="card-subtitle mt-0.5">
          Kelola hirarki Tim Supervisor, direktori seluruh Sales, dan persetujuan Tim RJP Khusus area.
        </p>
      </div>

      <button
        onClick={onCreateRjpTeam}
        className="btn-primary self-start md:self-auto"
      >
        <LuPlus className="text-base" />
        <span>Terbitkan Tim RJP Khusus Area</span>
      </button>
    </div>
  );
};
