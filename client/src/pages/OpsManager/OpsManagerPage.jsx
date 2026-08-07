import React from 'react';
import { useApp } from '../../context/AppContext';
import { OpsManagerHeader } from './components/OpsManagerHeader';
import { RerouteApprovalInbox } from './components/RerouteApprovalInbox';
import { SkipAuditLog } from './components/SkipAuditLog';
import { TeamRouteChangesReport } from './components/TeamRouteChangesReport';

/**
 * OpsManagerPage Component (Container Page for Operational Manager Role)
 * 1 File per Component
 */
export const OpsManagerPage = () => {
  const { incidents, handleOpsManagerRerouteDecision } = useApp();

  const pendingReroutes = incidents.filter((i) => i.status === 'RESOLVED_REROUTE_PENDING_OPS');
  const skipIncidents = incidents.filter((i) => i.status === 'RESOLVED_SKIP');

  const handleDecision = (payload) => {
    handleOpsManagerRerouteDecision(payload);
    if (payload.approved) {
      alert('Reroute APPROVED! PJP Sales otomatis ter-update secara real-time.');
    } else {
      alert('Permohonan Reroute ditolak.');
    }
  };

  return (
    <div className="page-container">
      <OpsManagerHeader />

      {/* Section 1: Inbox Approval Perubahan Rute */}
      <div className="section-block">
        <div>
          <h3 className="section-title">Inbox Approval Perubahan Rute (Dari Supervisor)</h3>
          <p className="card-subtitle">
            Persetujuan Manajer Operasional akan memperbarui rute sales yang bersangkutan secara instan
          </p>
        </div>

        <RerouteApprovalInbox pendingReroutes={pendingReroutes} onDecision={handleDecision} />
      </div>

      {/* Section 2: Laporan Perubahan Rute & Insiden Lapangan per Tim Supervisor */}
      <div className="section-divider">
        <div>
          <h3 className="section-title">Laporan Perubahan Rute & Toko Tutup per Tim Supervisor</h3>
          <p className="card-subtitle">
            Rekapitulasi lengkap insiden toko tutup, reroute langsung SPV, pengajuan toko luar RJP, dan skip toko dikelompokkan per tim Supervisor
          </p>
        </div>

        <TeamRouteChangesReport incidents={incidents} />
      </div>

      {/* Section 3: Log Notifikasi Skip Toko */}
      <div className="section-divider">
        <div>
          <h3 className="section-title">Audit Feed: Notifikasi Skip Toko (Instruksi SPV)</h3>
          <p className="card-subtitle">
            Supervisor berwenang menyetujui Skip Toko dan Manajer Operasional menerima laporan audit log ini
          </p>
        </div>

        <SkipAuditLog skipIncidents={skipIncidents} />
      </div>
    </div>
  );
};
