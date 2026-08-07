import React from 'react';
import { useApp } from '../../context/AppContext';
import { useModal } from '../../hooks/useModal';
import { notifySuccess } from '../../services/notificationService';
import { DeliveryShiftHeader } from './components/DeliveryShiftHeader';
import { DeliveryStopCard } from './components/DeliveryStopCard';
import { DeliveryCostEstimator } from './components/optimizer/DeliveryCostEstimator';
import { DeliveryModals } from './components/DeliveryModals';
import { useLogisticsDispatch } from '../../hooks/useLogisticsDispatch';

/**
 * DeliveryPage Component (Container Page for Driver & Helper Role)
 * Single Responsibility: Orchestrate drop point manifest, Absen In, POD, Absen Out,
 * and Logistics Cost Optimization.
 */
export const DeliveryPage = () => {
  const {
    deliveryStops,
    handleDeliveryAbsenIn,
    handleSubmitPOD,
    handleDeliveryAbsenOut,
    handleDeliveryRequestUnlock,
  } = useApp();

  const { modalType, payload: selectedStop, openModal, closeModal, isOpen } = useModal();

  const {
    selectedVehicleType,
    setSelectedVehicleType,
    totalEstimatedDistanceKm,
    setTotalEstimatedDistanceKm,
    fillRate,
    fuelCost,
    profitability,
    vehicleSpecs,
  } = useLogisticsDispatch({ deliveryStops });

  const stopActions = {
    onAbsenIn: (s) => openModal('ABSEN_IN', s),
    onOpenPOD: (s) => openModal('POD', s),
    onAbsenOut: (s) => openModal('ABSEN_OUT', s),
    onRequestUnlock: (s) => openModal('UNLOCK_REQUEST', s),
  };

  const deliveredCount = deliveryStops.filter((s) => s.status === 'DELIVERED').length;

  const modalHandlers = {
    handleDeliveryAbsenIn: (stopId, payload) => {
      handleDeliveryAbsenIn(stopId, payload);
      closeModal();
      notifySuccess(`Absen In kedatangan berhasil dicatat untuk ${selectedStop?.outletName}!`);
    },
    handleSubmitPOD: (payload) => {
      handleSubmitPOD(payload);
      closeModal();
      notifySuccess('POD Berhasil disimpan! Silakan lakukan Absen Out untuk menyelesaikan serah terima.');
    },
    handleDeliveryAbsenOut: (stopId, payload) => {
      handleDeliveryAbsenOut(stopId, payload);
      closeModal();
      notifySuccess(`Absen Out serah terima berhasil dicatat untuk ${selectedStop?.outletName}!\n\nDrop point selesai dan titik drop berikutnya kini terbuka.`);
    },
    handleDeliveryRequestUnlock: (payload) => {
      handleDeliveryRequestUnlock(payload);
      notifySuccess(`Permintaan Unlock drop point "${payload.outletName}" telah dikirim ke Admin & Supervisor!`);
    },
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto pb-24">
      <DeliveryShiftHeader />

      <DeliveryCostEstimator
        vehicleType={selectedVehicleType}
        onVehicleChange={setSelectedVehicleType}
        distanceKm={totalEstimatedDistanceKm}
        onDistanceChange={setTotalEstimatedDistanceKm}
        fillRate={fillRate}
        fuelCost={fuelCost}
        profitability={profitability}
        vehicleSpecs={vehicleSpecs}
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-on-surface">Manifest Pengiriman Driver & Helper (H+1 PJP)</h3>
            <p className="text-xs text-on-surface-variant">Daftar drop point toko berdasarkan order APPROVED kemarin</p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-surface border border-border-glass rounded-full text-on-surface-variant">
            {deliveredCount} / {deliveryStops.length} Drop Selesai
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
          {deliveryStops.map((stop) => (
            <DeliveryStopCard
              key={stop.id}
              stop={stop}
              allStops={deliveryStops}
              {...stopActions}
            />
          ))}
        </div>
      </div>

      <DeliveryModals
        modalType={modalType}
        selectedStop={selectedStop}
        isOpen={isOpen}
        onClose={closeModal}
        handlers={modalHandlers}
      />
    </div>
  );
};
