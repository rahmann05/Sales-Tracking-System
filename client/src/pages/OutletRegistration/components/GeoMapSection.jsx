import React, { useState } from 'react';
import {
  LuMapPin,
  LuNavigation,
  LuCamera,
  LuLock,
  LuCheck,
  LuRefreshCw,
} from 'react-icons/lu';
import { GooglePlaceDetailCard } from './GooglePlaceDetailCard';
import { OutletCameraModal } from './OutletCameraModal';

/**
 * GeoMapSection Component
 * Single Responsibility: Manage Automatic GPS Coordinates (Locked by System),
 * Google Place Showcase Card, and Direct Hardware Camera Photo Capture with Digital Watermark.
 */
export const GeoMapSection = ({
  latitude,
  longitude,
  photoUrl,
  outletName,
  division = 'BELFOODS',
  isLocating,
  verifiedPlace,
  onDetectGPS,
  onChange,
}) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const currentLat = Number(latitude) || -6.8722;
  const currentLng = Number(longitude) || 107.5422;

  return (
    <div className="outlet-reg-section-card space-y-4">
      <div className="outlet-reg-section-title flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LuMapPin className="text-primary" />
          <span>5. Validasi Google Place & Titik Koordinat GPS</span>
        </div>
        <button
          type="button"
          onClick={onDetectGPS}
          disabled={isLocating}
          className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
        >
          <LuRefreshCw className={isLocating ? 'animate-spin' : ''} />
          <span>{isLocating ? 'Mendeteksi...' : 'Refresh GPS'}</span>
        </button>
      </div>

      {/* ─── Tampilan Profil Toko dari Google Places API (Hanya Data Real) ──── */}
      <div className="space-y-3">
        <GooglePlaceDetailCard
          place={verifiedPlace}
          currentLat={currentLat}
          currentLng={currentLng}
          searchedQuery={outletName}
        />
      </div>

      {/* ─── Titik Koordinat GPS (Strictly Otomatis by Sistem) ───────────────── */}
      <div className="p-3 bg-surface-container-low rounded-xl border border-border-glass space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-on-surface flex items-center gap-1">
              <LuNavigation className="text-primary text-xs" /> Koordinat Lokasi Outlet
            </span>
            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 rounded text-[10px] font-bold flex items-center gap-1">
              <LuLock className="text-[10px] text-emerald-600" /> Terkunci Otomatis by Sistem
            </span>
          </div>

          <button
            type="button"
            onClick={onDetectGPS}
            disabled={isLocating}
            className="px-2.5 py-1 bg-primary text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs hover:opacity-90 transition-all active:scale-95"
          >
            <LuNavigation /> {isLocating ? 'Mendeteksi GPS...' : 'Ambil Ulang GPS'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] text-on-surface-variant font-medium">Latitude</label>
            <input
              type="number"
              step="any"
              readOnly
              value={latitude}
              className="outlet-reg-input font-mono text-xs bg-surface-container/60 cursor-not-allowed opacity-90"
            />
          </div>
          <div>
            <label className="text-[11px] text-on-surface-variant font-medium">Longitude</label>
            <input
              type="number"
              step="any"
              readOnly
              value={longitude}
              className="outlet-reg-input font-mono text-xs bg-surface-container/60 cursor-not-allowed opacity-90"
            />
          </div>
        </div>

        <p className="text-[10px] text-on-surface-variant m-0 pt-0.5">
          * Koordinat GPS dan titik lokasi dikunci secara otomatis by sistem melalui Google Place API dan sensor GPS untuk integritas data rute.
        </p>
      </div>

      {/* ─── Foto Outlet Langsung dari Kamera Hardware (Wajib di Tempat) ───────────── */}
      <div className="space-y-2">
        <label className="outlet-reg-label flex items-center gap-1">
          <LuCamera className="text-primary text-xs" /> FOTO OUTLET (KAMERA LANGSUNG DI LOKASI)
        </label>

        {photoUrl ? (
          <div className="p-3 bg-surface-container rounded-2xl border border-border-glass space-y-3">
            <div className="relative w-full h-48 rounded-xl overflow-hidden border border-border-glass bg-black">
              <img
                src={photoUrl}
                alt="Foto Outlet Live"
                className="w-full h-full object-contain"
              />
              <span className="absolute bottom-2 left-2 bg-black/80 text-white font-mono text-[10px] px-2.5 py-1 rounded-lg backdrop-blur-xs flex items-center gap-1">
                <LuMapPin className="text-emerald-400 text-xs" /> GPS: {latitude}, {longitude}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                <LuCheck className="text-emerald-600" /> Foto berhasil diambil di lokasi
              </span>
              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
              >
                <LuRefreshCw /> Ambil Ulang Foto
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-primary/5 rounded-2xl border-2 border-dashed border-primary/30 flex flex-col items-center justify-center text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl">
              <LuCamera />
            </div>
            <div>
              <div className="text-xs font-black text-on-surface">Kamera Wajib di Lokasi Outlet</div>
              <p className="text-[10px] text-on-surface-variant m-0 max-w-xs mt-0.5">
                Foto harus diambil langsung saat berada di depan toko/outlet menggunakan kamera perangkat fisik.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsCameraOpen(true)}
              className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-md transition-all active:scale-95"
            >
              <LuCamera className="text-sm" /> Buka Kamera Outlet
            </button>
          </div>
        )}
      </div>

      {/* Live Hardware Camera Modal */}
      <OutletCameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(capturedBase64) => {
          onChange('photoUrl', capturedBase64);
        }}
        outletName={outletName}
        latitude={latitude}
        longitude={longitude}
        division={division}
      />
    </div>
  );
};
