import React from 'react';
import { LuSwitchCamera, LuClock, LuMapPin } from 'react-icons/lu';

/**
 * CameraLiveOverlay Component
 * Single Responsibility: Live camera overlays including timestamp, GPS status, and camera switcher button.
 */
export const CameraLiveOverlay = ({
  cameraActive,
  onToggleFacingMode,
  currentTime,
  isGpsLocked,
}) => {
  if (!cameraActive) return null;

  return (
    <>
      {/* Switch Camera Button (Front vs Back) */}
      <button
        type="button"
        onClick={onToggleFacingMode}
        title="Ganti Kamera Depan / Belakang"
        className="absolute top-3 right-3 p-2.5 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-xl text-white text-xs font-semibold border border-white/20 transition-all shadow-md flex items-center gap-1"
      >
        <LuSwitchCamera className="text-base" />
      </button>

      {/* Live Timestamp & GPS lock status banner */}
      <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-xl text-[11px] text-white flex items-center gap-2 shadow-md">
        <div className="flex items-center gap-1">
          <LuClock className="text-xs text-primary shrink-0" />
          <span className="font-mono">{currentTime} WIB</span>
        </div>
        <span className="text-slate-400">•</span>
        <div className="flex items-center gap-1 text-emerald-400 font-mono">
          <LuMapPin className="text-xs shrink-0" />
          <span>{isGpsLocked ? 'GPS LOCKED' : 'SEARCHING GPS'}</span>
        </div>
      </div>
    </>
  );
};
