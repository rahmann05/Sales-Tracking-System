import {FollowUpPanel} from '../../shared/components/common/FollowUpPanel';
import {OrderFulfillmentPanel} from '../Warehouse/components/OrderFulfillmentPanel';
import React, { useState, useMemo, useEffect } from 'react';
import { getTodayNameId } from '../../utils/dateUtils';
import { useApp } from '../../context/AppContext';
import { useModal } from '../../shared/hooks/useModal';
import { notifySuccess } from '../../services/notificationService';
import { SalesShiftHeader } from './components/SalesShiftHeader';
import { SalesDailyPerformanceTracker } from './components/SalesDailyPerformanceTracker';
import { DailyPjpOverview } from './components/DailyPjpOverview';
import { SalesStopCard } from './components/SalesStopCard';
import { SalesOffPjpSection } from './components/SalesOffPjpSection';
import { SalesModals } from './components/SalesModals';
import { DayPlanTabs } from './components/DayPlanTabs';
import { LuMapPin, LuStore } from 'react-icons/lu';

/**
 * SalesFieldView Component
 * Single Responsibility: Orchestrate the Sales field workspace (PJP stops, Performance Tracker, Off-PJP Section + modals).
 * Modal state management is delegated to `useModal`; notifications to `notificationService`.
 */
export const SalesFieldView = () => {
  const {
    user, settings,
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

  // Active Selected Day Filter for PJP Plan with localStorage offline persistence
  const todayDayName = getTodayNameId();
  const [selectedDay, setSelectedDay] = useState(() => {
    try {
      return localStorage.getItem('sales_pjp_active_day') || todayDayName;
    } catch  {
      return todayDayName;
    }
  });

  const handleSelectDay = (day) => {
    setSelectedDay(day);
    try {
      localStorage.setItem('sales_pjp_active_day', day);
    } catch  {}
  };

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

  useEffect(() => {
    if (!dynamicDaysList.some(item => item.day === selectedDay)) setSelectedDay(dynamicDaysList[0]?.day || todayDayName);
  }, [dynamicDaysList, selectedDay, todayDayName]);

  const onAbsenIn = (s) => openModal('ABSEN_IN', s);
  const onAbsenOut = (s) => openModal('ABSEN_OUT', s);
  const onRequestUnlock = (s) => openModal('UNLOCK_REQUEST', s);
  const onInputOrder = (s) => openModal('ORDER', s);
  const onClosedReport = (s) => openModal('CLOSED_REPORT', s);

  const activeVisitingStop = activeDayStops.find(
    (s) => s.status === 'ARRIVED' || s.status === 'IN_VISIT'
  );

  const modalHandlers = {
    handleSalesAbsenIn: async (stopId, payload) => {
      await handleSalesAbsenIn(stopId, payload);
      closeModal();
      notifySuccess(`Absen In berhasil dicatat untuk ${selectedStop?.outletName}!\n\nCatatan: ${payload.notes || '-'}`);
    },
    handleSalesAbsenOut: async (stopId, payload) => {
      await handleSalesAbsenOut(stopId, payload);
      closeModal();
      notifySuccess(`Absen Out berhasil dicatat untuk ${selectedStop?.outletName}!\n\nKunjungan selesai dan outlet berikutnya kini terbuka.`);
    },
    handleSubmitOrder: async (payload) => {
      await handleSubmitOrder(payload);
      closeModal();
      notifySuccess(`Order berhasil dibuat untuk ${selectedStop?.outletName}! Lakukan Absen Out untuk menyelesaikan kunjungan.`);
    },
    handleReportClosedOutlet: async (payload) => {
      await handleReportClosedOutlet(payload);
      closeModal();
      notifySuccess(`Laporan Toko Tutup untuk ${selectedStop?.outletName} dikirim ke Supervisor.`);
    },
    handleRequestUnlockOutlet: async (payload) => {
      await handleRequestUnlockOutlet(payload);
      closeModal();
      notifySuccess(`Permintaan Unlock untuk ${payload.outletName} telah dikirimkan ke Admin & Supervisor!`);
    },
    handleSalesAbsenOffPJP: async (payload) => {
      const attendance = await handleSalesAbsenOffPJP(payload);
      closeModal();
      const status = { PENDING: 'MENUNGGU VALIDASI', APPROVED: 'TERVALIDASI', REJECTED: 'DITOLAK' }[attendance.status] || attendance.status;
      notifySuccess(`Pengajuan kunjungan tersimpan. Status terbaru: ${status}.`);
    },
  };

  const activePlanName = activeDayStops[0]?.callplanName || 'Belum ada jadwal';
  const activeClusterName = activeDayStops[0]?.clusterName || 'Belum ditetapkan';

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto pb-16 md:pb-8">
      <FollowUpPanel/>
      <SalesShiftHeader />

      {/* PJP Plan & Day Selection Header Bar */}
      <div className="bg-surface border border-border-glass rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-glass pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
              <LuMapPin className="text-xs" />
              {user?.region || 'Wilayah belum ditetapkan'}
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
        <DayPlanTabs days={dynamicDaysList} selectedDay={selectedDay} onSelect={handleSelectDay} stops={salesStops} todayDayName={todayDayName}/>

      </div>

      {/* Live Daily Visit Quota & RJP Compliance Tracker */}
      <SalesDailyPerformanceTracker
        salesStops={activeDayStops}
        offPjpAttendances={offPjpAttendances}
        targetDailyVisits={settings.DAILY_CALL_TARGET_CALLS}
      />

      {/* Regular Scheduled PJP Stops List */}
      <div className="space-y-4">
        <DailyPjpOverview
          salesStops={activeDayStops}
          onAbsenLuarRjp={() => openModal('OFFPJP_ABSEN')}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
          {activeDayStops.length === 0 && <p className="text-sm text-on-surface-variant p-4">Belum ada toko terjadwal untuk hari ini. Hubungi supervisor untuk memeriksa PJP.</p>}
          {activeDayStops.map((stop) => (
            <SalesStopCard
              key={stop.id}
              stop={stop}
              allStops={activeDayStops}
              onAbsenIn={onAbsenIn}
              onAbsenOut={onAbsenOut}
              onRequestUnlock={onRequestUnlock}
              onInputOrder={onInputOrder}
              onClosedReport={onClosedReport}
            />
          ))}
        </div>
      </div>

      {/* Dynamic Off-PJP Attendance Result Cards (Returns null if empty) */}
      <SalesOffPjpSection offPjpAttendances={offPjpAttendances} />
      <details className="border rounded-2xl bg-surface p-4"><summary className="cursor-pointer min-h-11 font-bold">Pantau order dan janji pengiriman saya</summary><OrderFulfillmentPanel/></details>

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
