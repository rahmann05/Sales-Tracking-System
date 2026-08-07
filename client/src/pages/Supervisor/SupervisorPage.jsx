import React from 'react';
import { useApp } from '../../context/AppContext';
import { useModal } from '../../hooks/useModal';
import { notifySuccess } from '../../services/notificationService';
import { SectionHeader } from '../../components/common/SectionHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { SupervisorHeader } from './components/SupervisorHeader';
import { OffPjpAttendanceCard } from './components/OffPjpAttendanceCard';
import { OffPjpRequestCard } from './components/OffPjpRequestCard';
import { IncidentCard } from './components/IncidentCard';
import { IncidentHandleModal } from './components/IncidentHandleModal';
import { UnlockRequestCard } from '../Admin/components/UnlockRequestCard';

/**
 * SupervisorPage Component
 * Single Responsibility: Container page for Supervisor validations,
 * incident actions, and unlock request reviews.
 */
export const SupervisorPage = () => {
  const {
    incidents,
    offPjpAttendances,
    handleSupervisorValidateOffPJP,
    handleSupervisorSkipOutlet,
    handleSupervisorDirectReroute,
    handleSupervisorApproveOffPJP,
    handleSupervisorRequestReroute,
    handleApproveUnlockRequest,
    handleRejectUnlockRequest,
  } = useApp();

  const { modalType, payload: selectedIncident, openModal, closeModal } = useModal();

  const closedShopIncidents = incidents.filter((i) => i.type === 'CLOSED_SHOP');
  const offPjpRequests = incidents.filter((i) => i.type === 'OFF_PJP_REQUEST');
  const unlockRequests = incidents.filter((i) => i.type === 'UNLOCK_REQUEST');

  const handleSkipConfirm = (incidentId) => {
    handleSupervisorSkipOutlet(incidentId);
    closeModal();
    notifySuccess('Outlet berhasil di-SKIP!');
  };

  const handleDirectRerouteConfirm = (payload) => {
    handleSupervisorDirectReroute(payload);
    closeModal();
    notifySuccess('Reroute langsung berhasil! Toko baru telah ditambahkan ke PJP Sales.');
  };

  const handleRerouteConfirm = (payload) => {
    handleSupervisorRequestReroute(payload);
    closeModal();
    notifySuccess('Permohonan Reroute berhasil dikirimkan ke Manajer Operasional untuk approval.');
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
    <div className="page-container">
      <SupervisorHeader />

      {/* Section 0: Permintaan Unlock Outlet / Drop Point */}
      {unlockRequests.length > 0 && (
        <div className="section-block">
          <SectionHeader
            title="Permintaan Buka Kunci (Unlock) Presensi Outlet"
            subtitle="Permohonan pembukaan kunci kunjungan dari tim Sales / Driver / Helper yang belum menyelesaikan absen toko sebelumnya"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 w-full">
            {unlockRequests.map((req) => (
              <UnlockRequestCard
                key={req.id}
                request={req}
                onApprove={handleApproveUnlock}
                onReject={handleRejectUnlock}
              />
            ))}
          </div>
        </div>
      )}

      {/* Section 1: Absen Toko di Luar RJP Validation */}
      <div className="section-divider">
        <SectionHeader
          title="Absen Toko di Luar RJP (Validasi Supervisor)"
          subtitle="Sales dapat melakukan absen kunjungan luar PJP. Absen terdata dengan status TIDAK TERVALIDASI hingga Anda memvalidasi atau menolaknya."
        />

        {offPjpAttendances.length === 0 ? (
          <EmptyState message="Tidak ada catatan absen toko luar RJP yang tertunda." />
        ) : (
          <div className="flex flex-col gap-3.5 w-full">
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

      {/* Section 2: Off-PJP Store Requests from Sales */}
      <div className="section-divider">
        <SectionHeader
          title="Pengajuan Kunjungan Toko di Luar RJP (Dari Sales)"
          subtitle="Persetujuan Supervisor akan langsung menambahkan toko pengganti ini ke rute kunjungan harian Sales"
        />

        {offPjpRequests.length === 0 ? (
          <EmptyState message="Tidak ada pengajuan kunjungan toko luar RJP yang tertunda." />
        ) : (
          <div className="flex flex-col gap-3.5 w-full">
            {offPjpRequests.map((req) => (
              <OffPjpRequestCard
                key={req.id}
                req={req}
                onApprove={handleSupervisorApproveOffPJP}
              />
            ))}
          </div>
        )}
      </div>

      {/* Section 3: Toko Tutup Incidents */}
      <div className="section-divider">
        <SectionHeader
          title="Insiden & Pelaporan Toko Tutup (Laporan Tim Sales)"
          subtitle="Tindakan SPV: Lewati (Skip), Merubah Rute Sales Langsung, atau Minta Persetujuan Manajer"
        />

        {closedShopIncidents.length === 0 ? (
          <EmptyState
            message="Belum ada laporan toko tutup yang membutuhkan penanganan SPV."
            className="p-6 text-center"
          />
        ) : (
          <div className="flex flex-col gap-3.5 w-full">
            {closedShopIncidents.map((incident) => (
              <IncidentCard
                key={incident.id}
                incident={incident}
                onHandleIncident={(inc) => openModal('HANDLE_INCIDENT', inc)}
              />
            ))}
          </div>
        )}
      </div>

      {modalType === 'HANDLE_INCIDENT' && selectedIncident && (
        <IncidentHandleModal
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
