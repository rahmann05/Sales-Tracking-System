import React from 'react';
import { useApp } from '../../context/AppContext';
import { OpsManagerHeader } from './components/OpsManagerHeader';
import { RerouteApprovalInbox } from './components/RerouteApprovalInbox';
import { SkipAuditLog } from './components/SkipAuditLog';

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
      alert('Reroute DISAPPROVED/APPROVED! PJP Sales otomatis ter-update secara real-time.');
    } else {
      alert('Permohonan Reroute ditolak.');
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto pb-24">
      <OpsManagerHeader />

      {/* Section 1: Inbox Approval Perubahan Rute */}
      <div className="space-y-3">
        <div>
          <h3 className="text-lg font-bold text-on-surface">Inbox Approval Perubahan Rute (Dari Supervisor)</h3>
          <p className="text-xs text-on-surface-variant">
            Persetujuan Manajer Operasional akan memperbarui rute sales yang bersangkutan secara instan
          </p>
        </div>

        <RerouteApprovalInbox pendingReroutes={pendingReroutes} onDecision={handleDecision} />
      </div>

      {/* Section 2: Log Notifikasi Skip Toko */}
      <div className="space-y-3 pt-4 border-t border-border-glass">
        <div>
          <h3 className="text-lg font-bold text-on-surface">Audit Feed: Notifikasi Skip Toko (Instruksi SPV)</h3>
          <p className="text-xs text-on-surface-variant">
            Supervisor berwenang menyetujui Skip Toko dan Manajer Operasional menerima laporan audit log ini
          </p>
        </div>

        <SkipAuditLog skipIncidents={skipIncidents} />
      </div>
    </div>
  );
};
