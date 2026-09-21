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
}) => {
  return (
    <div className="flex justify-center">
      <label
        className={`text-[11px] flex items-center gap-1 underline transition-colors ${
          requireGps && !isGpsLocked
            ? 'text-slate-500 cursor-not-allowed'
            : 'text-on-surface-variant hover:text-primary cursor-pointer'
        }`}
      >
        <input
          type="file"
          accept="image/*"
          capture={facingMode === 'user' ? 'user' : 'environment'}
          disabled={requireGps && !isGpsLocked}
          onChange={onNativeFileInput}
          className="hidden"
        />
        <span>Atau gunakan aplikasi kamera bawaan HP</span>
      </label>
    </div>
  );
};
