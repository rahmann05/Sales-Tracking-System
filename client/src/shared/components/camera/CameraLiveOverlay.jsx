import React from 'react';
import { LuSwitchCamera } from 'react-icons/lu';

/**
 * CameraLiveOverlay Component
 * Single Responsibility: Live camera overlays including timestamp, GPS status, and camera switcher button.
 */
export const CameraLiveOverlay = ({
  cameraActive,
  onToggleFacingMode,
  currentTime,
  isGpsLocked,
}) => {
  if (!cameraActive) return null;

  return (
    <>
      <button
        type="button"
        onClick={onToggleFacingMode}
        title="Ganti kamera depan / belakang"
        aria-label="Ganti kamera depan atau belakang"
        className="camera-overlay-button"
      >
        <LuSwitchCamera aria-hidden="true" />
      </button>
      <div className="camera-caption">
        <span>{currentTime} WIB</span>
        <span>
          <i className="camera-dot" aria-hidden="true" />
          {isGpsLocked ? 'GPS terkunci' : 'Mencari GPS'}
        </span>
      </div>
    </>
  );
};
