import React from 'react';
import { LuPlus } from 'react-icons/lu';

export const TeamTrackingHeader = ({ user, onCreateRjpTeam }) => {
  const isSupervisor = user?.role === 'SUPERVISOR';

  if (isSupervisor) {
    return (
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-glass pb-4">
        <div>
          <span className="badge-secondary mb-1">PANEL SUPERVISOR FIELD</span>
          <h2 className="page-title">Monitoring Tim & Sales Bawahan (SPV {user?.name})</h2>
          <p className="card-subtitle mt-0.5">
            Pantau profil, area penugasan cluster, dan performa sales di bawah tim Anda.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-glass pb-4">
      <div>
        <span className="badge-primary mb-1">KONSOL OPERATIONAL MANAGER</span>
        <h2 className="page-title">Manajemen Seluruh Tim Supervisor & Personel Area</h2>
        <p className="card-subtitle mt-0.5">
          Kelola struktur hierarki Tim Supervisor, direktori personil Sales, dan penerbitan Tim RJP Khusus.
        </p>
      </div>

      <button
        onClick={onCreateRjpTeam}
        className="btn-primary self-start md:self-auto"
      >
        <LuPlus className="text-base" />
        <span>+ Terbitkan Tim RJP Baru</span>
      </button>
    </div>
  );
};
