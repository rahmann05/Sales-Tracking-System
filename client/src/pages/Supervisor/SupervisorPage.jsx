import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SupervisorHeader } from './components/SupervisorHeader';
import { IncidentCard } from './components/IncidentCard';
import { IncidentHandleModal } from './components/IncidentHandleModal';

/**
 * SupervisorPage Component (Container Page for Supervisor Role)
 * 1 File per Component
 */
export const SupervisorPage = () => {
  const { incidents, handleSupervisorSkipOutlet, handleSupervisorRequestReroute } = useApp();
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = (incident) => {
    setSelectedIncident(incident);
    setIsModalOpen(true);
  };

  const handleSkipConfirm = (incidentId) => {
    handleSupervisorSkipOutlet(incidentId);
    setIsModalOpen(false);
    alert('Skip Toko disetujui. Notifikasi info telah dikirimkan ke Manajer Operasional.');
  };

  const handleRerouteConfirm = (payload) => {
    handleSupervisorRequestReroute(payload);
    setIsModalOpen(false);
    alert('Permohonan Reroute berhasil dikirimkan ke Manajer Operasional untuk approval.');
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto pb-24">
      <SupervisorHeader />

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-on-surface">Insiden & Pelaporan Toko Tutup (Laporan Tim Sales)</h3>
          <p className="text-xs text-on-surface-variant">
            Pilih tindakan: Lewati (Notifikasi ke Manajer) atau Ganti Rute (Perlu Approval Manajer)
          </p>
        </div>

        {incidents.length === 0 ? (
          <div className="p-8 text-center bg-surface border border-border-glass rounded-2xl text-on-surface-variant text-xs font-medium">
            Belum ada laporan insiden toko tutup hari ini. Tim sales berjalan lancar.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {incidents.map((incident) => (
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
          onRequestReroute={handleRerouteConfirm}
        />
      )}
    </div>
  );
};
