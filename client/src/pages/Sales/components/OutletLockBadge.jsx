import React from 'react';
import { LuLock, LuKey } from 'react-icons/lu';

/**
 * OutletLockBadge Component
 * Single Responsibility: Display locked outlet notification with button to request unlock from Admin.
 */
export const OutletLockBadge = ({ lockReason, onRequestUnlock, stop }) => {
  return (
    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2">
      <div className="flex items-start gap-2.5 text-xs text-amber-900">
        <LuLock className="text-base text-amber-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-bold text-amber-800">Absen Outlet Terkunci</p>
          <p className="text-[11px] text-amber-700 mt-0.5">{lockReason}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onRequestUnlock(stop)}
        className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.99]"
      >
        <LuKey className="text-xs" />
        <span>Minta Buka Kunci (Request Unlock ke Admin)</span>
      </button>
    </div>
  );
};
