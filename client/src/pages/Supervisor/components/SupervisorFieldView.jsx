import {FollowUpPanel} from '../../../shared/components/common/FollowUpPanel';
import { wibDateKey } from '../../../../../shared/visit-metrics.mjs';
import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import { useSupervisorFieldVisits } from '../hooks/useSupervisorFieldVisits';
import { SupervisorShiftHeader } from './SupervisorShiftHeader';
import { SpvMetricsGrid } from './SpvMetricsGrid';
import { SpvModeSelector } from './SpvModeSelector';
import { SpvStopCard } from './SpvStopCard';
import { SpvFieldModals } from './SpvFieldModals';
import { LuStore } from 'react-icons/lu';
import { pjpApi, collectPages } from '../../../services/api';

/**
 * SupervisorFieldView Component (Orchestrator)
 * Single Responsibility: Compose SPV field workspace dari child components.
 * State & business logic didelegasikan ke `useSupervisorFieldVisits`.
 */
export const SupervisorFieldView = () => {
  const { user } = useApp();
  const [loadError,setLoadError] = useState('');
  const [todayPjps, setTodayPjps] = useState([]);
  
  useEffect(() => {
    let isMounted = true;
    const load = ()=>collectPages(pjpApi.getAllPjps, { date: wibDateKey() })
      .then((res) => {
        if (!isMounted) return;
        const pjps = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.data) ? res.data.data : (Array.isArray(res) ? res : []));
        const todayStr = wibDateKey();
        setTodayPjps(pjps.filter((p) => wibDateKey(p.date) === todayStr));setLoadError('');
      })
      .catch(e => {if(isMounted) setLoadError(e.message);});
    load();
    window.addEventListener('focus',load);
    window.addEventListener('operational-data-changed',load);
    return () => {isMounted=false;window.removeEventListener('focus',load);window.removeEventListener('operational-data-changed',load);};
  }, [user.id]);

  const salesOptions = useMemo(() => {
    const uniqueSales = new Map();
    todayPjps.forEach(p => {
      if (p.user) {
        uniqueSales.set(p.user.id, {
          value: p.user.id,
          label: `${p.user.name} (${p.user.cluster?.name || 'RJP'})`
        });
      }
    });
    return Array.from(uniqueSales.values());
  }, [todayPjps]);

  const field = useSupervisorFieldVisits(todayPjps, salesOptions);

  return (
    <div className="space-y-6">
      {loadError && <p role="alert">{loadError}</p>}
      <FollowUpPanel/>
      <SupervisorShiftHeader />

      {field.error && <p role="alert" className="text-red-600 text-sm">{field.error}</p>}
      <SpvMetricsGrid
        spvStops={field.spvStops}
        spvMode={field.spvMode}
        selectedSales={salesOptions.find(s=>s.value===field.selectedSales)?.label || 'Pilih sales'}
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
          {!field.spvStops.length && <p className="p-4 text-sm text-on-surface-variant">Belum ada PJP tim untuk disupervisi hari ini.</p>}
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

      <SpvFieldModals followUp={field.followUp} onChangeFollowUp={field.setFollowUp}
        error={field.error}
        saving={field.saving}
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
