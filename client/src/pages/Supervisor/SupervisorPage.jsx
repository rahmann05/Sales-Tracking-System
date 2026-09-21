import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useModal } from '../../hooks/useModal';
import { notifySuccess } from '../../services/notificationService';
import { PageHeader } from '../../components/common/PageHeader';
import { SupervisorTabBar } from './components/SupervisorTabBar';
import { SupervisorActionCenterTab } from './components/SupervisorActionCenterTab';
import { SupervisorDailyRecapTab } from './components/SupervisorDailyRecapTab';
import { IncidentHandleModal } from './components/IncidentHandleModal';
import { LuShieldCheck, LuUsers, LuClock, LuRotateCw } from 'react-icons/lu';

/**
 * SupervisorPage Component (Orchestrator)
 * Single Responsibility: Unified Command Center for Supervisor.
 * Mengorganisasikan 2 pilar operasional:
 * 1. Pusat Approval & Kendala (Action Center: Toko Tutup, Buka Kunci, Luar RJP)
 * 2. Rekap Harian & Kinerja Tim (Consolidated Daily Recap & KPI Breakdown)
 */
export const SupervisorPage = () => {
  const {
    user,
    salesStops = [],
    salesList = [],
    incidents = [],
    offPjpAttendances = [],
    orders = [],
    handleSupervisorValidateOffPJP,
    handleSupervisorSkipOutlet,
    handleSupervisorDirectReroute,
    handleSupervisorApproveOffPJP,
    handleApproveUnlockRequest,
    handleRejectUnlockRequest,
  } = useApp();

  const { modalType, payload: selectedIncident, openModal, closeModal } = useModal();
  const [activeTab, setActiveTab] = useState('action_center');

  const closedShopIncidents = incidents.filter((i) => i.type === 'CLOSED_SHOP');
  const pendingClosedIncidents = closedShopIncidents.filter((i) => i.status === 'PENDING_SPV').length;
  const offPjpRequests = incidents.filter((i) => i.type === 'OFF_PJP_REQUEST');
  const unlockRequests = incidents.filter((i) => i.type === 'UNLOCK_REQUEST');
  const pendingUnlockCount = unlockRequests.filter((r) => r.status === 'PENDING' || !r.status).length;
  const pendingOffPjpCount = offPjpAttendances.filter((a) => a.status === 'PENDING' || a.status === 'WAITING_SPV').length;

  const totalPendingActions = pendingClosedIncidents + pendingUnlockCount + pendingOffPjpCount + offPjpRequests.length;

  const completedStopsCount = salesStops.filter(
    (s) => s.status === 'VISITED' || s.status === 'COMPLETED' || s.checkOutTime
  ).length;

  const handleSkipConfirm = (incidentId) => {
    handleSupervisorSkipOutlet(incidentId);
    closeModal();
    notifySuccess('Outlet berhasil di-SKIP! Sales dapat melanjutkan ke outlet berikutnya.');
  };

  const handleDirectRerouteConfirm = (payload) => {
    handleSupervisorDirectReroute(payload);
    closeModal();
    notifySuccess('Reroute langsung berhasil! Toko baru telah ditambahkan ke jadwal Sales.');
  };

  const handleRerouteConfirm = (payload) => {
    handleSupervisorDirectReroute(payload);
    closeModal();
    notifySuccess('Reroute langsung berhasil! Toko baru telah ditambahkan ke jadwal Sales.');
  };

  const handleApproveUnlock = (requestId, stopId, userRole) => {
    handleApproveUnlockRequest(requestId, stopId, userRole);
    notifySuccess('Permintaan Unlock disetujui! Outlet telah dibuka untuk presensi tim lapangan.');
  };

  const handleRejectUnlock = (requestId) => {
    handleRejectUnlockRequest(requestId);
    notifySuccess('Permintaan Unlock ditolak.');
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-24">
      {/* 1. Standardized Universal Page Header */}
      <PageHeader
        badge={
          <span className="px-3 py-1 bg-surface-container text-on-surface border border-border-glass text-xs font-black rounded-full uppercase tracking-wider flex items-center gap-1.5">
            <LuShieldCheck className="text-sm" /> SUPERVISI LAPANGAN • COMMAND CENTER
          </span>
        }
        title="Pusat Kendali & Supervisi Lapangan"
        subtitle="Pantau rute sales secara real-time, tuntaskan persetujuan kendala operasional (skip/reroute & unlock presensi), dan evaluasi capaian target tim harian."
        stats={[
          { label: 'Salesman', value: `${salesList.length || 2} Personel`, color: 'neutral' },
          { label: 'Kendala Butuh Aksi', value: `${totalPendingActions} Antrean`, color: totalPendingActions > 0 ? 'rose' : 'emerald' },
          { label: 'Kunjungan Selesai', value: `${completedStopsCount} Toko`, color: 'neutral' },
        ]}
      />

      {/* 2. 3-Pillar Workspace Tab Bar */}
      <SupervisorTabBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        pendingActions={totalPendingActions}
      />

      {/* 3. Tab Contents */}
      {activeTab === 'action_center' && (
        <SupervisorActionCenterTab
          closedShopIncidents={closedShopIncidents}
          unlockRequests={unlockRequests}
          offPjpAttendances={offPjpAttendances}
          offPjpRequests={offPjpRequests}
          onHandleIncident={(inc) => openModal('INCIDENT_HANDLE', inc)}
          onApproveUnlock={handleApproveUnlock}
          onRejectUnlock={handleRejectUnlock}
          onValidateOffPjp={handleSupervisorValidateOffPJP}
        />
      )}

      {activeTab === 'daily_recap' && (
        <SupervisorDailyRecapTab
          salesStops={salesStops}
          salesList={salesList}
          incidents={incidents}
          offPjpAttendances={offPjpAttendances}
          orders={orders}
          user={user}
        />
      )}

      {/* 4. Modal for Skip / Direct Reroute Decision */}
      {modalType === 'INCIDENT_HANDLE' && selectedIncident && (
        <IncidentHandleModal
          isOpen={true}
          incident={selectedIncident}
          onClose={closeModal}
          onSkip={handleSkipConfirm}
          onDirectReroute={handleDirectRerouteConfirm}
          onRequestReroute={handleRerouteConfirm}
        />
      )}
    </div>
  );
};
