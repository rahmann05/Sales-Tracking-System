import { RoutePlanningPage } from '../RoutePlanning/RoutePlanningPage';
import { AdminApprovalPage } from '../Admin/AdminApprovalPage';
import { ManualSalesReview } from '../../shared/components/common/ManualSalesReview';
import { SupervisorFieldView } from './components/SupervisorFieldView';
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useModal } from '../../shared/hooks/useModal';
import { notifySuccess } from '../../services/notificationService';
import { PageHeader } from '../../shared/components/common/PageHeader';
import { SupervisorTabBar } from './components/SupervisorTabBar';
import { SupervisorActionCenterTab } from './components/SupervisorActionCenterTab';
import { SupervisorDailyRecapTab } from './components/SupervisorDailyRecapTab';
import { IncidentHandleModal } from './components/IncidentHandleModal';
import { LuShieldCheck } from "react-icons/lu";

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
  const pendingOffPjpCount = offPjpAttendances.filter((a) => a.status === 'PENDING' || a.validationStatus === 'MENUNGGU').length;

  const pendingOrders = orders.filter(o=>['PENDING','PENDING_APPROVAL'].includes(o.status)).length;
  const totalPendingActions = pendingOrders + pendingClosedIncidents + pendingUnlockCount + pendingOffPjpCount + offPjpRequests.filter(r=>['PENDING','PENDING_SPV'].includes(r.status)).length;

  const completedStopsCount = salesStops.filter(
    (s) => s.status === 'VISITED' || s.status === 'COMPLETED' || s.checkOutTime
  ).length;

  const handleSkipConfirm = async (incidentId) => {
    if (await handleSupervisorSkipOutlet(incidentId) === false) return false;
    closeModal();
    notifySuccess('Outlet berhasil di-SKIP! Sales dapat melanjutkan ke outlet berikutnya.');
  };

  const handleDirectRerouteConfirm = async (payload) => {
    const result = await handleSupervisorDirectReroute(payload);
    if (result === false) return false;
    closeModal();
    notifySuccess(result?.pending ? 'Usulan reroute menunggu persetujuan admin.' : 'Toko pengganti ditambahkan ke PJP sales.');
  };

  const handleApproveUnlock = async (requestId, stopId, userRole) => {
    if (await handleApproveUnlockRequest(requestId, stopId, userRole) === false) return false;
    notifySuccess('Permintaan Unlock disetujui! Pengecualian presensi berlaku untuk pemohon sesuai masa berlaku.');
  };

  const handleRejectUnlock = async (requestId) => {
    if (await handleRejectUnlockRequest(requestId) === false) return false;
    notifySuccess('Permintaan Unlock ditolak.');
  };

  return (
    <div className="workspace-page space-y-6">
      {/* 1. Standardized Universal Page Header */}
      <PageHeader
        badge={
          <span className="px-3 py-1 bg-surface-container text-on-surface border border-border-glass text-xs font-black rounded-full uppercase tracking-wider flex items-center gap-1.5">
            <LuShieldCheck className="text-sm" /> SUPERVISOR
          </span>
        }
        title="Operasional tim sales"
        subtitle="Siapkan tim dan PJP, tangani permintaan, dampingi kunjungan, lalu evaluasi hasil harian."
        stats={[
          { label: 'Salesman', value: `${salesList.length} Personel`, color: 'neutral' },
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

      {activeTab === 'planning' && <RoutePlanningPage/>}
      {activeTab === 'action_center' && <><AdminApprovalPage embedded/><ManualSalesReview /></>}
      {/* 3. Tab Contents */}
      {activeTab === 'field' && <SupervisorFieldView />}
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
        />
      )}
    </div>
  );
};
