import { summarizeVisits } from '../../../../../shared/visit-metrics.mjs';
import { useApp } from '../../../context/AppContext';
import React from 'react';
import { LuCamera } from 'react-icons/lu';

export const DailyPjpOverview = ({ salesStops, onAbsenLuarRjp }) => {
  const metrics = summarizeVisits(salesStops);
  const { settings } = useApp();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h3 className="text-lg font-bold text-on-surface">Kunjungan hari ini</h3>
        <p className="text-xs text-on-surface-variant">Kunjungi outlet sesuai urutan rencana perjalanan</p>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {settings.OFF_PJP_ENABLED && <button
          onClick={onAbsenLuarRjp}
          className="app-button"
        >
          <LuCamera className="text-sm" />
          <span>Absen Toko Luar RJP</span>
        </button>}
        <dl className="visit-status-strip" aria-label="Ringkasan kunjungan">
          {[[metrics.notCheckedIn,'Belum masuk'],[metrics.inProgress,'Berlangsung'],[metrics.completed,'Selesai'],[metrics.exceptions,'Tutup / dilewati']].map(([value,label]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
        </dl>
      </div>
    </div>
  );
};
