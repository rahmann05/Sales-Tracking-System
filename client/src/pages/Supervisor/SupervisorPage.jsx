import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SupervisorHeader } from './components/SupervisorHeader';
import { OffPjpAttendanceCard } from './components/OffPjpAttendanceCard';
import { OffPjpRequestCard } from './components/OffPjpRequestCard';
import { IncidentCard } from './components/IncidentCard';
import { IncidentHandleModal } from './components/IncidentHandleModal';
import { UnlockRequestCard } from '../Admin/components/UnlockRequestCard';

/**
 * SupervisorPage Component
 * Single Responsibility: Container page for Supervisor validations, incident actions, and unlock request reviews.
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

  const [selectedIncident, setSelectedIncident] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const closedShopIncidents = incidents.filter((i) => i.type === 'CLOSED_SHOP');
  const offPjpRequests = incidents.filter((i) => i.type === 'OFF_PJP_REQUEST');
  const unlockRequests = incidents.filter((i) => i.type === 'UNLOCK_REQUEST');

  const handleOpenModal = (incident) => {
    setSelectedIncident(incident);
    setIsModalOpen(true);
  };

  const handleSkipConfirm = (incidentId) => {
    handleSupervisorSkipOutlet(incidentId);
    setIsModalOpen(false);
    alert('Outlet berhasil di-SKIP!');
  };

  const handleDirectRerouteConfirm = (payload) => {
    handleSupervisorDirectReroute(payload);
    setIsModalOpen(false);
    alert('Reroute langsung berhasil! Toko baru telah ditambahkan ke PJP Sales.');
  };

  const handleRerouteConfirm = (payload) => {
    handleSupervisorRequestReroute(payload);
    setIsModalOpen(false);
    alert('Permohonan Reroute berhasil dikirimkan ke Manajer Operasional untuk approval.');
  };

  const handleApproveUnlock = (requestId, stopId, userRole) => {
    handleApproveUnlockRequest(requestId, stopId, userRole);
    alert('Permintaan Unlock disetujui! Outlet telah dibuka untuk presensi tim lapangan.');
  };

  const handleRejectUnlock = (requestId) => {
    handleRejectUnlockRequest(requestId);
    alert('Permintaan Unlock ditolak.');
  };

  return (
    <div className="page-container">
      <SupervisorHeader />

      {/* Section 0: Permintaan Unlock Outlet / Drop Point */}
      {unlockRequests.length > 0 && (
        <div className="section-block">
          <div>
            <h3 className="section-title">Permintaan Buka Kunci (Unlock) Presensi Outlet</h3>
            <p className="card-subtitle">
              Permohonan pembukaan kunci kunjungan dari tim Sales / Driver / Helper yang belum menyelesaikan absen toko sebelumnya
            </p>
          </div>

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
        <div>
          <h3 className="section-title">Absen Toko di Luar RJP (Validasi Supervisor)</h3>
          <p className="card-subtitle">
            Sales dapat melakukan absen kunjungan luar PJP. Absen terdata dengan status TIDAK TERVALIDASI hingga Anda memvalidasi atau menolaknya.
          </p>
        </div>

        {offPjpAttendances.length === 0 ? (
          <div className="p-4 bg-surface border border-border-glass rounded-2xl text-on-surface-variant text-xs font-medium">
            Tidak ada catatan absen toko luar RJP yang tertunda.
          </div>
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
        <div>
          <h3 className="section-title">Pengajuan Kunjungan Toko di Luar RJP (Dari Sales)</h3>
          <p className="card-subtitle">
            Persetujuan Supervisor akan langsung menambahkan toko pengganti ini ke rute kunjungan harian Sales
          </p>
        </div>

        {offPjpRequests.length === 0 ? (
          <div className="p-4 bg-surface border border-border-glass rounded-2xl text-on-surface-variant text-xs font-medium">
            Tidak ada pengajuan kunjungan toko luar RJP yang tertunda.
          </div>
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
        <div>
          <h3 className="section-title">Insiden & Pelaporan Toko Tutup (Laporan Tim Sales)</h3>
          <p className="card-subtitle">
            Tindakan SPV: Lewati (Skip), Merubah Rute Sales Langsung, atau Minta Persetujuan Manajer
          </p>
        </div>

        {closedShopIncidents.length === 0 ? (
          <div className="p-6 text-center bg-surface border border-border-glass rounded-2xl text-on-surface-variant text-xs font-medium">
            Belum ada laporan toko tutup yang membutuhkan penanganan SPV.
          </div>
        ) : (
          <div className="flex flex-col gap-3.5 w-full">
            {closedShopIncidents.map((incident) => (
              <IncidentCard
                key={incident.id}
                incident={incident}
                onHandleIncident={handleOpenModal}
              />
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <IncidentHandleModal
          incident={selectedIncident}
          onClose={() => setIsModalOpen(false)}
          onSkip={handleSkipConfirm}
          onDirectReroute={handleDirectRerouteConfirm}
          onRequestReroute={handleRerouteConfirm}
        />
      )}
    </div>
  );
};
