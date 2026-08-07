/**
 * cameraSnapshotService
 * Single Responsibility: Capture frame from HTML5 video onto HTML5 canvas with GPS & timestamp watermark.
 */
export const cameraSnapshotService = {
  /**
   * Captures snapshot from video, draws watermark, and returns base64 DataURL
   */
  captureWithWatermark: ({ videoElement, canvasElement, facingMode, userLocation, outletName = '' }) => {
    if (!videoElement || !canvasElement) return null;

    const width = videoElement.videoWidth || 640;
    const height = videoElement.videoHeight || 480;

    canvasElement.width = width;
    canvasElement.height = height;

    const ctx = canvasElement.getContext('2d');
    if (!ctx) return null;

    // Flip horizontally if front selfie camera for realistic mirror output
    if (facingMode === 'user') {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(videoElement, 0, 0, width, height);

    // Reset transform for drawing watermark
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Draw Watermark Overlay Banner at bottom
    const barHeight = Math.max(48, Math.round(height * 0.12));
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, height - barHeight, width, barHeight);

    // Primary Text (GPS Coordinates & Accuracy)
    ctx.fillStyle = '#10b981'; // Emerald
    ctx.font = `bold ${Math.max(11, Math.round(barHeight * 0.28))}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const gpsText = userLocation
      ? `GPS: ${userLocation.lat.toFixed(6)}, ${userLocation.lng.toFixed(6)} (±${userLocation.accuracy}m)`
      : 'GPS: NOT DETECTED';
    ctx.fillText(gpsText, 14, height - barHeight + 8);

    // Secondary Text (Brand, Outlet, Date, Time)
    ctx.fillStyle = '#ffffff';
    ctx.font = `normal ${Math.max(10, Math.round(barHeight * 0.24))}px sans-serif`;

    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('id-ID');
    const infoText = `SINAR ANUGRAH • ${outletName ? outletName + ' • ' : ''}${dateStr} ${timeStr} WIB`;
    ctx.fillText(infoText, 14, height - barHeight + 26);

    return canvasElement.toDataURL('image/jpeg', 0.85);
  },
};
