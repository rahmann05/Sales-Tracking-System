import React from 'react';
import { LuClock } from 'react-icons/lu';
import { FiXCircle, FiCheckCircle } from 'react-icons/fi';

/**
 * AbsenInModal Component (Single Responsibility: Modal Check-In Geofence & Selfie Camera Stamp)
 * 1 File per Component
 */
export const AbsenInModal = ({ stop, onClose, onConfirm }) => {
  if (!stop) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border-glass rounded-3xl p-6 w-full max-w-md space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border-glass pb-3">
          <div>
            <h3 className="font-bold text-lg text-on-surface">Absen In Outlet</h3>
            <p className="text-xs text-on-surface-variant">{stop.outletName}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-surface-variant text-on-surface-variant">
            <FiXCircle className="text-xl" />
          </button>
        </div>

        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3">
          <FiCheckCircle className="text-2xl text-emerald-600 flex-shrink-0" />
          <div className="text-xs">
            <p className="font-bold text-emerald-700">Geofence Lokasi Diterima</p>
            <p className="text-emerald-800">Jarak {stop.currentDistance}m dari koordinat terdaftar toko. Presisi GPS 8m.</p>
          </div>
        </div>

        <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-border-glass">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600"
            alt="Selfie"
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] text-white flex items-center gap-1.5">
            <LuClock className="text-xs text-primary" />
            <span>{new Date().toLocaleTimeString()} WIB — GPS Stamp Active</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onConfirm(stop.id)}
          className="w-full py-3 bg-primary text-on-primary font-bold text-sm rounded-xl hover:bg-primary/90 transition-all shadow-md"
        >
          Konfirmasi Absen In
        </button>
      </div>
    </div>
  );
};
