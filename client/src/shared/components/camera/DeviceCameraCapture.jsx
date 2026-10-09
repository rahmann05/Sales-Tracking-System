import React, { useRef, useEffect, useState } from 'react';
import { useGeofence } from '../../hooks/useGeofence';
import { useDeviceCamera } from '../../hooks/useDeviceCamera';
import { useLiveClock } from '../../hooks/useLiveClock';
import { useApp } from '../../../context/AppContext';
import { cameraSnapshotService } from '../../../services/cameraSnapshotService';
import { nativeFileCaptureService } from '../../../services/nativeFileCaptureService';

import { CameraGpsStatusBadge } from './CameraGpsStatusBadge';
import { CameraLiveVideoFeed } from './CameraLiveVideoFeed';
import { CameraLiveOverlay } from './CameraLiveOverlay';
import { CameraErrorDisplay } from './CameraErrorDisplay';
import { CapturedPhotoPreview } from './CapturedPhotoPreview';
import { CameraCaptureButton } from './CameraCaptureButton';
import { CameraNativeFileTrigger } from './CameraNativeFileTrigger';

/**
 * DeviceCameraCapture Component (Orchestrator)
 * Single Responsibility: Compose camera stream, GPS tracking, and snapshot preview sub-components.
 */
export const DeviceCameraCapture = ({
  outletId = null,
  onCapture,
  onLocationChange,
  capturedPhoto,
  onRetake,
  facingModeDefault = 'user',
  requireGps = true,
  photoRequired = true,
  enforceGeofence = true,
  targetLat = null,
  targetLng = null,
  maxRadiusMeters = 50,
  outletName = '',
  buttonLabel = 'Jepret Foto Presensi (GPS Terverifikasi)',
}) => {
  const canvasRef = useRef(null);
  const [cameraRequested,setCameraRequested]=useState(false);
  const { user, settings, incidents } = useApp();

  // Only the current account’s administrator-configured exception permits bypass.
  const hasException = (incidents||[]).some(r=>r.type==='UNLOCK_REQUEST'&&r.outletId===outletId&&r.requestedBy===user?.id&&r.status==='APPROVED'&&new Date(r.expiresAt)>new Date());
  const isBypassUser = hasException || settings.ATTENDANCE_GEOFENCE_BYPASS_ALLOWED === true;

  // 1. Dedicated Live Clock Hook
  const { currentTime } = useLiveClock();

  // 2. Dedicated Device Camera Stream Hook
  const {
    videoRef,
    facingMode,
    cameraActive,
    cameraError,
    stopCamera,
    toggleFacingMode,
  } = useDeviceCamera(facingModeDefault, !capturedPhoto&&(photoRequired||cameraRequested));

  // 3. Dedicated GPS & Geofence Hook
  const {
    userLocation,
    gpsError,
    isGpsLocked,
    refreshGpsLocation,
    isWithinGeofence,
  } = useGeofence(targetLat, targetLng, maxRadiusMeters,requireGps);

  useEffect(() => {
    if (onLocationChange) onLocationChange(isGpsLocked ? userLocation : null);
  }, [userLocation, isGpsLocked, onLocationChange]);

  const geofenceResult = isWithinGeofence();
  const isOutsideRadius = Boolean(requireGps && targetLat != null && targetLng != null && geofenceResult && !geofenceResult.isInside);
  const isBlockedByGeofence = enforceGeofence && isOutsideRadius && !isBypassUser;

  // Capture snapshot handler using cameraSnapshotService
  const handleCaptureSnapshot = () => {
    if (requireGps && !isGpsLocked) {
      alert('GPS belum terdeteksi. Pastikan GPS aktif dan izin lokasi diizinkan.');
      return;
    }

    if (isBlockedByGeofence) {
      alert(
        `Presensi Ditolak! Posisi Anda (${geofenceResult?.distanceMeters ?? 0}m) berada di luar radius toko (${maxRadiusMeters}m). Harap dekati lokasi fisik toko untuk melakukan presensi.`
      );
      return;
    }

    const dataUrl = cameraSnapshotService.captureWithWatermark({
      videoElement: videoRef.current,
      canvasElement: canvasRef.current,
      facingMode,
      userLocation,
      outletName,
    });

    if (dataUrl) {
      stopCamera();
      onCapture(dataUrl, userLocation);
    }
  };

  // Fallback native file capture handler using nativeFileCaptureService
  const handleNativeFileInput = async (e) => {
    if (requireGps && !isGpsLocked) {
      alert('GPS belum terdeteksi. Harap aktifkan izin lokasi.');
      return;
    }

    if (isBlockedByGeofence) {
      alert(
        `Presensi Ditolak! Posisi Anda (${geofenceResult?.distanceMeters ?? 0}m) berada di luar radius toko (${maxRadiusMeters}m). Harap dekati lokasi fisik toko untuk melakukan presensi.`
      );
      return;
    }

    const file = e.target.files?.[0];
    const dataUrl = await nativeFileCaptureService.readFileAsDataUrl(file);
    if (dataUrl) {
      stopCamera();
      onCapture(dataUrl, userLocation);
    }
  };

  const handleRetakePhoto = () => {
    onRetake();
    setCameraRequested(true);
  };

  return (
    <div className="space-y-3 w-full">
      <canvas ref={canvasRef} className="hidden" />

      {/* 1. GPS Status Badge */}
      {requireGps && (
        <CameraGpsStatusBadge
          isGpsLocked={isGpsLocked}
          gpsError={gpsError}
          userLocation={userLocation}
          onRefreshGps={refreshGpsLocation}
          targetLat={targetLat}
          targetLng={targetLng}
          outletName={outletName}
          maxRadiusMeters={maxRadiusMeters}
          geofenceResult={geofenceResult}
          isBypassUser={isBypassUser}
          isBlockedByGeofence={isBlockedByGeofence}
        />
      )}

      {/* 2. Live Camera View or Captured Photo Preview */}
      {capturedPhoto ? (
        <CapturedPhotoPreview capturedPhoto={capturedPhoto} onRetake={handleRetakePhoto} />
      ) : photoRequired||cameraRequested ? (
        <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-950 border border-border-glass shadow-inner flex items-center justify-center">
          <CameraLiveVideoFeed
            videoRef={videoRef}
            facingMode={facingMode}
            cameraActive={cameraActive}
            cameraError={cameraError}
          />

          <CameraErrorDisplay
            cameraError={cameraError}
            facingMode={facingMode}
            requireGps={requireGps}
            isGpsLocked={isGpsLocked}
            onNativeFileInput={handleNativeFileInput}
          />

          <CameraLiveOverlay
            cameraActive={cameraActive}
            onToggleFacingMode={toggleFacingMode}
            currentTime={currentTime}
            isGpsLocked={isGpsLocked}
          />
        </div>
      ) : <div className="rounded-xl border border-border-glass p-4 space-y-2"><p className="text-sm">Foto opsional. Anda dapat melanjutkan tanpa membuka kamera.</p><button type="button" className="config-button min-h-11" onClick={()=>setCameraRequested(true)}>Tambahkan foto</button></div>}

      {/* 3. Action Capture Button & Fallback */}
      {!capturedPhoto && (photoRequired||cameraRequested) && (
        <div className="space-y-2">
          <CameraCaptureButton
            requireGps={requireGps}
            isGpsLocked={isGpsLocked}
            isBlockedByGeofence={isBlockedByGeofence}
            distanceMeters={geofenceResult?.distanceMeters ?? 0}
            maxRadiusMeters={maxRadiusMeters}
            onCapture={handleCaptureSnapshot}
            label={buttonLabel}
          />
          <CameraNativeFileTrigger
            facingMode={facingMode}
            requireGps={requireGps}
            isGpsLocked={isGpsLocked}
            onNativeFileInput={handleNativeFileInput}
          />
        </div>
      )}
    </div>
  );
};
