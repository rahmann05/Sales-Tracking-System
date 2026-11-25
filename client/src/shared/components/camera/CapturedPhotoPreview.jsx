import React from 'react';
import { LuRefreshCw } from 'react-icons/lu';

/**
 * CapturedPhotoPreview Component
 * Single Responsibility: Display photo preview after snapshot is taken, with retake action.
 */
export const CapturedPhotoPreview = ({ capturedPhoto, onRetake }) => {
  if (!capturedPhoto) return null;

  return (
    <div className="camera-viewport">
      <img src={capturedPhoto} alt="Foto bukti yang diambil" />
      <button type="button" onClick={onRetake} className="camera-overlay-button">
        <LuRefreshCw aria-hidden="true" />
        Foto ulang
      </button>
      <p className="camera-attached">
        <i className="camera-dot" aria-hidden="true" />
        Foto terlampir
      </p>
    </div>
  );
};
