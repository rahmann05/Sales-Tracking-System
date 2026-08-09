import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import { useSupervisorFieldVisits } from '../hooks/useSupervisorFieldVisits';
import { SupervisorShiftHeader } from './SupervisorShiftHeader';
import { SpvMetricsGrid } from './SpvMetricsGrid';
import { SpvModeSelector } from './SpvModeSelector';
import { SpvStopCard } from './SpvStopCard';
import { SpvFieldModals } from './SpvFieldModals';
import { LuStore } from 'react-icons/lu';
import { pjpApi } from '../../../services/api';

/**
 * SupervisorFieldView Component (Orchestrator)
 * Single Responsibility: Compose SPV field workspace dari child components.
 * State & business logic didelegasikan ke `useSupervisorFieldVisits`.
 */
export const SupervisorFieldView = () => {
  const [todayPjps, setTodayPjps] = useState([]);
  
  useEffect(() => {
    let isMounted = true;
    pjpApi.getAllPjps()
      .then((res) => {
        if (!isMounted) return;
        const pjps = Array.isArray(res?.data) ? res.data : [];
        const todayStr = new Date().toDateString();
        setTodayPjps(pjps.filter((p) => new Date(p.date).toDateString() === todayStr));
      })
      .catch(() => { });
    return () => { isMounted = false; };
  }, []);

  const salesOptions = useMemo(() => {
    const uniqueSales = new Map();
    todayPjps.forEach(p => {
      if (p.user) {
        uniqueSales.set(p.user.name, {
          value: p.user.name,
          label: `${p.user.name} (${p.user.cluster?.name || 'RJP'})`
        });
      }
    });
    return Array.from(uniqueSales.values());
  }, [todayPjps]);

  const field = useSupervisorFieldVisits(todayPjps, salesOptions);

  return (
    <div className="space-y-6">
      <SupervisorShiftHeader />

      <SpvMetricsGrid
        spvStops={field.spvStops}
        spvMode={field.spvMode}
        selectedSales={field.selectedSales}
        completedCount={field.completedCount}
        inVisitCount={field.inVisitCount}
      />

      <SpvModeSelector
        spvMode={field.spvMode}
        onSelectMode={field.setSpvMode}
        selectedSales={field.selectedSales}
        onSelectSales={field.setSelectedSales}
        salesOptions={salesOptions}
        onOpenOffPjp={field.openOffPjp}
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-base font-bold text-on-surface flex items-center gap-2">
              <LuStore className="text-primary text-base" />
              <span>Titik Kunjungan Toko Supervisi Lapangan ({field.spvStops.length} Outlet)</span>
            </h4>
            <p className="text-xs text-on-surface-variant">
              Lakukan Absen Masuk saat tiba di toko, periksa display dan stok, lalu lakukan Absen Keluar
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {field.spvStops.map((stop, idx) => (
            <SpvStopCard
              key={stop.id}
              stop={stop}
              index={idx}
              record={field.spvVisitRecords[stop.id] || { status: 'PENDING' }}
              onAbsenIn={field.openAbsenIn}
              onOpenAudit={field.openAudit}
              onAbsenOut={field.openAbsenOut}
            />
          ))}
        </div>
      </div>

      <SpvFieldModals
        activeModal={field.activeModal}
        selectedStop={field.selectedStop}
        inputNotes={field.inputNotes}
        onChangeNotes={field.setInputNotes}
        checklist={field.checklist}
        onChangeChecklist={field.setChecklist}
        offPjpForm={field.offPjpForm}
        onChangeOffPjpForm={field.setOffPjpForm}
        onClose={field.closeModal}
        onConfirmAbsenIn={field.confirmAbsenIn}
        onSaveAudit={field.saveAudit}
        onConfirmAbsenOut={field.confirmAbsenOut}
        onConfirmOffPjp={field.confirmOffPjp}
      />
    </div>
  );
};
