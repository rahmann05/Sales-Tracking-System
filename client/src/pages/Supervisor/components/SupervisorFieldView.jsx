import { LiveSalesGpsTrackingTab } from '../../TeamTracking/components/LiveSalesGpsTrackingTab';
import { wibDateKey } from '../../../../../shared/visit-metrics.mjs';
import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import { useSupervisorFieldVisits } from '../hooks/useSupervisorFieldVisits';
import { SupervisorShiftHeader } from './SupervisorShiftHeader';
import { SpvStopCard } from './SpvStopCard';
import { SpvFieldModals } from './SpvFieldModals';
import { LuMapPin, LuClipboardList, LuPlus } from 'react-icons/lu';
import { pjpApi, collectPages } from '../../../services/api';

/**
 * SupervisorFieldView Component (Orchestrator)
 * Single Responsibility: Compose SPV field workspace dari child components.
 * State & business logic didelegasikan ke `useSupervisorFieldVisits`.
 */
export const SupervisorFieldView = ({ selectedDate }) => {
  const { user } = useApp();
  const [loadError, setLoadError] = useState('');
  const [todayPjps, setTodayPjps] = useState([]);
  
  useEffect(() => {
    let isMounted = true;
    const dateQuery = selectedDate || wibDateKey();
    const load = () => collectPages(pjpApi.getAllPjps, { date: dateQuery })
      .then((res) => {
        if (!isMounted) return;
        const pjps = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.data) ? res.data.data : (Array.isArray(res) ? res : []));
        setTodayPjps(pjps.filter((p) => wibDateKey(p.date) === dateQuery));
        setLoadError('');
      })
      .catch(e => { if (isMounted) setLoadError(e.message); });
    load();
    window.addEventListener('focus', load);
    window.addEventListener('operational-data-changed', load);
    return () => {
      isMounted = false;
      window.removeEventListener('focus', load);
      window.removeEventListener('operational-data-changed', load);
    };
  }, [user?.id, selectedDate]);

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

      <SupervisorShiftHeader />

      {field.error && <p role="alert" className="text-red-600 text-sm">{field.error}</p>}
      <div className="space-y-4">
        <h4 className="text-base font-bold text-on-surface flex items-center gap-2">
          <LuMapPin className="text-primary text-base" />
          <span>Pantauan Posisi & PJP Sales</span>
        </h4>
        <p className="text-xs text-on-surface-variant">
          Pilih sales di daftar untuk memantau posisinya dan menampilkan rute kunjungannya (PJP) di peta hari ini.
        </p>
        <LiveSalesGpsTrackingTab 
          onSelectSalesId={field.setSelectedSales}
          spvStops={field.spvStops}
        />
      </div>

      {field.selectedSales && (
        <div className="space-y-4 pt-6 border-t border-border-glass">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h4 className="text-lg font-black text-on-surface flex items-center gap-2">
                <LuClipboardList className="text-primary" /> Daftar Target Kunjungan Supervisi
              </h4>
              <p className="text-xs text-on-surface-variant mt-1">
                Toko-toko yang ada pada daftar kunjungan (PJP) sales yang Anda pilih. Lakukan absen masuk di toko yang ingin Anda supervisi.
              </p>
            </div>
            
            <button 
              type="button" 
              onClick={field.openOffPjp}
              className="px-5 py-2.5 rounded-xl border-2 border-primary text-primary font-bold hover:bg-primary/10 transition-all shadow-sm flex items-center gap-2 cursor-pointer text-xs shrink-0"
            >
              <LuPlus className="text-base" /> Absen Toko Terpisah / Mandiri
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {field.spvStops.map((stop, i) => (
              <SpvStopCard
                  key={stop.id}
                  stop={stop}
                  index={i}
                  record={field.spvVisitRecords[stop.id] || { status: 'PENDING' }}
                  onAbsenIn={() => field.openAbsenIn(stop)}
                  onAbsenOut={() => field.openAbsenOut(stop)}
                  onOpenAudit={() => field.openAudit(stop)}
              />
            ))}
            {field.spvStops.length === 0 && (
              <div className="col-span-full py-10 text-center border-2 border-dashed border-border-glass rounded-3xl">
                <p className="text-on-surface-variant text-sm font-semibold">Tidak ada PJP untuk sales ini hari ini.</p>
              </div>
            )}
          </div>
        </div>
      )}

      <SpvFieldModals 
        error={field.error}
        saving={field.saving}
        activeModal={field.activeModal}
        spvMode={field.spvMode}
        setSpvMode={field.setSpvMode}
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
