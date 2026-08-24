import React, { useState } from 'react';
import {
  LuCamera,
  LuX,
  LuRefreshCw,
  LuCheck,
  LuShieldCheck,
  LuClock,
} from 'react-icons/lu';
import { useDeviceCamera } from '../../../hooks/useDeviceCamera';

/**
 * IdCardCameraModal Component
 * Single Responsibility: Live hardware camera viewfinder for capturing KTP / NPWP documents
 * strictly via device webcam/camera hardware stream with embedded digital security watermark.
 */
export const IdCardCameraModal = ({
  isOpen,
  onClose,
  onCapture,
  cardType = 'KTP',
  outletName = '',
  division = 'BELFOODS',
}) => {
  const { videoRef, cameraActive, cameraError, startCamera, stopCamera, toggleFacingMode } =
    useDeviceCamera('environment', isOpen);

  const [previewPhoto, setPreviewPhoto] = useState(null);

  if (!isOpen) return null;

  const handleTakeSnapshot = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Draw camera video frame
    ctx.drawImage(video, 0, 0, width, height);

    // 2. Draw watermark bottom overlay bar
    const barHeight = Math.max(60, Math.floor(height * 0.12));
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, height - barHeight, width, barHeight);

    // 3. Draw branding & document type
    ctx.fillStyle = '#00F0FF';
    ctx.font = `bold ${Math.max(14, Math.floor(width * 0.022))}px sans-serif`;
    ctx.fillText(
      `[DOKUMEN RESMI ${cardType}] • CV SINAR ANUGRAH • DIVISI ${division}`,
      20,
      height - barHeight + 25
    );

    // 4. Draw outlet name & timestamp
    const nowStr = new Date().toLocaleString('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'medium',
    });
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.max(12, Math.floor(width * 0.018))}px monospace`;
    ctx.fillText(
      `TOKO: ${outletName || 'OUTLET BARU'} | WAKTU: ${nowStr} WIB`,
      20,
      height - 12
    );

    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setPreviewPhoto(dataUrl);
  };

  const handleConfirmPhoto = () => {
    if (previewPhoto) {
      onCapture(previewPhoto);
      stopCamera();
      onClose();
    }
  };

  const handleRetake = () => {
    setPreviewPhoto(null);
    startCamera();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-3 sm:p-6 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-neutral-900 rounded-3xl overflow-hidden shadow-2xl border border-neutral-800 flex flex-col max-h-[92vh]">
        {/* Top Bar */}
        <div className="p-4 bg-neutral-950 flex items-center justify-between text-white border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <LuShieldCheck className="text-teal-400 text-base" />
            <span className="text-xs font-black tracking-wider uppercase">
              Foto Dokumen {cardType}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!previewPhoto && (
              <button
                type="button"
                onClick={toggleFacingMode}
                className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-full text-white text-xs"
                title="Ganti Kamera Depan/Belakang"
              >
                <LuRefreshCw />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-full text-white text-xs"
            >
              <LuX />
            </button>
          </div>
        </div>

        {/* Viewfinder / Preview Screen */}
        <div className="relative flex-1 bg-black min-h-[320px] flex items-center justify-center overflow-hidden">
          {previewPhoto ? (
            <img
              src={previewPhoto}
              alt={`Hasil Foto ${cardType}`}
              className="w-full h-full object-contain max-h-[55vh]"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover max-h-[55vh]"
              />

              {/* Viewfinder Overlay Info */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none text-white text-[10px] font-bold">
                <span className="px-2.5 py-1 bg-black/60 backdrop-blur-xs rounded-lg flex items-center gap-1">
                  <LuShieldCheck className="text-teal-400" /> {cardType} ASLI
                </span>
                <span className="px-2.5 py-1 bg-black/60 backdrop-blur-xs rounded-lg flex items-center gap-1">
                  <LuClock className="text-amber-400" /> LIVE CAMERA
                </span>
              </div>

              {/* Card Framing Guide */}
              <div className="absolute inset-8 sm:inset-12 border-2 border-teal-400/60 rounded-2xl pointer-events-none flex items-center justify-center">
                <span className="text-[11px] font-extrabold text-white/90 bg-black/50 px-3 py-1 rounded-full">
                  Posisikan {cardType} di dalam kotak ini
                </span>
              </div>

              {cameraError && (
                <div className="absolute inset-4 bg-neutral-900/95 p-6 rounded-2xl flex flex-col items-center justify-center text-center text-white space-y-3 z-20">
                  <p className="text-xs text-red-400 font-bold">{cameraError}</p>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold"
                  >
                    Coba Lagi
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom Shutter / Action Controls */}
        <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex items-center justify-center gap-4">
          {previewPhoto ? (
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all active:scale-95"
              >
                <LuRefreshCw /> Foto Ulang
              </button>
              <button
                type="button"
                onClick={handleConfirmPhoto}
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-black rounded-xl flex items-center gap-2 shadow-lg transition-all active:scale-95"
              >
                <LuCheck className="text-base" /> Gunakan Foto {cardType}
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={handleTakeSnapshot}
                disabled={!cameraActive}
                className="w-16 h-16 rounded-full bg-white hover:bg-neutral-200 border-4 border-teal-500/40 flex items-center justify-center text-teal-600 shadow-xl transition-all active:scale-95 disabled:opacity-50"
              >
                <div className="w-12 h-12 rounded-full bg-teal-600 flex items-center justify-center text-white">
                  <LuCamera className="text-xl" />
                </div>
              </button>
              <span className="text-[10px] text-neutral-400 font-bold">
                Tekan tombol untuk mengambil foto {cardType}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
