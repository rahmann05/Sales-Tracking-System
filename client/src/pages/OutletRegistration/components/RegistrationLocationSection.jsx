import React from 'react';
import { LuLock, LuCamera, LuRefreshCw, LuMapPin } from "react-icons/lu";
import { GooglePlaceDetailCard } from './GooglePlaceDetailCard';
export function RegistrationLocationSection({
  formData,
  handleDetectGPS,
  isLocating,
  setIsOutletCameraOpen,
  settings,
  verifiedPlace
}) {
  return <div className="border border-slate-700/80 rounded-xl overflow-hidden divide-y divide-slate-700/60 bg-surface">
        <div className="p-2.5 bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <LuMapPin className="text-primary" />
            <span className="font-black">VALIDASI GOOGLE PLACE & KOORDINAT GPS (OTOMATIS TERSIMPAN)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-700 rounded text-[10px] font-black border border-emerald-500/30 flex items-center gap-1">
              <LuLock className="text-[10px]" /> GPS Terkunci by Sistem
            </span>
            <button type="button" onClick={handleDetectGPS} disabled={isLocating} className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1">
              <LuRefreshCw className={isLocating ? 'animate-spin' : ''} />
              <span>{isLocating ? 'Mendeteksi...' : 'Ambil Ulang GPS'}</span>
            </button>
          </div>
        </div>

        <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          {/* Sisi Kiri: Profil Google Place */}
          <div>
            <GooglePlaceDetailCard place={verifiedPlace} currentLat={Number(formData.latitude) || -6.8722} currentLng={Number(formData.longitude) || 107.5422} searchedQuery={formData.name} />
          </div>

          {/* Sisi Kanan: Foto Outlet Live Kamera */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold">Foto Fisik Outlet:</span>
              <span className="text-[10px] text-amber-600 font-bold">{settings.CUSTOMER_REG_REQUIRE_PHOTO ? '* Wajib kamera' : 'Opsional'}</span>
            </div>

            {formData.photoUrl ? <div className="relative w-full h-36 rounded-xl overflow-hidden border border-slate-700/60 bg-black flex items-center justify-center">
                <img src={formData.photoUrl} alt="Foto Outlet" className="w-full h-full object-contain" />
                <div className="absolute bottom-2 left-2 bg-black/75 text-white font-mono text-[9px] px-2 py-0.5 rounded">
                  GPS: {formData.latitude}, {formData.longitude}
                </div>
                <button type="button" onClick={() => setIsOutletCameraOpen(true)} className="absolute top-2 right-2 px-2 py-1 bg-black/80 hover:bg-neutral-800 text-white rounded text-[10px] font-bold flex items-center gap-1">
                  <LuRefreshCw /> Ambil Ulang
                </button>
              </div> : <button type="button" onClick={() => setIsOutletCameraOpen(true)} className="w-full py-6 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 flex flex-col items-center justify-center gap-2 text-primary font-black transition-all active:scale-98">
                <LuCamera className="text-2xl" />
                <span>Buka Kamera Outlet ({settings.CUSTOMER_REG_REQUIRE_PHOTO ? 'wajib' : 'opsional'})</span>
              </button>}
          </div>
        </div>
      </div>;
}
