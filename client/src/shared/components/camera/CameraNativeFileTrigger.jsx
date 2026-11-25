import React from 'react';

/**
 * CameraNativeFileTrigger Component
 * Single Responsibility: Render the link/input trigger to use mobile system camera app.
 */
export const CameraNativeFileTrigger = ({
  facingMode,
  requireGps,
  isGpsLocked,
  onNativeFileInput,
  allowUpload = false,
}) => {
  const disabled = requireGps && !isGpsLocked;
  return (
    <label className="camera-link" aria-disabled={disabled}>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture={allowUpload ? undefined : facingMode === 'user' ? 'user' : 'environment'}
        disabled={disabled}
        onChange={onNativeFileInput}
      />
      <span>
        {allowUpload
          ? 'Pilih gambar atau gunakan kamera perangkat'
          : 'Gunakan aplikasi kamera bawaan HP'}
      </span>
    </label>
  );
};
