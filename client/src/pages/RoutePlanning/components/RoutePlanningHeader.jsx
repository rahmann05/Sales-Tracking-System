import React from 'react';
import { LuMapPin, LuPlus } from 'react-icons/lu';
import { Button } from '../../../components/common/Button';

export const RoutePlanningHeader = ({ user, onCreateRoute }) => {
  const isSales = user?.role === 'SALES';
  const isSupervisor = user?.role === 'SUPERVISOR';

  if (isSales) {
    return (
      <div className="app-card border-l-4 border-l-tertiary space-y-2">
        <div className="flex-between">
          <div>
            <span className="badge-tertiary mb-1">JADWAL SALES FIELD</span>
            <h2 className="page-title">Jadwal & Rute Kunjungan Master RJP Saya</h2>
            <p className="card-subtitle">
              Pantau rute outlet harian per hari (Senin - Sabtu) dan daftar tim RJP tempat Anda ditugaskan.
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <span className="caption-mono font-bold text-tertiary">Sales: {user.name}</span>
            <span className="text-xs text-on-surface-variant block">Klaster: Cimahi & KBB</span>
          </div>
        </div>
      </div>
    );
  }

  if (isSupervisor) {
    return (
      <div className="app-card border-l-4 border-l-secondary space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="badge-secondary mb-1">SUPERVISI MASTER RJP</span>
            <h2 className="page-title">Supervisi & Penugasan Master RJP Tim</h2>
            <p className="card-subtitle">
              Atur jadwal rute kunjungan harian per anggota sales bawahan dan terbitkan Tim RJP Khusus.
            </p>
          </div>
          <button
            onClick={onCreateRoute}
            className="btn-primary self-start sm:self-auto"
          >
            <LuPlus className="text-base" />
            <span>Tambah Master RJP Tim</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-header">
      <div>
        <h2 className="page-title">Optimasi & Perencanaan Rute Sales</h2>
        <p className="page-subtitle">
          Kelola urutan kunjungan sales representative secara efisien dan hemat bahan bakar.
        </p>
      </div>
      <Button variant="primary" icon={LuMapPin} onClick={onCreateRoute}>
        Buat Rute Baru
      </Button>
    </div>
  );
};
