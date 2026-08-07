import React from 'react';
import { LuCamera, LuShoppingCart, LuLogOut } from 'react-icons/lu';
import { FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { OutletLockBadge } from './OutletLockBadge';

/**
 * SalesStopActions Component
 * Single Responsibility: Render action buttons for Sales Stop (Lock badge, Absen In, Input Order, Toko Tutup, Absen Out).
 */
export const SalesStopActions = ({
  stop,
  isLocked,
  lockReason,
  onRequestUnlock,
  onAbsenIn,
  onAbsenOut,
  onInputOrder,
  onClosedReport,
}) => {
  if (!stop) return null;

  // Case 1: Locked Stop
  if (isLocked) {
    return (
      <OutletLockBadge
        stop={stop}
        lockReason={lockReason}
        onRequestUnlock={onRequestUnlock}
      />
    );
  }

  return (
    <div className="space-y-2 pt-1">
      {/* PENDING State: Absen In Button */}
      {stop.status === 'PENDING' && (
        <button
          type="button"
          onClick={() => onAbsenIn(stop)}
          className="w-full py-2.5 bg-primary text-on-primary font-semibold text-xs rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <LuCamera className="text-base" />
          <span>Absen In Toko (Check-In)</span>
        </button>
      )}

      {/* ARRIVED / IN_VISIT State: Input Order, Toko Tutup, and Absen Out */}
      {stop.status === 'ARRIVED' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
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
              onClick={() => onClosedReport(stop)}
              className="px-3 py-2.5 bg-rose-500/10 text-rose-600 border border-rose-500/30 font-semibold text-xs rounded-xl hover:bg-rose-500/20 transition-all flex items-center justify-center gap-1"
            >
              <FiAlertCircle className="text-base" />
              <span>Toko Tutup</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => onAbsenOut(stop)}
            className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
          >
            <LuLogOut className="text-sm text-emerald-400" />
            <span>Selesaikan Kunjungan & Absen Out</span>
          </button>
        </div>
      )}

      {/* ORDERED State: Order placed, ready for Absen Out */}
      {stop.status === 'ORDERED' && (
        <div className="space-y-2">
          <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-700 flex items-center justify-between font-semibold">
            <span>Order Berhasil Diinput</span>
            <span className="text-[11px] text-blue-600">Menunggu Absen Out</span>
          </div>

          <button
            type="button"
            onClick={() => onAbsenOut(stop)}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <LuLogOut className="text-base" />
            <span>Absen Out Toko (Selesaikan Kunjungan)</span>
          </button>
        </div>
      )}

      {/* Completed States: VISITED / COMPLETED / CLOSED / SKIPPED */}
      {(stop.status === 'VISITED' || stop.status === 'COMPLETED' || stop.status === 'CLOSED' || stop.status === 'SKIPPED') && (
        <div className="w-full p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center text-xs text-emerald-700 font-bold flex items-center justify-center gap-1.5">
          <FiCheckCircle className="text-sm" />
          <span>
            Kunjungan Selesai (In: {stop.checkInTime || '-'} • Out: {stop.checkOutTime || stop.checkInTime || '-'})
          </span>
        </div>
      )}
    </div>
  );
};
