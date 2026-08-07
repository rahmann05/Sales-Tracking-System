import React from 'react';
import { LuMapPin, LuRefreshCw, LuCheck, LuNavigation } from 'react-icons/lu';
import { FiAlertCircle } from 'react-icons/fi';

/**
 * CameraGpsStatusBadge Component
 * Single Responsibility: Display real-time GPS signal status, coordinates, accuracy, and Geofence distance.
 */
export const CameraGpsStatusBadge = ({
  isGpsLocked,
  gpsError,
  userLocation,
  onRefreshGps,
  targetLat,
  targetLng,
  outletName,
  maxRadiusMeters,
  geofenceResult,
}) => {
  return (
    <div
      className={`p-3 rounded-2xl border text-xs transition-all flex items-start gap-2.5 ${
        isGpsLocked
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800'
          : gpsError
          ? 'bg-rose-500/10 border-rose-500/30 text-rose-700'
          : 'bg-amber-500/10 border-amber-500/30 text-amber-800'
      }`}
    >
      {isGpsLocked ? (
        <LuMapPin className="text-lg text-emerald-600 shrink-0 mt-0.5" />
      ) : gpsError ? (
        <FiAlertCircle className="text-lg text-rose-600 shrink-0 mt-0.5" />
      ) : (
        <LuRefreshCw className="text-lg text-amber-600 shrink-0 mt-0.5 animate-spin" />
      )}

      <div className="flex-1 min-w-0">
        {isGpsLocked ? (
          <div>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="font-bold text-emerald-700 flex items-center gap-1">
                <LuCheck className="text-sm" /> GPS Terdeteksi & Terkunci
              </span>
              <span className="font-mono text-[11px] text-emerald-600">Akurasi: ±{userLocation.accuracy}m</span>
            </div>
            <p className="font-mono text-[11px] text-emerald-700 mt-0.5">
              Koordinat: {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
            </p>
            {targetLat != null && targetLng != null && (
              <p className="text-[11px] font-medium text-emerald-800 mt-1 flex items-center gap-1">
                <LuNavigation className="text-xs shrink-0" />
                <span>
                  Jarak ke {outletName || 'Outlet'}:{' '}
                  <strong>{geofenceResult?.distanceMeters ?? 0}m</strong> (
                  {geofenceResult?.isInside
                    ? `Dalam Geofence ≤${maxRadiusMeters}m`
                    : `Luar Geofence >${maxRadiusMeters}m`}
                  )
                </span>
              </p>
            )}
          </div>
        ) : gpsError ? (
          <div>
            <p className="font-bold text-rose-700">GPS Tidak Terdeteksi!</p>
            <p className="text-[11px] text-rose-600 mt-0.5">{gpsError}</p>
            <button
              type="button"
              onClick={onRefreshGps}
              className="mt-2 px-3 py-1 bg-rose-600 text-white rounded-lg text-[11px] font-bold hover:bg-rose-700 transition-all flex items-center gap-1"
            >
              <LuRefreshCw className="text-xs" /> Coba Deteksi GPS Ulang
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-bold text-amber-800">Sedang Mencari Sinyal GPS...</p>
              <p className="text-[11px] text-amber-700">Menunggu koordinat satelit/GPS perangkat Anda.</p>
            </div>
            <button
              type="button"
              onClick={onRefreshGps}
              className="p-1.5 bg-amber-500/20 rounded-lg hover:bg-amber-500/30 text-amber-800 text-xs"
            >
              <LuRefreshCw className="animate-spin" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
