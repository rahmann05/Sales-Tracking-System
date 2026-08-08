import React from 'react';
import { useApp } from '../../../context/AppContext';
import { useSupervisorFieldVisits } from '../hooks/useSupervisorFieldVisits';
import { SupervisorShiftHeader } from './SupervisorShiftHeader';
import { SpvMetricsGrid } from './SpvMetricsGrid';
import { SpvModeSelector } from './SpvModeSelector';
import { SpvStopCard } from './SpvStopCard';
import { SpvFieldModals } from './SpvFieldModals';
import { LuStore } from 'react-icons/lu';

/**
 * SupervisorFieldView Component (Orchestrator)
 * Single Responsibility: Compose SPV field workspace dari child components.
 * State & business logic didelegasikan ke `useSupervisorFieldVisits`.
 */
export const SupervisorFieldView = () => {
  const { salesStops = [] } = useApp();
  const field = useSupervisorFieldVisits(salesStops);

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
