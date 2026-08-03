import React from 'react';
import { LuMapPin, LuCamera, LuShoppingCart } from 'react-icons/lu';
import { FiAlertCircle } from 'react-icons/fi';
import { GeofenceStatusBadge } from './GeofenceStatusBadge';

/**
 * SalesStopCard Component (Single Responsibility: Individual Outlet Card in PJP Route List)
 * 1 File per Component
 */
export const SalesStopCard = ({ stop, onAbsenIn, onInputOrder, onReportClosed }) => {
  return (
    <div
      className={`bg-surface border rounded-2xl p-5 shadow-sm space-y-4 transition-all relative ${
        stop.status === 'ORDERED'
          ? 'border-emerald-500/40 bg-emerald-500/5'
          : stop.status === 'CLOSED'
          ? 'border-rose-500/40 bg-rose-500/5'
          : stop.status === 'SKIPPED'
          ? 'border-amber-500/40 bg-amber-500/5 opacity-75'
          : 'border-border-glass hover:border-primary/40'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">
            #{stop.sequence}
          </span>
          <div>
            <h4 className="font-bold text-on-surface text-base">{stop.outletName}</h4>
            <p className="text-xs text-on-surface-variant flex items-center gap-1">
              <LuMapPin className="text-primary text-xs" />
              {stop.address}
            </p>
          </div>
        </div>

        <span
          className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
            stop.status === 'ORDERED'
              ? 'bg-emerald-500/10 text-emerald-600'
              : stop.status === 'ARRIVED'
              ? 'bg-blue-500/10 text-blue-600'
              : stop.status === 'CLOSED'
              ? 'bg-rose-500/10 text-rose-600'
              : stop.status === 'SKIPPED'
              ? 'bg-amber-500/10 text-amber-600'
              : 'bg-surface-variant text-on-surface-variant'
          }`}
        >
          {stop.status}
        </span>
      </div>

      <GeofenceStatusBadge distanceMeters={stop.currentDistance} radiusMeters={stop.radiusMeters} />

      <div className="flex items-center gap-2 pt-1">
        {stop.status === 'PENDING' && (
          <button
            type="button"
            onClick={() => onAbsenIn(stop)}
            className="flex-1 py-2.5 bg-primary text-on-primary font-semibold text-xs rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <LuCamera className="text-base" />
            <span>Absen In Toko</span>
          </button>
        )}

        {stop.status === 'ARRIVED' && (
          <>
            <button
              type="button"
              onClick={() => onInputOrder(stop)}
              className="flex-1 py-2.5 bg-emerald-600 text-white font-semibold text-xs rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              <LuShoppingCart className="text-base" />
              <span>Input Order</span>
            </button>

            <button
              type="button"
              onClick={() => onReportClosed(stop)}
              className="px-3 py-2.5 bg-rose-500/10 text-rose-600 border border-rose-500/30 font-semibold text-xs rounded-xl hover:bg-rose-500/20 transition-all flex items-center justify-center gap-1"
            >
              <FiAlertCircle className="text-base" />
              <span>Toko Tutup</span>
            </button>
          </>
        )}

        {(stop.status === 'ORDERED' || stop.status === 'CLOSED' || stop.status === 'SKIPPED') && (
          <div className="w-full text-center text-xs text-on-surface-variant font-medium py-1">
            Kunjungan selesai ({stop.checkInTime || 'Selesai'})
          </div>
        )}
      </div>
    </div>
  );
};
