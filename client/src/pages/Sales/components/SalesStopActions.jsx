import { useApp } from '../../../context/AppContext';
import React from 'react';
import { LuCamera, LuShoppingCart, LuLogOut } from 'react-icons/lu';
import { FiCheckCircle } from 'react-icons/fi';
import { OutletLockBadge } from './OutletLockBadge';
import { VisitDurationTimer } from './VisitDurationTimer';

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
  const { settings } = useApp();
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
      {['PENDING','ARRIVED','ORDERED'].includes(stop.status)&&<button type="button" className="btn btn-secondary w-full" onClick={()=>onRequestUnlock(stop)}>Ajukan pengecualian GPS</button>}
      {/* PENDING State: Absen In Button */}
      {['PENDING', 'ARRIVED'].includes(stop.status) && <button type="button" className="btn btn-secondary w-full min-h-11" onClick={() => onClosedReport(stop)}>Laporkan toko tutup</button>}
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

      {/* ARRIVED / IN_VISIT State: Active Timer, Input Order, Toko Tutup, and Absen Out */}
      {stop.status === 'ARRIVED' && (
        <div className="space-y-2.5">
          {/* Active Visit Duration Tracker */}
          <VisitDurationTimer startTime={stop.inTimestamp} minMinutes={settings.ATTENDANCE_ENFORCE_MIN_DURATION ? settings.MINIMUM_VISIT_DURATION_MINUTES : 0} />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onInputOrder(stop)}
              className="flex-1 py-2.5 bg-emerald-600 text-white font-semibold text-xs rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              <LuShoppingCart className="text-base" />
              <span>Input Order</span>
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
      {(stop.status === 'VISITED' || stop.status === 'COMPLETED' || stop.status === 'CLOSED' || stop.status === 'CLOSED_REPORTED' || stop.status === 'SKIPPED') && (
        <div className="w-full p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center text-xs text-emerald-700 font-bold flex items-center justify-center gap-1.5">
          <FiCheckCircle className="text-sm" />
          <span>
            {['CLOSED', 'CLOSED_REPORTED', 'SKIPPED'].includes(stop.status) ? 'Toko tutup / dilewati' : 'Kunjungan selesai'} (In: {stop.checkInTime || '-'} · Out: {stop.checkOutTime || '-'})
          </span>
        </div>
      )}
    </div>
  );
};
