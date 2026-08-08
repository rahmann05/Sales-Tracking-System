import React from 'react';
import { LuStore, LuMapPin, LuNavigation } from 'react-icons/lu';

/**
 * SalesOutletItemCard Component
 * Single Responsibility: Display a single assigned PJP outlet stop item in the Active Routes list for Sales.
 * Clicking this card triggers Google Maps panTo & focus on this outlet.
 * 1 File = 1 Component
 */
export const SalesOutletItemCard = ({ stop, sequence, isSelected, onClick }) => {
  if (!stop) return null;

  return (
    <div
      onClick={onClick}
      className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none space-y-2 ${
        isSelected
          ? 'bg-primary/10 border-primary shadow-md'
          : 'bg-surface-variant/20 border-border-glass hover:bg-surface-variant/40'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-6 h-6 rounded-lg bg-primary text-white font-extrabold text-xs flex items-center justify-center shrink-0">
            #{sequence}
          </span>
          <h4 className="font-bold text-on-surface text-sm tracking-tight truncate">
            {stop.outletName || stop.customerName}
          </h4>
        </div>

        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
            stop.status === 'ORDERED' || stop.status === 'COMPLETED'
              ? 'bg-emerald-500/15 text-emerald-600'
              : stop.status === 'CLOSED' || stop.status === 'SKIPPED'
              ? 'bg-slate-500/15 text-slate-600'
              : 'bg-primary/15 text-primary'
          }`}
        >
          {stop.status || 'PENDING'}
        </span>
      </div>

      <p className="text-xs text-on-surface-variant flex items-center gap-1">
        <LuMapPin className="text-primary text-xs shrink-0" />
        <span className="truncate">{stop.address || 'Alamat outlet'}</span>
      </p>

      {stop.legDistanceKm != null && (
        <div className="flex items-center justify-between text-[11px] text-on-surface-variant pt-1 border-t border-border-glass/60">
          <span className="flex items-center gap-1 font-mono text-tertiary">
            <LuNavigation className="text-xs" />
            Jarak: <strong>{stop.legDistanceKm} Km</strong>
          </span>
          <span className="text-[10px] text-primary font-semibold flex items-center gap-1">
            <span>Fokus Peta</span>
            <LuMapPin className="text-xs" />
          </span>
        </div>
      )}
    </div>
  );
};
