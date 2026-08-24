import React, { useState } from 'react';
import { LuFileText, LuCamera, LuCheck, LuRefreshCw, LuShieldCheck } from 'react-icons/lu';
import { IdCardCameraModal } from './IdCardCameraModal';

/**
 * TaxLegalSection Component
 * Single Responsibility: Manage tax status (PKP vs Non-PKP) and strictly camera-only KTP / NPWP capture.
 */
export const TaxLegalSection = ({
  taxType,
  taxNumber,
  taxName,
  taxAddress,
  taxDocumentUrl,
  outletName = '',
  division = 'BELFOODS',
  onChange,
}) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const cardTypeLabel = taxType === 'PKP' ? 'NPWP' : 'KTP';

  return (
    <div className="outlet-reg-section-card">
      <div className="outlet-reg-section-title">
        <LuFileText className="text-primary" />
        <span>3. Status Pajak & Legalitas</span>
      </div>
      <div className="space-y-4">
        {/* Toggle PKP vs NON_PKP */}
        <div className="grid grid-cols-2 gap-3">
          <div
            onClick={() => onChange('taxType', 'PKP')}
            className={`outlet-reg-radio-card justify-center ${
              taxType === 'PKP' ? 'active' : ''
            }`}
          >
            <input
              type="radio"
              checked={taxType === 'PKP'}
              onChange={() => {}}
              className="text-primary"
            />
            <span className="font-extrabold text-xs">PKP (Wajib Pajak)</span>
          </div>
          <div
            onClick={() => onChange('taxType', 'NON_PKP')}
            className={`outlet-reg-radio-card justify-center ${
              taxType === 'NON_PKP' ? 'active' : ''
            }`}
          >
            <input
              type="radio"
              checked={taxType === 'NON_PKP'}
              onChange={() => {}}
              className="text-primary"
            />
            <span className="font-extrabold text-xs">NON PKP (KTP/Personal)</span>
          </div>
        </div>

        {taxType === 'PKP' ? (
          <div className="p-3 bg-surface-container-low rounded-xl border border-border-glass space-y-3">
            <div>
              <label className="outlet-reg-label">NO. NPWP</label>
              <input
                type="text"
                value={taxNumber}
                onChange={(e) => onChange('taxNumber', e.target.value)}
                className="outlet-reg-input font-mono text-xs"
                placeholder="00.000.000.0-000.000"
              />
            </div>
            <div>
              <label className="outlet-reg-label">NAMA NPWP</label>
              <input
                type="text"
                value={taxName}
                onChange={(e) => onChange('taxName', e.target.value)}
                className="outlet-reg-input text-xs"
                placeholder="Nama badan/wajib pajak sesuai NPWP"
              />
            </div>
            <div>
              <label className="outlet-reg-label">ALAMAT NPWP</label>
              <input
                type="text"
                value={taxAddress}
                onChange={(e) => onChange('taxAddress', e.target.value)}
                className="outlet-reg-input text-xs"
                placeholder="Alamat terdaftar di NPWP"
              />
            </div>
          </div>
        ) : (
          <div className="p-3 bg-surface-container-low rounded-xl border border-border-glass space-y-3">
            <div>
              <label className="outlet-reg-label">NIK (NO. KTP)</label>
              <input
                type="text"
                value={taxNumber}
                onChange={(e) => onChange('taxNumber', e.target.value)}
                className="outlet-reg-input font-mono text-xs"
                placeholder="327701xxxxxxxxxx"
              />
            </div>
            <div>
              <label className="outlet-reg-label">NAMA LENGKAP KTP</label>
              <input
                type="text"
                value={taxName}
                onChange={(e) => onChange('taxName', e.target.value)}
                className="outlet-reg-input text-xs"
                placeholder="Nama sesuai KTP pemilik"
              />
            </div>
            <div>
              <label className="outlet-reg-label">ALAMAT KTP</label>
              <input
                type="text"
                value={taxAddress}
                onChange={(e) => onChange('taxAddress', e.target.value)}
                className="outlet-reg-input text-xs"
                placeholder="Alamat sesuai KTP"
              />
            </div>
          </div>
        )}

        {/* Strictly Hardware Camera-Only KTP / NPWP Capture */}
        <div className="p-3 bg-surface-container rounded-xl border border-border-glass space-y-2">
          <div className="flex items-center justify-between">
            <label className="outlet-reg-label m-0 flex items-center gap-1.5 text-on-surface">
              <LuShieldCheck className="text-teal-600 dark:text-teal-400" />
              FOTO DOKUMEN {cardTypeLabel} (KAMERA LANGSUNG)
            </label>
            {taxDocumentUrl ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <LuCheck /> Dokumen Terlampir
              </span>
            ) : (
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                Wajib via Kamera
              </span>
            )}
          </div>

          {taxDocumentUrl ? (
            <div className="space-y-2">
              <div className="relative w-full h-36 rounded-xl overflow-hidden border border-border-glass bg-black flex items-center justify-center">
                <img
                  src={taxDocumentUrl}
                  alt={`Dokumen ${cardTypeLabel}`}
                  className="w-full h-full object-contain"
                />
                <div className="absolute bottom-2 left-2 bg-black/75 backdrop-blur-xs text-white px-2 py-0.5 rounded text-[10px] font-mono">
                  {cardTypeLabel} • Terverifikasi Kamera
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-98"
              >
                <LuRefreshCw className="text-xs" /> Ambil Ulang Kamera {cardTypeLabel}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsCameraOpen(true)}
              className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
            >
              <LuCamera className="text-base" /> Buka Kamera {cardTypeLabel}
            </button>
          )}

          <p className="text-[10px] text-on-surface-variant m-0 italic">
            * Pengambilan foto dokumen {cardTypeLabel} wajib langsung dari kamera perangkat fisik (tanpa upload file).
          </p>
        </div>
      </div>

      {/* Live Hardware Camera Modal */}
      <IdCardCameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(capturedBase64) => {
          onChange('taxDocumentUrl', capturedBase64);
        }}
        cardType={cardTypeLabel}
        outletName={outletName}
        division={division}
      />
    </div>
  );
};
