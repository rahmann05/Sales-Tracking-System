/**
 * deviceDetectionService
 * Single Responsibility: Auto-detect device environment (Mobile, Tablet, Desktop/Laptop)
 * and generate optimal adaptive camera resolution constraints.
 */
export const deviceDetectionService = {
  /**
   * Checks if current device is a mobile device (Android, iOS, etc.)
   */
  isMobileDevice: () => {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  },

  /**
   * Checks if device is in portrait orientation
   */
  isPortrait: () => {
    if (typeof window === 'undefined') return false;
    return window.innerHeight > window.innerWidth;
  },

  /**
   * Generates auto-detected optimal camera video constraints based on device hardware and viewport
   */
  getAutoDetectedCameraConstraints: (facingMode = 'user') => {
    const isMobile = deviceDetectionService.isMobileDevice();
    const isPortrait = deviceDetectionService.isPortrait();

    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 720;

    let idealWidth;
    let idealHeight;

    if (isMobile) {
      if (isPortrait) {
        // Mobile Portrait mode (Height > Width)
        idealWidth = Math.min(screenHeight, 1920);
        idealHeight = Math.min(screenWidth, 1080);
      } else {
        // Mobile Landscape mode
        idealWidth = Math.min(screenWidth, 1920);
        idealHeight = Math.min(screenHeight, 1080);
      }
    } else {
      // Laptop / Desktop Webcam
      idealWidth = Math.min(screenWidth, 1920);
      idealHeight = Math.min(screenHeight, 1080);
    }

    return {
      facingMode: { ideal: facingMode },
      width: { ideal: idealWidth },
      height: { ideal: idealHeight },
      aspectRatio: isMobile && isPortrait ? { ideal: 9 / 16 } : { ideal: 16 / 9 },
    };
  },
};
