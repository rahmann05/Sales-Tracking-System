import React from 'react';
import { LuCompass } from 'react-icons/lu';
import { useSupervisorFieldVisits } from '../hooks/useSupervisorFieldVisits';
import { SpvModeSelector } from './SpvModeSelector';
import { SpvStopCard } from './SpvStopCard';
import { SpvFieldModals } from './SpvFieldModals';

/**
 * SupervisorDailyRjpStops Component (Orchestrator)
 * Single Responsibility: Kelola & eksekusi rute kunjungan RJP harian SPV.
 * Berbagi state machine + child components dengan SupervisorFieldView (DRY).
 */
export const SupervisorDailyRjpStops = ({ salesStops = [] }) => {
  const field = useSupervisorFieldVisits(salesStops);

  return (
    <div className="space-y-6">
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
              <LuCompass className="text-primary text-base" />
              <span>Daftar Titik Toko Supervisi ({field.spvStops.length} Outlet)</span>
            </h4>
            <p className="text-xs text-on-surface-variant">
              Lakukan Absen Masuk saat tiba di outlet dan isi checklist supervisi lapangan
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            {field.completedCount} dari {field.spvStops.length} Toko Disupervisi
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3.5">
          {field.spvStops.map((stop, idx) => (
            <SpvStopCard
              key={stop.id || idx}
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
