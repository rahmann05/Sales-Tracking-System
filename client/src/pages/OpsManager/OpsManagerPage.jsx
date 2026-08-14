import React from 'react';
import { useApp } from '../../context/AppContext';
import { notifySuccess } from '../../services/notificationService';
import { SectionHeader } from '../../components/common/SectionHeader';
import { OpsManagerHeader } from './components/OpsManagerHeader';
import { OpsTrendDashboard } from './components/OpsTrendDashboard';
import { ClusterGeneratePanel } from './components/ClusterGeneratePanel';
import { OpsSalesComplianceAnalytics } from './components/OpsSalesComplianceAnalytics';
import { OpsAttendanceReport } from './components/OpsAttendanceReport';
import { OpsOffPjpOverridePanel } from './components/OpsOffPjpOverridePanel';
import { RerouteApprovalInbox } from './components/RerouteApprovalInbox';
import { SkipAuditLog } from './components/SkipAuditLog';
import { TeamRouteChangesReport } from './components/TeamRouteChangesReport';

/**
 * OpsManagerPage Component (Container Page for Operational Manager Role)
 * Single Responsibility: Orchestrate route compliance audits, trend dashboards,
 * attendance reports, off-PJP overrides, reroute approvals, and team audits.
 */
export const OpsManagerPage = () => {
  const {
    incidents,
    salesStops,
    offPjpAttendances,
    rjpTeams,
    handleOpsManagerRerouteDecision,
    handleOpsOverrideOffPjp,
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

  const handleOverride = (payload) => {
    handleOpsOverrideOffPjp(payload);
    notifySuccess(`Status presensi luar RJP berhasil di-override menjadi ${payload.newStatus}.`);
  };

  return (
    <div className="page-container space-y-8 pb-24">
      <OpsManagerHeader />

      {/* Section 1: Dashboard Tren Multi-Minggu */}
      <OpsTrendDashboard />

      {/* Section 2: Generate Jadwal Kunjungan Mingguan */}
      <div className="section-block">
        <SectionHeader
          title="Jadwal Kunjungan Mingguan"
          subtitle="Generate cluster & rute kunjungan otomatis per sales untuk Senin–Sabtu"
        />
        <ClusterGeneratePanel />
      </div>

      {/* Section 3: Audit Kepatuhan Master RJP vs Deviasi Luar RJP */}
      <OpsSalesComplianceAnalytics
        salesStops={salesStops}
        offPjpAttendances={offPjpAttendances}
        rjpTeams={rjpTeams}
      />

      {/* Section 4: Laporan Presensi & Kehadiran Shift Tim Lapangan */}
      <div className="section-divider">
        <SectionHeader
          title="Laporan Absensi & Disiplin Shift Tim Sales"
          subtitle="Pantau jam clock-in, clock-out, dan tingkat ketepatan waktu armada lapangan"
        />
        <OpsAttendanceReport />
      </div>

      {/* Section 5: Inbox Approval Perubahan Rute */}
      <div className="section-block">
        <SectionHeader
          title="Inbox Approval Perubahan Rute (Dari Supervisor)"
          subtitle="Persetujuan Manajer Operasional akan memperbarui rute sales yang bersangkutan secara instan"
        />
        <RerouteApprovalInbox pendingReroutes={pendingReroutes} onDecision={handleDecision} />
      </div>

      {/* Section 6: Audit & Hak Override Presensi Luar RJP */}
      <div className="section-divider">
        <SectionHeader
          title="Audit Trail & Override Presensi Toko Luar RJP"
          subtitle="Tinjau hasil validasi Supervisor dan lakukan penyesuaian manajerial jika diperlukan"
        />
        <OpsOffPjpOverridePanel
          offPjpAttendances={offPjpAttendances}
          onOverride={handleOverride}
        />
      </div>

      {/* Section 7: Laporan Perubahan Rute & Insiden Lapangan per Tim Supervisor */}
      <div className="section-divider">
        <SectionHeader
          title="Laporan Perubahan Rute & Toko Tutup per Tim Supervisor"
          subtitle="Rekapitulasi lengkap insiden toko tutup, reroute langsung SPV, pengajuan toko luar RJP, dan skip toko dikelompokkan per tim Supervisor"
        />
        <TeamRouteChangesReport incidents={incidents} />
      </div>

      {/* Section 8: Log Notifikasi Skip Toko */}
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
