import React, { useRef, useEffect, useState } from 'react';
import { cameraInputPolicy } from '../../../../../shared/camera-input-policy.mjs';
import {
  evidenceImageError,
  evidenceImageFormats,
} from '../../../../../shared/evidence-image-policy.mjs';
import { useGeofence } from '../../hooks/useGeofence';
import { useDeviceCamera } from '../../hooks/useDeviceCamera';
import { useLiveClock } from '../../hooks/useLiveClock';
import { useApp } from '../../../context/AppContext';
import { cameraSnapshotService } from '../../../services/cameraSnapshotService';
import { nativeFileCaptureService } from '../../../services/nativeFileCaptureService';
import { notifyError } from '../../../services/notificationService';

import '../../../styles/common/CameraCapture.css';
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
  buttonLabel = 'Ambil foto',
  policyValues = null,
}) => {
  const canvasRef = useRef(null);
  const [cameraRequested, setCameraRequested] = useState(false);
  const { user, settings, incidents } = useApp();
  const inputPolicy = cameraInputPolicy((policyValues || settings).CAMERA_INPUT_MODE);
  const evidenceValues = policyValues || settings;
  const [fileError, setFileError] = useState('');

  // Only the current account’s administrator-configured exception permits bypass.
  const hasException = (incidents || []).some(
    (r) =>
      r.type === 'UNLOCK_REQUEST' &&
      r.outletId === outletId &&
      r.requestedBy === user?.id &&
      r.status === 'APPROVED' &&
      ['BOTH', 'GEOFENCE'].includes(r.kind || 'BOTH') &&
      new Date(r.expiresAt) > new Date() &&
      (r.remainingVisits == null || r.remainingVisits > 0)
  );
  const isBypassUser = hasException || settings.ATTENDANCE_GEOFENCE_BYPASS_ALLOWED === true;

  // 1. Dedicated Live Clock Hook
  const { currentTime } = useLiveClock();

  // 2. Dedicated Device Camera Stream Hook
  const { videoRef, facingMode, cameraActive, cameraError, stopCamera, toggleFacingMode } =
    useDeviceCamera(
      facingModeDefault,
      inputPolicy.live && !capturedPhoto && (photoRequired || cameraRequested)
    );

  // 3. Dedicated GPS & Geofence Hook
  const { userLocation, gpsError, isGpsLocked, refreshGpsLocation, isWithinGeofence } = useGeofence(
    targetLat,
    targetLng,
    maxRadiusMeters,
    requireGps
  );

  useEffect(() => {
    if (onLocationChange) onLocationChange(isGpsLocked ? userLocation : null);
  }, [userLocation, isGpsLocked, onLocationChange]);

  const geofenceResult = isWithinGeofence();
  const isOutsideRadius = Boolean(
    requireGps &&
    targetLat != null &&
    targetLng != null &&
    geofenceResult &&
    !geofenceResult.isInside
  );
  const isBlockedByGeofence = enforceGeofence && isOutsideRadius && !isBypassUser;

  const guardCameraCapture = (missingGpsMsg) => {
    if (requireGps && !isGpsLocked) {
      setFileError(missingGpsMsg);
      notifyError(missingGpsMsg);
      return false;
    }
    if (isBlockedByGeofence) {
      const msg = `Presensi Ditolak! Posisi Anda (${geofenceResult?.distanceMeters ?? 0}m) berada di luar radius toko (${maxRadiusMeters}m). Harap dekati lokasi fisik toko untuk melakukan presensi.`;
      setFileError(msg);
      notifyError(msg);
      return false;
    }
    return true;
  };

  // Capture snapshot handler using cameraSnapshotService
  const handleCaptureSnapshot = () => {
    if (
      !guardCameraCapture('GPS belum terdeteksi. Pastikan GPS aktif dan izin lokasi diizinkan.')
    ) {
      return;
    }

    const dataUrl = cameraSnapshotService.captureWithWatermark({
      videoElement: videoRef.current,
      canvasElement: canvasRef.current,
      facingMode,
      userLocation,
      outletName,
      outputMime: `image/${evidenceImageFormats(evidenceValues.EVIDENCE_IMAGE_FORMATS)[0].toLowerCase()}`,
    });

    if (dataUrl) {
      const error = evidenceImageError(dataUrl, evidenceValues);
      if (error) {
        setFileError(error);
        return;
      }
      setFileError('');
      stopCamera();
      onCapture(dataUrl, userLocation);
    }
  };

  // Fallback native file capture handler with automatic compression before max-KB check
  const handleNativeFileInput = async (e) => {
    if (!inputPolicy.native) return;
    setFileError('');
    if (!guardCameraCapture('GPS belum terdeteksi. Harap aktifkan izin lokasi.')) {
      return;
    }

    const file = e.target.files?.[0];
    const maxKb = evidenceValues.EVIDENCE_IMAGE_MAX_KB ?? 2000;
    const preferredMime = `image/${evidenceImageFormats(evidenceValues.EVIDENCE_IMAGE_FORMATS)[0].toLowerCase()}`;
    let dataUrl;
    try {
      dataUrl = await nativeFileCaptureService.readFileAsDataUrl(file);
      if (dataUrl && file?.size > maxKb * 1024) {
        dataUrl = await cameraSnapshotService.compressDataUrl(dataUrl, {
          maxWidth: 1600,
          quality: 0.78,
          outputMime: preferredMime,
        });
      }
    } catch (error) {
      setFileError(error.message);
      return;
    } finally {
      e.target.value = '';
    }
    if (dataUrl) {
      const error = evidenceImageError(dataUrl, evidenceValues);
      if (error) {
        setFileError(error);
        return;
      }
      stopCamera();
      onCapture(dataUrl, userLocation);
    }
  };

  const handleRetakePhoto = () => {
    onRetake();
    setCameraRequested(true);
  };

  return (
    <div className="camera-capture">
      <canvas ref={canvasRef} className="hidden" />
      {fileError && (
        <p role="alert" className="app-error">
          {fileError}
        </p>
      )}

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
      ) : !inputPolicy.live ? (
        <p className="camera-note">
          Gunakan kamera perangkat di bawah. {photoRequired ? 'Foto wajib dilampirkan.' : ''}
        </p>
      ) : photoRequired || cameraRequested ? (
        <div className="camera-viewport">
          <CameraLiveVideoFeed
            videoRef={videoRef}
            facingMode={facingMode}
            cameraActive={cameraActive}
            cameraError={cameraError}
          />

          <CameraErrorDisplay
            allowNative={inputPolicy.native}
            allowUpload={inputPolicy.upload}
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
      ) : (
        <div className="camera-note">
          <p>Anda dapat melanjutkan tanpa membuka kamera.</p>
          <button type="button" className="app-button" onClick={() => setCameraRequested(true)}>
            Tambahkan foto
          </button>
        </div>
      )}

      {/* 3. Action Capture Button & Fallback */}
      {!capturedPhoto && (photoRequired || cameraRequested || !inputPolicy.live) && (
        <div className="camera-actions">
          {inputPolicy.live && (
            <CameraCaptureButton
              requireGps={requireGps}
              isGpsLocked={isGpsLocked}
              isBlockedByGeofence={isBlockedByGeofence}
              distanceMeters={geofenceResult?.distanceMeters ?? 0}
              maxRadiusMeters={maxRadiusMeters}
              onCapture={handleCaptureSnapshot}
              label={buttonLabel}
            />
          )}
          {inputPolicy.native && (
            <CameraNativeFileTrigger
              allowUpload={inputPolicy.upload}
              facingMode={facingMode}
              requireGps={requireGps}
              isGpsLocked={isGpsLocked}
              onNativeFileInput={handleNativeFileInput}
            />
          )}
        </div>
      )}
    </div>
  );
};
