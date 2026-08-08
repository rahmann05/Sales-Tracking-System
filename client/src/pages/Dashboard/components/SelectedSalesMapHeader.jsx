import React from 'react';
import { LuUser, LuX, LuNavigation, LuMapPin } from 'react-icons/lu';

/**
 * SelectedSalesMapHeader Component
 * Single Responsibility: Display active Sales route focus banner with clear option to reset back to all clusters.
 * 1 File = 1 Component
 */
export const SelectedSalesMapHeader = ({ selectedSales, onClearSelection }) => {
  if (!selectedSales) return null;

  const salesName = selectedSales.repName || selectedSales.name || 'Sales Field Rep';
  const stopCount = Array.isArray(selectedSales.stops)
    ? selectedSales.stops.length
    : selectedSales.stops || 4;

  return (
    <div className="absolute top-4 left-4 right-4 z-10 bg-surface/95 backdrop-blur-md p-3 rounded-2xl border border-primary/30 shadow-xl flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-3">
        <span className="w-9 h-9 rounded-xl bg-primary text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
          <LuUser />
        </span>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-extrabold text-sm text-on-surface leading-tight">
              Rute Aktif Sales: {salesName}
            </h4>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
              {stopCount} Toko RJP
            </span>
          </div>
          <p className="text-[11px] text-on-surface-variant flex items-center gap-1 mt-0.5">
            <LuNavigation className="text-primary text-xs shrink-0" />
            <span>Menampilkan garis rute dari posisi terakhir Sales ke outlet tujuan berikutnya.</span>
          </p>
        </div>
      </div>

      <button
        onClick={onClearSelection}
        className="px-3 py-1.5 bg-surface-variant/40 hover:bg-surface-variant text-on-surface font-bold text-xs rounded-xl border border-border-glass transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
      >
        <LuX className="text-sm" />
        <span>Tampilkan Semua Klaster</span>
      </button>
    </div>
  );
};
