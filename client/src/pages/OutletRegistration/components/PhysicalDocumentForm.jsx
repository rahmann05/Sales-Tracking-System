import { RegistrationIdentitySection } from './RegistrationIdentitySection';
import { RegistrationLocationSection } from './RegistrationLocationSection';
import { RegistrationTaxSection } from './RegistrationTaxSection';
import { RegistrationTerritorySection } from './RegistrationTerritorySection';
import { RegistrationChannelSection } from './RegistrationChannelSection';
import { RegistrationPaymentSection } from './RegistrationPaymentSection';
import { RegistrationVisitSection } from './RegistrationVisitSection';
import React, { useRef, useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { LuSend } from "react-icons/lu";
import { IdCardCameraModal } from './IdCardCameraModal';
import { OutletCameraModal } from './OutletCameraModal';
import { BusinessCodeInput } from '../../../shared/components/common/BusinessCodeInput';
const LOCATION_OPTIONS = [{
  id: 'DALAM_PASAR',
  label: 'DALAM PASAR'
}, {
  id: 'PINGGIR_JALAN',
  label: 'PINGGIR JALAN'
}, {
  id: 'DALAM_GANG',
  label: 'DALAM GANG'
}, {
  id: 'KOMPLEK_PERUMAHAN',
  label: 'KOMPLEK / PERUMAHAN'
}];
const MT_SUB_CHANNELS = [{
  id: 'HYPERMARKET',
  label: 'HYPERMARKET'
}, {
  id: 'DRUGSTORE',
  label: 'DRUGSTORE'
}, {
  id: 'NAT_SUPERMARKET',
  label: 'NAT SUPERMARKET'
}, {
  id: 'LOKAL_SUPERMARKET',
  label: 'LOKAL SUPERMARKET'
}, {
  id: 'CHAIN_MINIMARKET',
  label: 'CHAIN MINIMARKET'
}, {
  id: 'LOKAL_MINIMARKET',
  label: 'LOKAL MINIMARKET'
}, {
  id: 'PERKULAKAN',
  label: 'PERKULAKAN'
}];
const GT_SUB_CHANNELS = [{
  id: 'KOPERASI',
  label: 'KOPERASI'
}, {
  id: 'BIDAN',
  label: 'BIDAN'
}, {
  id: 'OUTLET_MOTORIS',
  label: 'OUTLET MOTORIS'
}, {
  id: 'APOTIK',
  label: 'APOTIK'
}, {
  id: 'GROSIR',
  label: 'GROSIR'
}, {
  id: 'TOKO_RETAIL',
  label: 'TOKO / RETAIL'
}, {
  id: 'BABY_SHOP',
  label: 'BABY SHOP / TOKO SUSU'
}];
const TIERS = [{
  id: 'BRONZE_A',
  label: 'BRONZE A'
}, {
  id: 'BRONZE_B',
  label: 'BRONZE B'
}, {
  id: 'BRONZE_C',
  label: 'BRONZE C'
}];
const DAYS_LIST = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];

/**
 * PhysicalDocumentForm Component
 * Single Responsibility: Render the exact official physical paper form sheet layout (Form Registrasi Outlet)
 * with Google Place validation placed directly below outlet name & identity section.
 */
export const PhysicalDocumentForm = ({
  formData,
  updateField,
  isSearchingPlace,
  placeSearchResults,
  verifiedPlace,
  searchGooglePlaces,
  handleSelectGooglePlace,
  handleUnlockGooglePlace,
  isLocating,
  handleDetectGPS,
  toggleDay,
  onReset,
  isSubmitting = false
}) => {
  const {
    clusters,
    divisions,
    settings
  } = useApp();
  const [isKtpCameraOpen, setIsKtpCameraOpen] = useState(false);
  const [isOutletCameraOpen, setIsOutletCameraOpen] = useState(false);
  const debounceTimerRef = useRef(null);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const handleNameChange = e => {
    const val = e.target.value;
    updateField('name', val);
    setHasSearched(false);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (val.trim().length >= 2) {
      setIsDebouncing(true);
      debounceTimerRef.current = setTimeout(async () => {
        setIsDebouncing(false);
        if (searchGooglePlaces) {
          await searchGooglePlaces(val.trim());
          setHasSearched(true);
        }
      }, 3000);
    } else {
      setIsDebouncing(false);
      setHasSearched(false);
    }
  };
  const cardTypeLabel = formData.taxType === 'PKP' ? 'NPWP' : 'KTP';
  return <div className="bg-surface border-2 border-slate-700/80 rounded-2xl shadow-xl p-4 sm:p-7 max-w-5xl mx-auto space-y-4 text-on-surface">
      {/* ─── Header Form Fisik Resmi ───────────────────────────────────────────── */}
      <div className="border-b-2 border-slate-700/80 pb-3 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="font-black text-sm tracking-wider uppercase text-on-surface">
            CV SINAR ANUGRAH
          </div>
          <div className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase">
            FMCG DISTRIBUTOR
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-base sm:text-lg font-black tracking-tight uppercase border-b-2 border-slate-700/80 pb-0.5 px-3">
            FORM REGISTRASI OUTLET
          </h2>
          <span className="text-[10px] font-mono text-on-surface-variant">
            DOKUMEN PENGAJUAN RESMI
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] font-bold text-on-surface-variant block">DIVISI:</span>
            <span className="text-xs font-black text-primary px-2 py-0.5 bg-primary/10 rounded border border-primary/30">
              {formData.divisionName || formData.division || '-'}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Baris Divisi & Cabang Operasional ──────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold bg-surface-container-low p-2.5 rounded-xl border border-border-glass">
        <div className="flex items-center gap-2">
          <span className="w-20 text-on-surface-variant shrink-0">DIVISI :</span>
          <select value={formData.division || formData.divisionName || ''} onChange={e => {
          const selectedDiv = divisions.find(d => d.name === e.target.value);
          updateField('division', e.target.value);
          updateField('divisionName', e.target.value);
          if (selectedDiv) updateField('divisionId', selectedDiv.id);
        }} className="flex-1 px-2.5 py-1 bg-surface font-black text-xs rounded-lg border border-border-glass text-primary focus:border-primary outline-none cursor-pointer">
            {divisions.length > 0 ? divisions.map(div => <option key={div.id} value={div.name}>{div.name}</option>) :
          // Fallback sementara jika divisions belum termuat
          <>
                <option value="BELFOODS">BELFOODS</option>
                <option value="MIX">MIX</option>
              </>}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-20 text-on-surface-variant shrink-0">CABANG :</span>
          <input type="text" value={formData.branch} onChange={e => updateField('branch', e.target.value)} className="flex-1 px-2.5 py-1 bg-surface font-bold text-xs rounded-lg border border-border-glass focus:border-primary outline-none" placeholder="PADALARANG" />
        </div>
      </div>

      <BusinessCodeInput entity="NOO" value={formData.registrationCode || ''} onChange={value => updateField('registrationCode', value)} disabled={isSubmitting} />
      {/* ─── BOX 1: IDENTITAS OUTLET ─────────────────────────────────────────── */}
      <RegistrationIdentitySection LOCATION_OPTIONS={LOCATION_OPTIONS} formData={formData} handleNameChange={handleNameChange} handleSelectGooglePlace={handleSelectGooglePlace} handleUnlockGooglePlace={handleUnlockGooglePlace} hasSearched={hasSearched} isDebouncing={isDebouncing} isSearchingPlace={isSearchingPlace} placeSearchResults={placeSearchResults} setHasSearched={setHasSearched} settings={settings} updateField={updateField} verifiedPlace={verifiedPlace} />

      {/* ─── BOX 2: VALIDASI GOOGLE PLACE & TITIK GPS (DI BAWAH NAMA OUTLET) ─── */}
      <RegistrationLocationSection formData={formData} handleDetectGPS={handleDetectGPS} isLocating={isLocating} setIsOutletCameraOpen={setIsOutletCameraOpen} settings={settings} verifiedPlace={verifiedPlace} />

      {/* ─── BOX 3: JENIS PAJAK & DOKUMEN KTP/NPWP ────────────────────────────── */}
      <RegistrationTaxSection cardTypeLabel={cardTypeLabel} formData={formData} setIsKtpCameraOpen={setIsKtpCameraOpen} settings={settings} updateField={updateField} />

      {/* ─── BOX 4: AREA & WILAYAH ────────────────────────────────────────────── */}
      <RegistrationTerritorySection clusters={clusters} formData={formData} updateField={updateField} />

      {/* ─── BOX 5: CHANNEL & SUB CHANNEL ─────────────────────────────────────── */}
      <RegistrationChannelSection GT_SUB_CHANNELS={GT_SUB_CHANNELS} MT_SUB_CHANNELS={MT_SUB_CHANNELS} TIERS={TIERS} formData={formData} updateField={updateField} />

      {/* ─── BOX 6: PAYMENT TERMS ─────────────────────────────────────────────── */}
      <RegistrationPaymentSection formData={formData} updateField={updateField} />

      {/* ─── BOX 7: KUNJUNGAN (CALL PLAN PJP) ─────────────────────────────────── */}
      <RegistrationVisitSection DAYS_LIST={DAYS_LIST} formData={formData} toggleDay={toggleDay} updateField={updateField} />

      {/* ─── BOX 8: MAPPING PATOKAN FISIK ────────────────────────────────────── */}
      <div className="border border-slate-700/80 rounded-xl overflow-hidden p-3.5 bg-surface space-y-2 text-xs">
        <label className="font-black block text-sm">Mapping Lokasi :</label>
        <textarea rows={6} value={formData.mappingLocation} onChange={e => updateField('mappingLocation', e.target.value)} className="w-full min-h-[140px] p-3 text-xs bg-transparent border border-slate-400 rounded-lg focus:border-primary outline-none resize-y" placeholder="Tuliskan deskripsi patokan fisik, ancer-ancer lokasi, ciri bangunan, atau petunjuk jalan menuju toko secara rinci..." />
      </div>

      {/* ─── Tombol Aksi Submit & Reset Terpadu di Dokumen ─────────────────────── */}
      <div className="pt-2 border-t-2 border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="text-[11px] text-on-surface-variant font-bold">
          * Pastikan seluruh data fisik outlet dan foto kamera telah sesuai sebelum mengajukan.
        </span>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button type="button" onClick={onReset} className="px-4 py-2.5 rounded-xl border-2 border-slate-500 hover:bg-surface-container font-bold text-xs transition-all cursor-pointer">
            Reset Formulir
          </button>
          <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50">
            <LuSend className="text-sm" />
            <span>{isSubmitting ? 'Mengirim Pengajuan...' : 'Ajukan Registrasi Outlet'}</span>
          </button>
        </div>
      </div>

      {/* ─── Hardware Camera Modals ───────────────────────────────────────────── */}
      <IdCardCameraModal isOpen={isKtpCameraOpen} onClose={() => setIsKtpCameraOpen(false)} onCapture={photoDataUrl => updateField('taxDocumentUrl', photoDataUrl)} cardType={cardTypeLabel} outletName={formData.name} division={formData.division} />

      <OutletCameraModal isOpen={isOutletCameraOpen} onClose={() => setIsOutletCameraOpen(false)} onCapture={photoDataUrl => updateField('photoUrl', photoDataUrl)} outletName={formData.name} latitude={formData.latitude} longitude={formData.longitude} division={formData.division} />
    </div>;
};
