import React from 'react';
import { LuCamera, LuLock } from 'react-icons/lu';

/**
 * CameraCaptureButton Component
 * Single Responsibility: Action button to trigger photo capture. Disabled/locked when GPS is not acquired.
 */
export const CameraCaptureButton = ({
  requireGps,
  isGpsLocked,
  isBlockedByGeofence = false,
  distanceMeters = 0,
  maxRadiusMeters = 50,
  onCapture,
  label = 'Jepret Foto Presensi (GPS Terverifikasi)',
}) => {
  if (requireGps && !isGpsLocked) {
    return (
      <button
        type="button"
        disabled
        className="w-full py-3 bg-slate-700/60 text-slate-400 border border-slate-600 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-not-allowed transition-all"
      >
        <LuLock className="text-base text-amber-400" />
        <span>GPS Belum Terdeteksi — Tombol Foto Terkunci</span>
      </button>
    );
  }

  if (isBlockedByGeofence) {
    return (
      <button
        type="button"
        disabled
        className="w-full py-3 bg-rose-950/40 text-rose-300 border border-rose-500/40 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-not-allowed transition-all shadow-sm"
      >
        <LuLock className="text-base text-rose-400" />
        <span>Di Luar Radius Toko ({distanceMeters}m &gt; {maxRadiusMeters}m) — Presensi Terkunci</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onCapture}
      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer"
    >
      <LuCamera className="text-base" />
      <span>{label}</span>
    </button>
  );
};
