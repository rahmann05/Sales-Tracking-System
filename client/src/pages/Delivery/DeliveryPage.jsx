import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DeliveryShiftHeader } from './components/DeliveryShiftHeader';
import { DeliveryStopCard } from './components/DeliveryStopCard';
import { PodModal } from './components/PodModal';

/**
 * DeliveryPage Component (Container Page for Driver & Helper Role)
 * 1 File per Component
 */
export const DeliveryPage = () => {
  const { deliveryStops, handleSubmitPOD } = useApp();
  const [selectedStop, setSelectedStop] = useState(null);
  const [isPodModalOpen, setIsPodModalOpen] = useState(false);

  const handleOpenPOD = (stop) => {
    setSelectedStop(stop);
    setIsPodModalOpen(true);
  };

  const handleConfirmPOD = (payload) => {
    handleSubmitPOD(payload);
    setIsPodModalOpen(false);
    alert('POD Berhasil disimpan! Pengiriman selesai.');
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto pb-24">
      <DeliveryShiftHeader />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-on-surface">Manifest Pengiriman Driver & Helper (H+1 PJP)</h3>
            <p className="text-xs text-on-surface-variant">Daftar drop point toko berdasarkan order APPROVED kemarin</p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-surface border border-border-glass rounded-full text-on-surface-variant">
            {deliveryStops.filter((s) => s.status === 'DELIVERED').length} / {deliveryStops.length} Drop Selesai
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {deliveryStops.map((stop) => (
            <DeliveryStopCard key={stop.id} stop={stop} onOpenPOD={handleOpenPOD} />
          ))}
        </div>
      </div>

      {isPodModalOpen && (
        <PodModal
          stop={selectedStop}
          onClose={() => setIsPodModalOpen(false)}
          onSubmitPOD={handleConfirmPOD}
        />
      )}
    </div>
  );
};
