import React from 'react';
import { LuCamera } from 'react-icons/lu';
import { FiAlertCircle } from 'react-icons/fi';

/**
 * CameraErrorDisplay Component
 * Single Responsibility: Render error state when device camera cannot be accessed, with native file fallback trigger.
 */
export const CameraErrorDisplay = ({
  cameraError,
  facingMode,
  requireGps,
  isGpsLocked,
  onNativeFileInput,
}) => {
  if (!cameraError) return null;

  return (
    <div className="absolute inset-0 p-5 bg-slate-900/95 flex flex-col items-center justify-center text-center gap-3">
      <FiAlertCircle className="text-3xl text-rose-500" />
      <div className="space-y-1 max-w-xs">
        <p className="text-xs font-bold text-white">Gagal Membuka Kamera</p>
        <p className="text-[11px] text-slate-400">{cameraError}</p>
      </div>
      <label
        className={`mt-2 px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md ${
          requireGps && !isGpsLocked
            ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
            : 'bg-primary text-on-primary cursor-pointer hover:bg-primary/90'
        }`}
      >
        <input
          type="file"
          accept="image/*"
          capture={facingMode === 'user' ? 'user' : 'environment'}
          disabled={requireGps && !isGpsLocked}
          onChange={onNativeFileInput}
          className="hidden"
        />
        <LuCamera className="text-sm" />
        <span>Buka Kamera Native HP</span>
      </label>
    </div>
  );
};
