import React from 'react';

/**
 * CameraLiveVideoFeed Component
 * Single Responsibility: Render the HTML5 <video> element connected to device camera stream.
 */
export const CameraLiveVideoFeed = ({ videoRef, facingMode, cameraActive, cameraError }) => (
  <>
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      style={{
        opacity: cameraActive ? 1 : 0,
        transform: facingMode === 'user' ? 'scaleX(-1)' : undefined,
      }}
    />
    {!cameraError && !cameraActive && <p className="camera-loading">Membuka kamera…</p>}
  </>
);
