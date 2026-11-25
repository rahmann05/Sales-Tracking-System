import React from 'react';
import { LuCamera } from 'react-icons/lu';

const distance = (value) =>
  value >= 1000
    ? `${(value / 1000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} km`
    : `${value.toLocaleString('id-ID')} m`;

/**
 * CameraCaptureButton Component
 * Single Responsibility: Action button to trigger photo capture. Disabled when GPS is not acquired.
 */
export const CameraCaptureButton = ({
  requireGps,
  isGpsLocked,
  isBlockedByGeofence = false,
  distanceMeters = 0,
  maxRadiusMeters = 50,
  onCapture,
  label = 'Ambil foto',
}) => {
  if (requireGps && !isGpsLocked)
    return (
      <button type="button" disabled className="app-button">
        Menunggu GPS sebelum mengambil foto
      </button>
    );

  if (isBlockedByGeofence)
    return (
      <button type="button" disabled className="app-button">
        Di luar radius toko ({distance(distanceMeters)} dari maksimal {distance(maxRadiusMeters)})
      </button>
    );

  return (
    <button type="button" onClick={onCapture} className="app-button app-button-primary">
      <LuCamera aria-hidden="true" />
      {label}
    </button>
  );
};
