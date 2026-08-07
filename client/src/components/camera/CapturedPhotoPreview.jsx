import React from 'react';
import { LuRefreshCw, LuCheck } from 'react-icons/lu';

/**
 * CapturedPhotoPreview Component
 * Single Responsibility: Display photo preview after snapshot is taken, with retake action and confirmation badge.
 */
export const CapturedPhotoPreview = ({ capturedPhoto, onRetake }) => {
  if (!capturedPhoto) return null;

  return (
    <div className="relative rounded-2xl overflow-hidden aspect-video bg-black border border-border-glass shadow-lg group">
      <img src={capturedPhoto} alt="Foto Presensi Terambil" className="w-full h-full object-cover" />
      <div className="absolute top-3 right-3 flex items-center gap-2">
        <button
          type="button"
          onClick={onRetake}
          className="px-3 py-1.5 bg-black/70 hover:bg-black/90 backdrop-blur-md text-white text-xs font-semibold rounded-xl border border-white/20 transition-all flex items-center gap-1.5 shadow-md"
        >
          <LuRefreshCw className="text-xs" />
          <span>Foto Ulang</span>
        </button>
      </div>
      <div className="absolute bottom-3 left-3 bg-emerald-600/95 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-md">
        <LuCheck className="text-sm" />
        <span>Foto & Koordinat GPS Berhasil Direkam</span>
      </div>
    </div>
  );
};
