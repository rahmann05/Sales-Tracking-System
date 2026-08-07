import React from 'react';
import { LuCamera, LuPackageCheck, LuLogOut } from 'react-icons/lu';
import { FiCheckCircle } from 'react-icons/fi';
import { OutletLockBadge } from '../../Sales/components/OutletLockBadge';

/**
 * DeliveryStopActions Component
 * Single Responsibility: Render action buttons for Driver & Helper Drop Point
 * (Lock badge, Absen In Tiba, Input POD, Absen Out Selesai, Finished state).
 */
export const DeliveryStopActions = ({
  stop,
  isLocked,
  lockReason,
  onRequestUnlock,
  onAbsenIn,
  onOpenPOD,
  onAbsenOut,
}) => {
  if (!stop) return null;

  // Case 1: Locked Drop Point
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
      {/* PENDING State: Absen In Drop Point */}
      {stop.status === 'PENDING' && (
        <button
          type="button"
          onClick={() => onAbsenIn(stop)}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <LuCamera className="text-base" />
          <span>Absen In Tiba di Drop Point</span>
        </button>
      )}

      {/* ARRIVED State: Submit POD or Absen Out */}
      {stop.status === 'ARRIVED' && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => onOpenPOD(stop)}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
          >
            <LuPackageCheck className="text-base" />
            <span>Checklist & Submit Bukti POD (Tanda Tangan)</span>
          </button>
        </div>
      )}

      {/* POD_SUBMITTED State: Ready for Absen Out */}
      {stop.status === 'POD_SUBMITTED' && (
        <div className="space-y-2">
          <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-700 flex items-center justify-between font-semibold">
            <span>POD & Tanda Tangan Tersimpan</span>
            <span className="text-[11px] text-blue-600">Menunggu Absen Out</span>
          </div>

          <button
            type="button"
            onClick={() => onAbsenOut(stop)}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <LuLogOut className="text-base" />
            <span>Absen Out (Selesaikan Serah Terima)</span>
          </button>
        </div>
      )}

      {/* DELIVERED / COMPLETED State */}
      {stop.status === 'DELIVERED' && (
        <div className="w-full p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center text-xs text-emerald-700 font-bold flex items-center justify-center gap-1.5">
          <FiCheckCircle className="text-sm" />
          <span>
            Pengiriman Selesai (In: {stop.checkInTime || '-'} • Out: {stop.checkOutTime || '-'})
          </span>
        </div>
      )}
    </div>
  );
};
