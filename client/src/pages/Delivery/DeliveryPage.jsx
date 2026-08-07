import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DeliveryShiftHeader } from './components/DeliveryShiftHeader';
import { DeliveryStopCard } from './components/DeliveryStopCard';
import { DeliveryAbsenInModal } from './components/DeliveryAbsenInModal';
import { DeliveryAbsenOutModal } from './components/DeliveryAbsenOutModal';
import { RequestUnlockModal } from '../Sales/components/RequestUnlockModal';
import { PodModal } from './components/PodModal';
import { DeliveryCostEstimator } from './components/optimizer/DeliveryCostEstimator';
import { useLogisticsDispatch } from '../../hooks/useLogisticsDispatch';

/**
 * DeliveryPage Component (Container Page for Driver & Helper Role)
 * Single Responsibility: Orchestrate drop point manifest, Absen In, POD, Absen Out, and Logistics Cost Optimization.
 */
export const DeliveryPage = () => {
  const {
    deliveryStops,
    handleDeliveryAbsenIn,
    handleSubmitPOD,
    handleDeliveryAbsenOut,
    handleDeliveryRequestUnlock,
  } = useApp();

  const [selectedStop, setSelectedStop] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // 'ABSEN_IN', 'POD', 'ABSEN_OUT', 'UNLOCK_REQUEST'

  // Logistics Dispatch Optimization Hook
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

  const handleConfirmAbsenIn = (stopId, payload) => {
    handleDeliveryAbsenIn(stopId, payload);
    setActiveModal(null);
    alert(`Absen In kedatangan berhasil dicatat untuk ${selectedStop?.outletName}!`);
  };

  const handleConfirmPOD = (payload) => {
    handleSubmitPOD(payload);
    setActiveModal(null);
    alert('POD Berhasil disimpan! Silakan lakukan Absen Out untuk menyelesaikan serah terima.');
  };

  const handleConfirmAbsenOut = (stopId, payload) => {
    handleDeliveryAbsenOut(stopId, payload);
    setActiveModal(null);
    alert(`Absen Out serah terima berhasil dicatat untuk ${selectedStop?.outletName}!\n\nDrop point selesai dan titik drop berikutnya kini terbuka.`);
  };

  const handleSubmitUnlock = (payload) => {
    handleDeliveryRequestUnlock(payload);
    alert(`Permintaan Unlock drop point "${payload.outletName}" telah dikirim ke Admin & Supervisor!`);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto pb-24">
      <DeliveryShiftHeader />

      {/* Logistics Fleet Capacity & Fuel Estimator */}
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
            {deliveryStops.filter((s) => s.status === 'DELIVERED').length} / {deliveryStops.length} Drop Selesai
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
          {deliveryStops.map((stop) => (
            <DeliveryStopCard
              key={stop.id}
              stop={stop}
              allStops={deliveryStops}
              onAbsenIn={(s) => {
                setSelectedStop(s);
                setActiveModal('ABSEN_IN');
              }}
              onOpenPOD={(s) => {
                setSelectedStop(s);
                setActiveModal('POD');
              }}
              onAbsenOut={(s) => {
                setSelectedStop(s);
                setActiveModal('ABSEN_OUT');
              }}
              onRequestUnlock={(s) => {
                setSelectedStop(s);
                setActiveModal('UNLOCK_REQUEST');
              }}
            />
          ))}
        </div>
      </div>

      {/* 1. ABSEN IN DROP POINT MODAL */}
      {activeModal === 'ABSEN_IN' && selectedStop && (
        <DeliveryAbsenInModal
          stop={selectedStop}
          onClose={() => setActiveModal(null)}
          onConfirm={handleConfirmAbsenIn}
        />
      )}

      {/* 2. POD SUBMISSION MODAL */}
      {activeModal === 'POD' && selectedStop && (
        <PodModal
          stop={selectedStop}
          onClose={() => setActiveModal(null)}
          onSubmitPOD={handleConfirmPOD}
        />
      )}

      {/* 3. ABSEN OUT DROP POINT MODAL */}
      {activeModal === 'ABSEN_OUT' && selectedStop && (
        <DeliveryAbsenOutModal
          stop={selectedStop}
          onClose={() => setActiveModal(null)}
          onConfirm={handleConfirmAbsenOut}
        />
      )}

      {/* 4. REQUEST UNLOCK DROP POINT MODAL */}
      {activeModal === 'UNLOCK_REQUEST' && selectedStop && (
        <RequestUnlockModal
          isOpen={true}
          outlet={selectedStop}
          onClose={() => setActiveModal(null)}
          onSubmit={handleSubmitUnlock}
        />
      )}
    </div>
  );
};
