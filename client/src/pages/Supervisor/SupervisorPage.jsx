import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useModal } from '../../hooks/useModal';
import { notifySuccess } from '../../services/notificationService';
import { SectionHeader } from '../../components/common/SectionHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { SupervisorFieldView } from './components/SupervisorFieldView';
import { SupervisorPerformanceAnalytics } from './components/SupervisorPerformanceAnalytics';
import { OffPjpAttendanceCard } from './components/OffPjpAttendanceCard';
import { OffPjpRequestCard } from './components/OffPjpRequestCard';
import { IncidentCard } from './components/IncidentCard';
import { IncidentHandleModal } from './components/IncidentHandleModal';
import { UnlockRequestCard } from '../Admin/components/UnlockRequestCard';
import {
  LuTrendingUp,
  LuCircleCheck,
  LuCompass,
  LuClock,
  LuKey,
  LuFileText,
  LuShieldCheck,
  LuStore,
} from 'react-icons/lu';
import { FiAlertCircle } from 'react-icons/fi';

/**
 * SupervisorPage Component
 * Single Responsibility: Unified Workspace Container for Supervisor
 * Main / Default View: Supervisor Field Visit & Daily Attendance (Kunjungan & Absensi Lapangan SPV).
 * Secondary Tabs: Team Performance Analytics, Field Approvals & Validations, Closed Shop Incident Actions.
 */
export const SupervisorPage = () => {
  const {
    user,
    salesStops = [],
    salesList = [],
    incidents = [],
    offPjpAttendances = [],
    handleSupervisorValidateOffPJP,
    handleSupervisorSkipOutlet,
    handleSupervisorDirectReroute,
    handleSupervisorApproveOffPJP,
    handleSupervisorRequestReroute,
    handleApproveUnlockRequest,
    handleRejectUnlockRequest,
  } = useApp();

  const { modalType, payload: selectedIncident, openModal, closeModal } = useModal();

  // Active Tab state: 'field_visit' (DEFAULT/MAIN) | 'performance' | 'approvals' | 'incidents'
  const [activeTab, setActiveTab] = useState('field_visit');

  // Sub-filter for Approvals tab: 'ALL' | 'UNLOCK' | 'OFF_PJP_ATTENDANCE' | 'OFF_PJP_REQUEST'
  const [approvalSubFilter, setApprovalSubFilter] = useState('ALL');

  const closedShopIncidents = incidents.filter((i) => i.type === 'CLOSED_SHOP');
  const pendingClosedIncidents = closedShopIncidents.filter((i) => i.status === 'PENDING_SPV').length;

  const offPjpRequests = incidents.filter((i) => i.type === 'OFF_PJP_REQUEST');
  const unlockRequests = incidents.filter((i) => i.type === 'UNLOCK_REQUEST');
  const pendingOffPjpAttendances = offPjpAttendances.filter((i) => i.validationStatus === 'MENUNGGU');

  const totalPendingApprovals =
    unlockRequests.length + pendingOffPjpAttendances.length + offPjpRequests.length;

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
      {/* Main Tab Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-border-glass pb-3 overflow-x-auto no-scrollbar">
        {/* Tab 1: Kunjungan & Absensi Lapangan (HALAMAN UTAMA SPV) */}
        <button
          type="button"
          onClick={() => setActiveTab('field_visit')}
          className={`px-4 py-2.5 rounded-2xl text-xs md:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'field_visit'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'bg-surface border border-border-glass text-on-surface-variant hover:bg-surface-variant/40 hover:text-on-surface'
          }`}
        >
          <LuCompass className="text-base" />
          <span>Kunjungan & Absensi Lapangan (Utama)</span>
        </button>

        {/* Tab 2: Progres Kunjungan Tim Sales */}
        <button
          type="button"
          onClick={() => setActiveTab('performance')}
          className={`px-4 py-2.5 rounded-2xl text-xs md:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'performance'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'bg-surface border border-border-glass text-on-surface-variant hover:bg-surface-variant/40 hover:text-on-surface'
          }`}
        >
          <LuTrendingUp className="text-base" />
          <span>Monitoring Tim Sales</span>
        </button>

        {/* Tab 3: Antrean Approval & Validasi */}
        <button
          type="button"
          onClick={() => setActiveTab('approvals')}
          className={`px-4 py-2.5 rounded-2xl text-xs md:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'approvals'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'bg-surface border border-border-glass text-on-surface-variant hover:bg-surface-variant/40 hover:text-on-surface'
          }`}
        >
          <LuCircleCheck className="text-base" />
          <span>Antrean Approval</span>
          {totalPendingApprovals > 0 && (
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                activeTab === 'approvals'
                  ? 'bg-white text-primary'
                  : 'bg-blue-500 text-white'
              }`}
            >
              {totalPendingApprovals}
            </span>
          )}
        </button>

        {/* Tab 4: Laporan Toko Tutup */}
        <button
          type="button"
          onClick={() => setActiveTab('incidents')}
          className={`px-4 py-2.5 rounded-2xl text-xs md:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'incidents'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'bg-surface border border-border-glass text-on-surface-variant hover:bg-surface-variant/40 hover:text-on-surface'
          }`}
        >
          <FiAlertCircle className="text-base" />
          <span>Laporan Toko Tutup</span>
          {pendingClosedIncidents > 0 && (
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                activeTab === 'incidents'
                  ? 'bg-white text-rose-600'
                  : 'bg-rose-500 text-white'
              }`}
            >
              {pendingClosedIncidents}
            </span>
          )}
        </button>
      </div>

      {/* Tab Content Area */}

      {/* TAB 1: KUNJUNGAN & ABSENSI LAPANGAN SUPERVISOR (HALAMAN UTAMA) */}
      {activeTab === 'field_visit' && (
        <SupervisorFieldView />
      )}

      {/* TAB 2: PROGRES & MONITORING KUNJUNGAN TIM SALES */}
      {activeTab === 'performance' && (
        <SupervisorPerformanceAnalytics
          salesStops={salesStops}
          offPjpAttendances={offPjpAttendances}
          salesList={salesList}
        />
      )}

      {/* TAB 3: ANTREAN APPROVAL & VALIDASI */}
      {activeTab === 'approvals' && (
        <div className="space-y-6">
          {/* Sub-filter chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setApprovalSubFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                approvalSubFilter === 'ALL'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface border border-border-glass text-on-surface-variant hover:bg-surface-variant/40'
              }`}
            >
              Semua Antrean ({totalPendingApprovals})
            </button>
            <button
              onClick={() => setApprovalSubFilter('UNLOCK')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                approvalSubFilter === 'UNLOCK'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface border border-border-glass text-on-surface-variant hover:bg-surface-variant/40'
              }`}
            >
              <LuKey className="text-xs" />
              Buka Kunci Presensi ({unlockRequests.length})
            </button>
            <button
              onClick={() => setApprovalSubFilter('OFF_PJP_ATTENDANCE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                approvalSubFilter === 'OFF_PJP_ATTENDANCE'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface border border-border-glass text-on-surface-variant hover:bg-surface-variant/40'
              }`}
            >
              <LuClock className="text-xs" />
              Absen Luar RJP ({offPjpAttendances.length})
            </button>
            <button
              onClick={() => setApprovalSubFilter('OFF_PJP_REQUEST')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                approvalSubFilter === 'OFF_PJP_REQUEST'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface border border-border-glass text-on-surface-variant hover:bg-surface-variant/40'
              }`}
            >
              <LuFileText className="text-xs" />
              Pengajuan Toko Baru ({offPjpRequests.length})
            </button>
          </div>

          {/* Section: Unlock Requests */}
          {(approvalSubFilter === 'ALL' || approvalSubFilter === 'UNLOCK') && unlockRequests.length > 0 && (
            <div className="space-y-3">
              <SectionHeader
                title="Permintaan Buka Kunci (Unlock) Presensi Outlet"
                subtitle="Permohonan pembukaan presensi dari tim Sales / Driver / Helper yang terkunci karena belum menyelesaikan toko sebelumnya"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 w-full">
                {unlockRequests.map((req) => (
                  <UnlockRequestCard
                    key={req.id}
                    request={req}
                    onApprove={(id, stopId) => handleApproveUnlock(id, stopId, user?.role)}
                    onReject={(id) => handleRejectUnlock(id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Section: Off-PJP Attendance Validations */}
          {(approvalSubFilter === 'ALL' || approvalSubFilter === 'OFF_PJP_ATTENDANCE') && (
            <div className="space-y-3">
              <SectionHeader
                title="Validasi Presensi Toko Luar RJP"
                subtitle="Tinjau dan beri validasi presensi sales di luar rute terjadwal (disertai foto GPS dan alasan)"
              />
              {offPjpAttendances.length === 0 ? (
                <EmptyState
                  icon={LuCircleCheck}
                  title="Tidak Ada Presensi Luar RJP"
                  description="Semua presensi tim sales berada dalam koridor jadwal RJP resmi."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 w-full">
                  {offPjpAttendances.map((item) => (
                    <OffPjpAttendanceCard
                      key={item.id}
                      item={item}
                      onValidate={handleSupervisorValidateOffPJP}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Section: Off-PJP Store Requests */}
          {(approvalSubFilter === 'ALL' || approvalSubFilter === 'OFF_PJP_REQUEST') && offPjpRequests.length > 0 && (
            <div className="space-y-3">
              <SectionHeader
                title="Pengajuan Toko Baru di Luar RJP"
                subtitle="Permohonan pendaftaran outlet baru dari tim lapangan untuk dievaluasi kelayakannya"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 w-full">
                {offPjpRequests.map((req) => (
                  <OffPjpRequestCard
                    key={req.id}
                    request={req}
                    onApprove={handleSupervisorApproveOffPJP}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: LAPORAN TOKO TUTUP */}
      {activeTab === 'incidents' && (
        <div className="space-y-4">
          <SectionHeader
            title="Laporan Toko Tutup / Kendala Kunjungan"
            subtitle="Tindakan cepat SPV: Lewati Toko (Skip), Reroute Langsung ke toko pengganti, atau Eskalasi ke Manajer Operasional."
          />

          {closedShopIncidents.length === 0 ? (
            <EmptyState
              icon={LuCircleCheck}
              title="Tidak Ada Laporan Toko Tutup"
              description="Seluruh rute kunjungan berjalan normal tanpa kendala outlet tutup."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {closedShopIncidents.map((incident) => (
                <IncidentCard
                  key={incident.id}
                  incident={incident}
                  onHandle={(inc) => openModal('INCIDENT_HANDLE', inc)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Incident Handle (Toko Tutup) */}
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
