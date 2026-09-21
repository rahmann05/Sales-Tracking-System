import React from 'react';
import { LuRefreshCw } from 'react-icons/lu';

/**
 * CameraLiveVideoFeed Component
 * Single Responsibility: Render the HTML5 <video> element connected to device camera stream.
 */
export const CameraLiveVideoFeed = ({ videoRef, facingMode, cameraActive, cameraError }) => {
  return (
    <>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''} ${
          cameraActive ? 'opacity-100' : 'opacity-0'
        } transition-opacity duration-300`}
      />

      {/* Loading camera state */}
      {!cameraError && !cameraActive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2">
          <LuRefreshCw className="text-2xl animate-spin text-primary" />
          <span className="text-xs font-medium">Mengakses Kamera Device...</span>
        </div>
      )}
    </>
  );
};
