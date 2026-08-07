import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AbsenOffPjpModal } from './components/AbsenOffPjpModal';
import { AbsenInModal } from './components/AbsenInModal';
import { AbsenOutModal } from './components/AbsenOutModal';
import { RequestUnlockModal } from './components/RequestUnlockModal';
import { InputOrderModal } from './components/InputOrderModal';
import { ReportClosedModal } from './components/ReportClosedModal';
import { SalesStopCard } from './components/SalesStopCard';
import { SalesShiftHeader } from './components/SalesShiftHeader';
import { DailyPjpOverview } from './components/DailyPjpOverview';

export const SalesFieldView = () => {
  const { 
    salesStops, 
    handleSalesAbsenIn, 
    handleSalesAbsenOut,
    handleSubmitOrder, 
    handleReportClosedOutlet,
    handleRequestUnlockOutlet,
    handleSalesAbsenOffPJP
  } = useApp();

  const [selectedStop, setSelectedStop] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // 'ABSEN_IN', 'ABSEN_OUT', 'UNLOCK_REQUEST', 'ORDER', 'CLOSED_REPORT', 'OFFPJP_ABSEN'

  const submitAbsenOffPjpForm = (payload) => {
    handleSalesAbsenOffPJP(payload);
    setActiveModal(null);
    alert('Absen Toko Luar RJP berhasil dicatat!\n\nStatus: TIDAK TERVALIDASI\n(Data telah tersimpan di sistem dan menunggu validasi Supervisor)');
  };

  const handleConfirmAbsenIn = (stopId, payload) => {
    handleSalesAbsenIn(stopId, payload);
    setActiveModal(null);
    alert(`Absen In berhasil dicatat untuk ${selectedStop?.outletName}!\n\nCatatan: ${payload.notes || '-'}`);
  };

  const handleConfirmAbsenOut = (stopId, payload) => {
    handleSalesAbsenOut(stopId, payload);
    setActiveModal(null);
    alert(`Absen Out berhasil dicatat untuk ${selectedStop?.outletName}!\n\nKunjungan selesai dan outlet berikutnya kini terbuka.`);
  };

  const handleSubmitUnlock = (payload) => {
    handleRequestUnlockOutlet(payload);
    alert(`Permintaan Unlock untuk ${payload.outletName} telah dikirimkan ke Admin & Supervisor!`);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto pb-24">
      {/* Header Banner & Shift Attendance Card */}
      <SalesShiftHeader />

      {/* Daily PJP Route Overview */}
      <div className="space-y-4">
        <DailyPjpOverview 
          salesStops={salesStops}
          onAbsenLuarRjp={() => setActiveModal('OFFPJP_ABSEN')}
        />

        {/* Outlet Stops Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
          {salesStops.map((stop) => (
            <SalesStopCard
              key={stop.id}
              stop={stop}
              allStops={salesStops}
              onAbsenIn={(s) => {
                setSelectedStop(s);
                setActiveModal('ABSEN_IN');
              }}
              onAbsenOut={(s) => {
                setSelectedStop(s);
                setActiveModal('ABSEN_OUT');
              }}
              onRequestUnlock={(s) => {
                setSelectedStop(s);
                setActiveModal('UNLOCK_REQUEST');
              }}
              onInputOrder={(s) => {
                setSelectedStop(s);
                setActiveModal('ORDER');
              }}
              onClosedReport={(s) => {
                setSelectedStop(s);
                setActiveModal('CLOSED_REPORT');
              }}
            />
          ))}
        </div>
      </div>

      {/* 1. ABSEN IN GEOFENCE & NOTES MODAL */}
      {activeModal === 'ABSEN_IN' && selectedStop && (
        <AbsenInModal 
          stop={selectedStop} 
          onClose={() => setActiveModal(null)} 
          onConfirm={handleConfirmAbsenIn} 
        />
      )}

      {/* 2. ABSEN OUT GEOFENCE & NOTES MODAL */}
      {activeModal === 'ABSEN_OUT' && selectedStop && (
        <AbsenOutModal
          stop={selectedStop}
          onClose={() => setActiveModal(null)}
          onConfirm={handleConfirmAbsenOut}
        />
      )}

      {/* 3. REQUEST UNLOCK MODAL */}
      {activeModal === 'UNLOCK_REQUEST' && selectedStop && (
        <RequestUnlockModal
          stop={selectedStop}
          activeVisitingStop={salesStops.find((s) => s.status === 'ARRIVED' || s.status === 'IN_VISIT')}
          onClose={() => setActiveModal(null)}
          onSubmitUnlockRequest={handleSubmitUnlock}
        />
      )}

      {/* 4. INPUT ORDER MODAL */}
      {activeModal === 'ORDER' && selectedStop && (
        <InputOrderModal 
          stop={selectedStop} 
          onClose={() => setActiveModal(null)} 
          onSubmitOrder={(payload) => {
            handleSubmitOrder(payload);
            setActiveModal(null);
            alert(`Order berhasil dibuat untuk ${selectedStop.outletName}! Lakukan Absen Out untuk menyelesaikan kunjungan.`);
          }} 
        />
      )}

      {/* 5. CLOSED OUTLET REPORT MODAL */}
      {activeModal === 'CLOSED_REPORT' && selectedStop && (
        <ReportClosedModal 
          stop={selectedStop} 
          onClose={() => setActiveModal(null)} 
          onSubmitReport={(payload) => {
            handleReportClosedOutlet(payload);
            setActiveModal(null);
            alert(`Laporan Toko Tutup untuk ${selectedStop.outletName} dikirim ke Supervisor.`);
          }} 
        />
      )}

      {/* 6. OFFPJP ABSEN MODAL */}
      <AbsenOffPjpModal
        isOpen={activeModal === 'OFFPJP_ABSEN'}
        onClose={() => setActiveModal(null)}
        onSubmit={submitAbsenOffPjpForm}
      />
    </div>
  );
};
