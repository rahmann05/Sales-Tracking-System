import React from 'react';
import { LuCheck, LuCamera, LuRefreshCw, LuShieldCheck } from "react-icons/lu";
export function RegistrationTaxSection({
  cardTypeLabel,
  formData,
  setIsKtpCameraOpen,
  settings,
  updateField
}) {
  return <div className="border border-slate-700/80 rounded-xl overflow-hidden divide-y divide-slate-700/60 bg-surface">
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-700/60">
          {/* Sisi Kiri: PKP */}
          <div onClick={() => updateField('taxType', 'PKP')} className={`p-3 space-y-2 cursor-pointer transition-colors ${formData.taxType === 'PKP' ? 'bg-primary/5' : 'opacity-85'}`}>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-black cursor-pointer">
                <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${formData.taxType === 'PKP' ? 'border-primary bg-primary text-white' : 'border-slate-500 bg-surface'}`}>
                  {formData.taxType === 'PKP' && <LuCheck className="text-xs" />}
                </div>
                <span>PKP (Wajib Pajak Badan)</span>
              </label>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-24 text-on-surface-variant font-bold">NO. NPWP :</span>
                <input type="text" value={formData.taxType === 'PKP' ? formData.taxNumber : ''} onChange={e => updateField('taxNumber', e.target.value)} disabled={formData.taxType !== 'PKP'} className="flex-1 px-1.5 py-0.5 font-mono text-xs bg-transparent border-b border-slate-400 outline-none" placeholder="00.000.000.0-000.000" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-24 text-on-surface-variant font-bold">NAMA NPWP :</span>
                <input type="text" value={formData.taxType === 'PKP' ? formData.taxName : ''} onChange={e => updateField('taxName', e.target.value)} disabled={formData.taxType !== 'PKP'} className="flex-1 px-1.5 py-0.5 text-xs bg-transparent border-b border-slate-400 outline-none" placeholder="Nama badan usaha" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-24 text-on-surface-variant font-bold">ALAMAT NPWP :</span>
                <input type="text" value={formData.taxType === 'PKP' ? formData.taxAddress : ''} onChange={e => updateField('taxAddress', e.target.value)} disabled={formData.taxType !== 'PKP'} className="flex-1 px-1.5 py-0.5 text-xs bg-transparent border-b border-slate-400 outline-none" placeholder="Alamat terdaftar di NPWP" />
              </div>
            </div>
          </div>

          {/* Sisi Kanan: NON PKP */}
          <div onClick={() => updateField('taxType', 'NON_PKP')} className={`p-3 space-y-2 cursor-pointer transition-colors ${formData.taxType === 'NON_PKP' ? 'bg-primary/5' : 'opacity-85'}`}>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-black cursor-pointer">
                <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${formData.taxType === 'NON_PKP' ? 'border-primary bg-primary text-white' : 'border-slate-500 bg-surface'}`}>
                  {formData.taxType === 'NON_PKP' && <LuCheck className="text-xs" />}
                </div>
                <span>NON PKP (KTP / Personal)</span>
              </label>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-24 text-on-surface-variant font-bold">NIK (KTP) :</span>
                <input type="text" value={formData.taxType === 'NON_PKP' ? formData.taxNumber : ''} onChange={e => updateField('taxNumber', e.target.value)} disabled={formData.taxType !== 'NON_PKP'} className="flex-1 px-1.5 py-0.5 font-mono text-xs bg-transparent border-b border-slate-400 outline-none" placeholder="327701xxxxxxxxxx" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-24 text-on-surface-variant font-bold">NAMA KTP :</span>
                <input type="text" value={formData.taxType === 'NON_PKP' ? formData.taxName : ''} onChange={e => updateField('taxName', e.target.value)} disabled={formData.taxType !== 'NON_PKP'} className="flex-1 px-1.5 py-0.5 text-xs bg-transparent border-b border-slate-400 outline-none" placeholder="Nama sesuai KTP pemilik" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-24 text-on-surface-variant font-bold">ALAMAT KTP :</span>
                <input type="text" value={formData.taxType === 'NON_PKP' ? formData.taxAddress : ''} onChange={e => updateField('taxAddress', e.target.value)} disabled={formData.taxType !== 'NON_PKP'} className="flex-1 px-1.5 py-0.5 text-xs bg-transparent border-b border-slate-400 outline-none" placeholder="Alamat sesuai KTP" />
              </div>
            </div>
          </div>
        </div>

        {/* Lampiran Foto Dokumen KTP/NPWP via Kamera Langsung */}
        <div className="p-2.5 bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <LuShieldCheck className="text-teal-600 text-base" />
            <span className="font-bold text-on-surface">
              Lampiran Foto Dokumen {cardTypeLabel} ({settings.CUSTOMER_REG_REQUIRE_TAX_DOCUMENT ? 'wajib kamera' : 'opsional'}):
            </span>
          </div>

          <div className="flex items-center gap-2">
            {formData.taxDocumentUrl ? <div className="flex items-center gap-2">
                <span className="text-[11px] font-black text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                  <LuCheck /> {cardTypeLabel} Terlampir
                </span>
                <button type="button" onClick={() => setIsKtpCameraOpen(true)} className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-[11px] font-bold flex items-center gap-1">
                  <LuRefreshCw className="text-[10px]" /> Foto Ulang
                </button>
              </div> : <button type="button" onClick={() => setIsKtpCameraOpen(true)} className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-black flex items-center gap-1.5 shadow-sm active:scale-95">
                <LuCamera className="text-sm" /> Buka Kamera {cardTypeLabel}
              </button>}
          </div>
        </div>
      </div>;
}
