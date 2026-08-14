import React from 'react';
import { useApp } from '../../context/AppContext';
import { notifySuccess } from '../../services/notificationService';
import { SectionHeader } from '../../components/common/SectionHeader';
import { OpsManagerHeader } from './components/OpsManagerHeader';
import { OpsSalesComplianceAnalytics } from './components/OpsSalesComplianceAnalytics';
import { OutletValidationPanel } from './components/OutletValidationPanel';
import { RerouteApprovalInbox } from './components/RerouteApprovalInbox';
import { SkipAuditLog } from './components/SkipAuditLog';
import { TeamRouteChangesReport } from './components/TeamRouteChangesReport';

/**
 * OpsManagerPage Component (Container Page for Operational Manager Role)
 * Single Responsibility: Orchestrate route compliance audits, reroute approvals,
 * team route change reports, and skip audit logs.
 *
 * NOTE: Cluster creation is done via Kelola Master RJP tab (RoutePlanningPage).
 */
export const OpsManagerPage = () => {
  const {
    incidents,
    salesStops,
    offPjpAttendances,
    rjpTeams,
    handleOpsManagerRerouteDecision,
  } = useApp();

  const pendingReroutes = incidents.filter((i) => i.status === 'RESOLVED_REROUTE_PENDING_OPS');
  const skipIncidents = incidents.filter((i) => i.status === 'RESOLVED_SKIP');

  const handleDecision = (payload) => {
    handleOpsManagerRerouteDecision(payload);
    if (payload.approved) {
      notifySuccess('Reroute APPROVED! PJP Sales otomatis ter-update secara real-time.');
    } else {
      notifySuccess('Permohonan Reroute ditolak.');
    }
  };

  return (
    <div className="page-container relative z-10">
      <OpsManagerHeader />

      {/* Section 0: Audit Kepatuhan Master RJP vs Deviasi Luar RJP */}
      <OpsSalesComplianceAnalytics
        salesStops={salesStops}
        offPjpAttendances={offPjpAttendances}
        rjpTeams={rjpTeams}
      />

      {/* Section 1: Validasi Data Outlet */}
      <div className="section-block">
        <SectionHeader
          title="Validasi Data Outlet (Google Cross-Check)"
          subtitle="Verifikasi keakuratan nama, alamat, dan koordinat outlet terhadap Google Maps & Google Places menggunakan 4-Signal Weighted Scoring"
        />

        <OutletValidationPanel />
      </div>

      {/* Section 2: Inbox Approval Perubahan Rute */}
      <div className="section-block">
        <SectionHeader
          title="Inbox Approval Perubahan Rute (Dari Supervisor)"
          subtitle="Persetujuan Manajer Operasional akan memperbarui rute sales yang bersangkutan secara instan"
        />

        <RerouteApprovalInbox pendingReroutes={pendingReroutes} onDecision={handleDecision} />
      </div>

      {/* Section 2: Laporan Perubahan Rute & Insiden Lapangan per Tim Supervisor */}
      <div className="section-divider">
        <SectionHeader
          title="Laporan Perubahan Rute & Toko Tutup per Tim Supervisor"
          subtitle="Rekapitulasi lengkap insiden toko tutup, reroute langsung SPV, pengajuan toko luar RJP, dan skip toko dikelompokkan per tim Supervisor"
        />

        <TeamRouteChangesReport incidents={incidents} />
      </div>

      {/* Section 3: Log Notifikasi Skip Toko */}
      <div className="section-divider">
        <SectionHeader
          title="Audit Feed: Notifikasi Skip Toko (Instruksi SPV)"
          subtitle="Supervisor berwenang menyetujui Skip Toko dan Manajer Operasional menerima laporan audit log ini"
        />

        <SkipAuditLog skipIncidents={skipIncidents} />
      </div>
    </div>
  );
};
