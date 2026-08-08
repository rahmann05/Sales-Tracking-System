import { useState, useRef, useCallback, useEffect } from 'react';
import { deviceDetectionService } from '../services/deviceDetectionService';

/**
 * useDeviceCamera Hook
 * Single Responsibility: Manage browser camera media stream lifecycle with auto-detected device constraints.
 */
export const useDeviceCamera = (facingModeDefault = 'user', autoStart = true) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [facingMode, setFacingMode] = useState(facingModeDefault);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  // Cleanly stops all active camera tracks
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          // ignore
        }
      });
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Starts device camera with auto-detected constraints
  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Kamera tidak didukung oleh browser ini. Silakan gunakan tombol kamera native.');
      return;
    }

    try {
      const autoConstraints = deviceDetectionService.getAutoDetectedCameraConstraints(facingMode);
      const constraints = {
        video: autoConstraints,
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('muted', 'true');
        try {
          await videoRef.current.play();
        } catch (playErr) {
          if (playErr.name !== 'AbortError') {
            console.warn('[Camera] Play call handled:', playErr);
          }
        }
        setCameraActive(true);
      }
    } catch (err) {
      console.warn('[Camera] Auto constraint failed, attempting basic fallback:', err);
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = fallbackStream;
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          videoRef.current.setAttribute('playsinline', 'true');
          try {
            await videoRef.current.play();
          } catch (playErr) {
            if (playErr.name !== 'AbortError') {
              console.warn('[Camera] Fallback play call handled:', playErr);
            }
          }
          setCameraActive(true);
        }
      } catch (fallbackErr) {
        console.error('[Camera] Camera access failed:', fallbackErr);
        if (fallbackErr.name === 'NotAllowedError' || fallbackErr.name === 'PermissionDeniedError') {
          setCameraError('Izin akses kamera ditolak. Harap izinkan browser mengakses kamera.');
        } else if (fallbackErr.name === 'NotFoundError' || fallbackErr.name === 'DevicesNotFoundError') {
          setCameraError('Perangkat kamera (webcam/kamera HP) tidak ditemukan.');
        } else if (fallbackErr.name !== 'AbortError') {
          setCameraError('Gagal membuka kamera: ' + (fallbackErr.message || 'Error tidak diketahui'));
        }
      }
    }
  }, [facingMode, stopCamera]);

  useEffect(() => {
    if (autoStart) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [autoStart, startCamera, stopCamera]);

  const toggleFacingMode = useCallback(() => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  }, []);

  return {
    videoRef,
    facingMode,
    cameraActive,
    cameraError,
    startCamera,
    stopCamera,
    toggleFacingMode,
  };
};
