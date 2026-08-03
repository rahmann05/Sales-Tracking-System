import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SalesShiftHeader } from './components/SalesShiftHeader';
import { SalesStopCard } from './components/SalesStopCard';
import { AbsenInModal } from './components/AbsenInModal';
import { InputOrderModal } from './components/InputOrderModal';
import { ReportClosedModal } from './components/ReportClosedModal';

/**
 * SalesPage Component (Container Page for Sales Field Rep Role)
 * 1 File per Component
 */
export const SalesPage = () => {
  const { salesStops, handleSalesAbsenIn, handleSubmitOrder, handleReportClosedOutlet } = useApp();

  const [selectedStop, setSelectedStop] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // 'ABSEN_IN', 'ORDER', 'CLOSED_REPORT'

  const handleOpenAbsenIn = (stop) => {
    setSelectedStop(stop);
    setActiveModal('ABSEN_IN');
  };

  const handleOpenInputOrder = (stop) => {
    setSelectedStop(stop);
    setActiveModal('ORDER');
  };

  const handleOpenReportClosed = (stop) => {
    setSelectedStop(stop);
    setActiveModal('CLOSED_REPORT');
  };

  const handleConfirmAbsenIn = (stopId) => {
    handleSalesAbsenIn(stopId);
    setActiveModal(null);
  };

  const handleSubmitOrderForm = (payload) => {
    handleSubmitOrder(payload);
    setActiveModal(null);
    alert('Order berhasil dikirim ke Admin!');
  };

  const handleSubmitClosedReport = (payload) => {
    handleReportClosedOutlet(payload);
    setActiveModal(null);
    alert('Laporan Toko Tutup dikirim ke Supervisor!');
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto pb-24">
      <SalesShiftHeader />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-on-surface">Daftar PJP Kunjungan Sales Hari Ini</h3>
            <p className="text-xs text-on-surface-variant">Ikuti urutan perhentian outlet secara hierarkis</p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-surface border border-border-glass rounded-full text-on-surface-variant">
            {salesStops.filter((s) => s.status === 'ORDERED' || s.status === 'SKIPPED').length} / {salesStops.length} Selesai
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {salesStops.map((stop) => (
            <SalesStopCard
              key={stop.id}
              stop={stop}
              onAbsenIn={handleOpenAbsenIn}
              onInputOrder={handleOpenInputOrder}
              onReportClosed={handleOpenReportClosed}
            />
          ))}
        </div>
      </div>

      <AbsenInModal
        stop={activeModal === 'ABSEN_IN' ? selectedStop : null}
        onClose={() => setActiveModal(null)}
        onConfirm={handleConfirmAbsenIn}
      />

      <InputOrderModal
        stop={activeModal === 'ORDER' ? selectedStop : null}
        onClose={() => setActiveModal(null)}
        onSubmitOrder={handleSubmitOrderForm}
      />

      <ReportClosedModal
        stop={activeModal === 'CLOSED_REPORT' ? selectedStop : null}
        onClose={() => setActiveModal(null)}
        onSubmitReport={handleSubmitClosedReport}
      />
    </div>
  );
};
