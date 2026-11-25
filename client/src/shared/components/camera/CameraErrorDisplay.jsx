import React from 'react';
import { CameraNativeFileTrigger } from './CameraNativeFileTrigger';

/**
 * CameraErrorDisplay Component
 * Single Responsibility: Render error state when device camera cannot be accessed, with native file fallback trigger.
 */
export const CameraErrorDisplay = ({
  cameraError,
  facingMode,
  requireGps,
  isGpsLocked,
  onNativeFileInput,
  allowNative = true,
  allowUpload = false,
}) => {
  if (!cameraError) return null;

  return (
    <div className="camera-error" role="alert">
      <div>
        <h4>Kamera tidak dapat dibuka</h4>
        <p>{cameraError}</p>
      </div>
      {allowNative ? (
        <CameraNativeFileTrigger
          facingMode={facingMode}
          requireGps={requireGps}
          isGpsLocked={isGpsLocked}
          onNativeFileInput={onNativeFileInput}
          allowUpload={allowUpload}
        />
      ) : (
        <p>Aturan formulir mewajibkan kamera langsung. Periksa izin kamera pada browser.</p>
      )}
    </div>
  );
};
