import React, { useState, useMemo } from 'react';
import { getTodayNameId } from '../../utils/dateUtils';
import { useApp } from '../../context/AppContext';
import { useModal } from '../../hooks/useModal';
import { notifySuccess } from '../../services/notificationService';
import { SalesShiftHeader } from './components/SalesShiftHeader';
import { SalesDailyPerformanceTracker } from './components/SalesDailyPerformanceTracker';
import { DailyPjpOverview } from './components/DailyPjpOverview';
import { SalesStopCard } from './components/SalesStopCard';
import { SalesOffPjpSection } from './components/SalesOffPjpSection';
import { SalesModals } from './components/SalesModals';
import { LuCalendar, LuMapPin, LuStore } from 'react-icons/lu';

/**
 * SalesFieldView Component
 * Single Responsibility: Orchestrate the Sales field workspace (PJP stops, Performance Tracker, Off-PJP Section + modals).
 * Modal state management is delegated to `useModal`; notifications to `notificationService`.
 */
export const SalesFieldView = () => {
  const {
    user,
    salesStops,
    offPjpAttendances,
    handleSalesAbsenIn,
    handleSalesAbsenOut,
    handleSubmitOrder,
    handleReportClosedOutlet,
    handleRequestUnlockOutlet,
    handleSalesAbsenOffPJP,
  } = useApp();

  const { modalType, payload: selectedStop, openModal, closeModal, isOpen } = useModal();

  // Active Selected Day Filter for PJP Plan
  const todayDayName = getTodayNameId();
  const [selectedDay, setSelectedDay] = useState(todayDayName);

  // Extract unique days dynamically from the stops assigned to the sales rep
  const dynamicDaysList = useMemo(() => {
    const list = [];
    const mapDays = new Map();
    salesStops.forEach((s) => {
      const day = s.dayOfWeek || todayDayName;
      if (!mapDays.has(day)) {
        mapDays.set(day, true);
        list.push({
          day: day,
          plan: s.callplanName || '-',
          cluster: s.clusterName || '-',
        });
      }
    });

    if (list.length === 0) {
      list.push({ day: selectedDay, plan: 'Belum Ada Jadwal', cluster: '-' });
    }
    return list;
  }, [salesStops, todayDayName, selectedDay]);

  // Filter stops by selected Day & User assignment
  const activeDayStops = useMemo(() => {
    return salesStops.filter((stop) => (stop.dayOfWeek || todayDayName) === selectedDay);
  }, [salesStops, selectedDay, todayDayName]);

  const stopActions = {
    onAbsenIn: (s) => openModal('ABSEN_IN', s),
    onAbsenOut: (s) => openModal('ABSEN_OUT', s),
    onRequestUnlock: (s) => openModal('UNLOCK_REQUEST', s),
    onInputOrder: (s) => openModal('ORDER', s),
    onClosedReport: (s) => openModal('CLOSED_REPORT', s),
  };

  const activeVisitingStop = activeDayStops.find(
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
      closeModal();
      notifySuccess(`Permintaan Unlock untuk ${payload.outletName} telah dikirimkan ke Admin & Supervisor!`);
    },
    handleSalesAbsenOffPJP: (payload) => {
      handleSalesAbsenOffPJP(payload);
      closeModal();
      notifySuccess('Absen Toko Luar RJP berhasil dicatat!\n\nStatus: MENUNGGU VALIDASI\n(Data telah tersimpan di sistem dan menunggu validasi Supervisor)');
    },
  };

  const activePlanName = activeDayStops[0]?.callplanName || 'RJP-CIMAHI-01';
  const activeClusterName = activeDayStops[0]?.clusterName || 'Klaster Cimahi Tengah';

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto pb-16 md:pb-8">
      <SalesShiftHeader />

      {/* PJP Plan & Day Selection Header Bar */}
      <div className="bg-surface border border-border-glass rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-glass pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
              <LuMapPin className="text-xs" />
              {user?.region || 'Region Cimahi - Bandung Barat'}
            </span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-surface-variant text-on-surface-variant flex items-center gap-1">
              <LuStore className="text-xs" />
              {activeClusterName}
            </span>
          </div>
          <div className="text-xs text-on-surface-variant font-medium">
            Rencana Hari Ini: <span className="font-bold text-primary">{activePlanName}</span> ({activeDayStops.length} Toko Wajib)
          </div>
        </div>

        {/* Day / Call Plan Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {dynamicDaysList.map((item) => {
            const isActive = selectedDay === item.day;
            const count = salesStops.filter((s) => (s.dayOfWeek || todayDayName) === item.day).length;
            return (
              <button
                key={item.day}
                type="button"
                onClick={() => setSelectedDay(item.day)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
                  isActive
                    ? 'bg-primary text-on-primary shadow-sm font-bold'
                    : 'bg-surface-variant/50 text-on-surface-variant hover:bg-surface-variant hover:text-on-surface'
                }`}
              >
                <LuCalendar className="text-sm" />
                <span>{item.day} - {item.plan}</span>
                <span
                  className={`px-1.5 py-0.5 text-[10px] rounded-md ${
                    isActive ? 'bg-on-primary/20 text-on-primary' : 'bg-surface text-on-surface-variant'
                  }`}
                >
                  {count} Toko
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Daily Visit Quota & RJP Compliance Tracker */}
      <SalesDailyPerformanceTracker
        salesStops={activeDayStops}
        offPjpAttendances={offPjpAttendances}
        targetDailyVisits={5}
      />

      {/* Regular Scheduled PJP Stops List */}
      <div className="space-y-4">
        <DailyPjpOverview
          salesStops={activeDayStops}
          onAbsenLuarRjp={() => openModal('OFFPJP_ABSEN')}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
          {activeDayStops.map((stop) => (
            <SalesStopCard
              key={stop.id}
              stop={stop}
              allStops={activeDayStops}
              {...stopActions}
            />
          ))}
        </div>
      </div>

      {/* Dynamic Off-PJP Attendance Result Cards (Returns null if empty) */}
      <SalesOffPjpSection offPjpAttendances={offPjpAttendances} />

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
