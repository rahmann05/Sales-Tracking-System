import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useModal } from '../../hooks/useModal';
import { notifySuccess } from '../../services/notificationService';
import { SupervisorFieldView } from './components/SupervisorFieldView';
import { SupervisorPerformanceAnalytics } from './components/SupervisorPerformanceAnalytics';
import { SupervisorTabBar } from './components/SupervisorTabBar';
import { SupervisorApprovalsTab } from './components/SupervisorApprovalsTab';
import { SupervisorIncidentsTab } from './components/SupervisorIncidentsTab';
import { SpvDailySummaryTab } from './components/SpvDailySummaryTab';
import { IncidentHandleModal } from './components/IncidentHandleModal';

/**
 * SupervisorPage Component (Orchestrator)
 * Single Responsibility: Unified Workspace Container for Supervisor.
 * Seluruh konten tab didelegasikan ke child components (SRP per tab).
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
    handleSupervisorRequestReroute,
    handleApproveUnlockRequest,
    handleRejectUnlockRequest,
  } = useApp();

  const { modalType, payload: selectedIncident, openModal, closeModal } = useModal();
  const [activeTab, setActiveTab] = useState('field_visit');

  const closedShopIncidents = incidents.filter((i) => i.type === 'CLOSED_SHOP');
  const pendingClosedIncidents = closedShopIncidents.filter((i) => i.status === 'PENDING_SPV').length;
  const offPjpRequests = incidents.filter((i) => i.type === 'OFF_PJP_REQUEST');
  const unlockRequests = incidents.filter((i) => i.type === 'UNLOCK_REQUEST');
  const totalPendingApprovals = unlockRequests.length + offPjpAttendances.length + offPjpRequests.length;

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
    handleSupervisorRequestReroute(payload);
    closeModal();
    notifySuccess('Permohonan Reroute berhasil dikirimkan ke Manajer Operasional.');
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
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto pb-24">
      <SupervisorTabBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        pendingApprovals={totalPendingApprovals}
        pendingIncidents={pendingClosedIncidents}
      />

      {activeTab === 'field_visit' && <SupervisorFieldView />}

      {activeTab === 'performance' && (
        <SupervisorPerformanceAnalytics
          salesStops={salesStops}
          offPjpAttendances={offPjpAttendances}
          salesList={salesList}
        />
      )}

      {activeTab === 'daily_summary' && (
        <SpvDailySummaryTab
          salesStops={salesStops}
          salesList={salesList}
          incidents={incidents}
          orders={orders}
          offPjpAttendances={offPjpAttendances}
          user={user}
        />
      )}

      {activeTab === 'approvals' && (
        <SupervisorApprovalsTab
          unlockRequests={unlockRequests}
          offPjpAttendances={offPjpAttendances}
          offPjpRequests={offPjpRequests}
          totalPending={totalPendingApprovals}
          userRole={user?.role}
          onApproveUnlock={handleApproveUnlock}
          onRejectUnlock={handleRejectUnlock}
          onValidateOffPjp={handleSupervisorValidateOffPJP}
          onApproveOffPjpRequest={handleSupervisorApproveOffPJP}
        />
      )}

      {activeTab === 'incidents' && (
        <SupervisorIncidentsTab
          closedShopIncidents={closedShopIncidents}
          onHandleIncident={(inc) => openModal('INCIDENT_HANDLE', inc)}
        />
      )}

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
