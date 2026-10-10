import React from 'react';
import {CameraNativeFileTrigger} from './CameraNativeFileTrigger';
import { FiAlertCircle } from 'react-icons/fi';

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
  allowNative=true,
  allowUpload=false,
}) => {
  if (!cameraError) return null;

  return (
    <div className="absolute inset-0 p-5 bg-slate-900/95 flex flex-col items-center justify-center text-center gap-3">
      <FiAlertCircle className="text-3xl text-rose-500" />
      <div className="space-y-1 max-w-xs">
        <p className="text-xs font-bold text-white">Gagal Membuka Kamera</p>
        <p className="text-[11px] text-slate-400">{cameraError}</p>
      </div>
      {allowNative?<CameraNativeFileTrigger facingMode={facingMode} requireGps={requireGps} isGpsLocked={isGpsLocked} onNativeFileInput={onNativeFileInput} allowUpload={allowUpload}/>:<p className="text-xs text-white">Aturan formulir mewajibkan kamera langsung. Periksa izin kamera pada browser.</p>}
    </div>
  );
};
