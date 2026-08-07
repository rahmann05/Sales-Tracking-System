import React from 'react';
import { LuCamera, LuPlus } from 'react-icons/lu';

export const DailyPjpOverview = ({ salesStops, onAbsenLuarRjp }) => {
  const completedStops = salesStops.filter((s) => s.status === 'ORDERED' || s.status === 'SKIPPED').length;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h3 className="text-lg font-bold text-on-surface">Daftar PJP Kunjungan Sales Hari Ini</h3>
        <p className="text-xs text-on-surface-variant">Ikuti urutan perhentian outlet secara hierarkis</p>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={onAbsenLuarRjp}
          className="px-3 py-1.5 bg-tertiary/10 border border-tertiary/30 text-tertiary text-xs font-bold rounded-xl hover:bg-tertiary/20 transition-all flex items-center gap-1.5 shadow-sm"
        >
          <LuCamera className="text-sm" />
          <span>Absen Toko Luar RJP</span>
        </button>
        <span className="text-xs font-semibold px-3 py-1 bg-surface border border-border-glass rounded-full text-on-surface-variant">
          {completedStops} / {salesStops.length} Selesai
        </span>
      </div>
    </div>
  );
};
