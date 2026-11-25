import React from 'react';
import { LuRefreshCw } from 'react-icons/lu';
import '../../../styles/common/CameraCapture.css';

const meters = (value) => {
  if (value == null) return '—';
  return value >= 1000
    ? `${(value / 1000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} km`
    : `${value.toLocaleString('id-ID')} m`;
};

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
  isBypassUser = false,
  isBlockedByGeofence = false,
}) => {
  const hasTarget = targetLat != null && targetLng != null;
  const inside = Boolean(geofenceResult?.isInside);
  const tone = gpsError
    ? 'error'
    : !isGpsLocked
      ? 'pending'
      : isBlockedByGeofence
        ? 'blocked'
        : hasTarget && !inside
          ? 'warn'
          : 'ok';

  if (gpsError)
    return (
      <section className="camera-status" data-tone={tone} role="status">
        <h4 className="camera-status-title">
          <span className="camera-dot" aria-hidden="true" />
          GPS tidak terdeteksi
        </h4>
        <p className="camera-status-body">{gpsError}</p>
        <button type="button" className="app-button" onClick={onRefreshGps}>
          <LuRefreshCw aria-hidden="true" /> Coba lagi
        </button>
      </section>
    );

  if (!isGpsLocked)
    return (
      <section className="camera-status" data-tone={tone} role="status">
        <div className="camera-status-head">
          <h4 className="camera-status-title">
            <span className="camera-dot" aria-hidden="true" />
            Mencari sinyal GPS
          </h4>
          <button type="button" className="app-button" onClick={onRefreshGps}>
            <LuRefreshCw aria-hidden="true" /> Muat ulang
          </button>
        </div>
        <p className="camera-status-body">Menunggu koordinat dari perangkat Anda.</p>
      </section>
    );

  const verdict = inside
    ? `Dalam radius toko (maksimal ${meters(maxRadiusMeters)}).`
    : isBypassUser
      ? `Di luar radius ${meters(maxRadiusMeters)}, pengecualian radius aktif.`
      : isBlockedByGeofence
        ? `Di luar radius ${meters(maxRadiusMeters)}. Dekati toko untuk melanjutkan presensi.`
        : `Di luar radius ${meters(maxRadiusMeters)}.`;

  return (
    <section className="camera-status" data-tone={tone} role="status">
      <div className="camera-status-head">
        <h4 className="camera-status-title">
          <span className="camera-dot" aria-hidden="true" />
          Lokasi terkunci
        </h4>
        <p className="camera-meta">Akurasi ±{userLocation.accuracy} m</p>
      </div>
      <dl className="camera-facts">
        <dt>Koordinat</dt>
        <dd>
          {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
        </dd>
        {hasTarget && (
          <>
            <dt>Jarak ke {outletName || 'toko'}</dt>
            <dd>{meters(geofenceResult?.distanceMeters)}</dd>
          </>
        )}
      </dl>
      {hasTarget && <p className="camera-verdict">{verdict}</p>}
    </section>
  );
};
