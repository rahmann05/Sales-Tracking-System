import React from 'react';
import { useApp } from '../../context/AppContext';
import { useModal } from '../../hooks/useModal';
import { notifySuccess } from '../../services/notificationService';
import { SalesShiftHeader } from './components/SalesShiftHeader';
import { DailyPjpOverview } from './components/DailyPjpOverview';
import { SalesStopCard } from './components/SalesStopCard';
import { SalesModals } from './components/SalesModals';

/**
 * SalesFieldView Component
 * Single Responsibility: Orchestrate the Sales field workspace (PJP stops + modals).
 * Modal state management is delegated to `useModal`; notifications to `notificationService`.
 */
export const SalesFieldView = () => {
  const {
    salesStops,
    handleSalesAbsenIn,
    handleSalesAbsenOut,
    handleSubmitOrder,
    handleReportClosedOutlet,
    handleRequestUnlockOutlet,
    handleSalesAbsenOffPJP,
  } = useApp();

  const { modalType, payload: selectedStop, openModal, closeModal, isOpen } = useModal();

  const stopActions = {
    onAbsenIn: (s) => openModal('ABSEN_IN', s),
    onAbsenOut: (s) => openModal('ABSEN_OUT', s),
    onRequestUnlock: (s) => openModal('UNLOCK_REQUEST', s),
    onInputOrder: (s) => openModal('ORDER', s),
    onClosedReport: (s) => openModal('CLOSED_REPORT', s),
  };

  const activeVisitingStop = salesStops.find(
    (s) => s.status === 'ARRIVED' || s.status === 'IN_VISIT'
  );

  const modalHandlers = {
    handleSalesAbsenIn: (stopId, payload) => {
      handleSalesAbsenIn(stopId, payload);
      closeModal();
      notifySuccess(`Absen In berhasil dicatat untuk ${selectedStop?.outletName}!\n\nCatatan: ${payload.notes || '-'}`);
    },
    handleSalesAbsenOut: (stopId, payload) => {
      handleSalesAbsenOut(stopId, payload);
      closeModal();
      notifySuccess(`Absen Out berhasil dicatat untuk ${selectedStop?.outletName}!\n\nKunjungan selesai dan outlet berikutnya kini terbuka.`);
    },
    handleSubmitOrder: (payload) => {
      handleSubmitOrder(payload);
      closeModal();
      notifySuccess(`Order berhasil dibuat untuk ${selectedStop?.outletName}! Lakukan Absen Out untuk menyelesaikan kunjungan.`);
    },
    handleReportClosedOutlet: (payload) => {
      handleReportClosedOutlet(payload);
      closeModal();
      notifySuccess(`Laporan Toko Tutup untuk ${selectedStop?.outletName} dikirim ke Supervisor.`);
    },
    handleRequestUnlockOutlet: (payload) => {
      handleRequestUnlockOutlet(payload);
      notifySuccess(`Permintaan Unlock untuk ${payload.outletName} telah dikirimkan ke Admin & Supervisor!`);
    },
    handleSalesAbsenOffPJP: (payload) => {
      handleSalesAbsenOffPJP(payload);
      closeModal();
      notifySuccess('Absen Toko Luar RJP berhasil dicatat!\n\nStatus: TIDAK TERVALIDASI\n(Data telah tersimpan di sistem dan menunggu validasi Supervisor)');
    },
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto pb-24">
      <SalesShiftHeader />

      <div className="space-y-4">
        <DailyPjpOverview
          salesStops={salesStops}
          onAbsenLuarRjp={() => openModal('OFFPJP_ABSEN')}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
          {salesStops.map((stop) => (
            <SalesStopCard
              key={stop.id}
              stop={stop}
              allStops={salesStops}
              {...stopActions}
            />
          ))}
        </div>
      </div>

      <SalesModals
        modalType={modalType}
        selectedStop={selectedStop}
        activeVisitingStop={activeVisitingStop}
        isOpen={isOpen}
        onClose={closeModal}
        handlers={modalHandlers}
      />
    </div>
  );
};
