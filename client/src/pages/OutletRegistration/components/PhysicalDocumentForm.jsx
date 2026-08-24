import React, { useRef, useState } from 'react';
import {
  LuCheck,
  LuLock,
  LuCamera,
  LuRefreshCw,
  LuClock,
  LuStar,
  LuMapPin,
  LuInfo,
  LuShieldCheck,
  LuNavigation,
  LuSend,
} from 'react-icons/lu';
import { GooglePlaceDetailCard } from './GooglePlaceDetailCard';
import { IdCardCameraModal } from './IdCardCameraModal';
import { OutletCameraModal } from './OutletCameraModal';

const LOCATION_OPTIONS = [
  { id: 'DALAM_PASAR', label: 'DALAM PASAR' },
  { id: 'PINGGIR_JALAN', label: 'PINGGIR JALAN' },
  { id: 'DALAM_GANG', label: 'DALAM GANG' },
  { id: 'KOMPLEK_PERUMAHAN', label: 'KOMPLEK / PERUMAHAN' },
];

const AREA_OPTIONS = [
  { id: 'CIMAHI', label: 'CIMAHI' },
  { id: 'KAB_BANDUNG_BARAT', label: 'KAB. BANDUNG BARAT' },
  { id: 'KAB_BANDUNG', label: 'KAB. BANDUNG' },
  { id: 'KOTA_BANDUNG', label: 'KOTA BANDUNG' },
];

const MT_SUB_CHANNELS = [
  { id: 'HYPERMARKET', label: 'HYPERMARKET' },
  { id: 'DRUGSTORE', label: 'DRUGSTORE' },
  { id: 'NAT_SUPERMARKET', label: 'NAT SUPERMARKET' },
  { id: 'LOKAL_SUPERMARKET', label: 'LOKAL SUPERMARKET' },
  { id: 'CHAIN_MINIMARKET', label: 'CHAIN MINIMARKET' },
  { id: 'LOKAL_MINIMARKET', label: 'LOKAL MINIMARKET' },
  { id: 'PERKULAKAN', label: 'PERKULAKAN' },
];

const GT_SUB_CHANNELS = [
  { id: 'KOPERASI', label: 'KOPERASI' },
  { id: 'BIDAN', label: 'BIDAN' },
  { id: 'OUTLET_MOTORIS', label: 'OUTLET MOTORIS' },
  { id: 'APOTIK', label: 'APOTIK' },
  { id: 'GROSIR', label: 'GROSIR' },
  { id: 'TOKO_RETAIL', label: 'TOKO / RETAIL' },
  { id: 'BABY_SHOP', label: 'BABY SHOP / TOKO SUSU' },
];

const TIERS = [
  { id: 'BRONZE_A', label: 'BRONZE A' },
  { id: 'BRONZE_B', label: 'BRONZE B' },
  { id: 'BRONZE_C', label: 'BRONZE C' },
];

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
  isSubmitting = false,
}) => {
  const [isKtpCameraOpen, setIsKtpCameraOpen] = useState(false);
  const [isOutletCameraOpen, setIsOutletCameraOpen] = useState(false);

  const debounceTimerRef = useRef(null);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleNameChange = (e) => {
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

  return (
    <div className="bg-surface border-2 border-slate-700/80 rounded-2xl shadow-xl p-4 sm:p-7 max-w-5xl mx-auto space-y-4 text-on-surface">
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
              {formData.division === 'BELFOODS' ? 'BELFOODS (BFI)' : formData.division}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Baris Divisi & Cabang Operasional ──────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold bg-surface-container-low p-2.5 rounded-xl border border-border-glass">
        <div className="flex items-center gap-2">
          <span className="w-20 text-on-surface-variant shrink-0">DIVISI :</span>
          <select
            value={formData.division}
            onChange={(e) => updateField('division', e.target.value)}
            className="flex-1 px-2.5 py-1 bg-surface font-black text-xs rounded-lg border border-border-glass text-primary focus:border-primary outline-none cursor-pointer"
          >
            <option value="UNICHARM">UNICHARM</option>
            <option value="BELFOODS">BELFOODS</option>
            <option value="GENERAL">GENERAL FMCG</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-20 text-on-surface-variant shrink-0">CABANG :</span>
          <input
            type="text"
            value={formData.branch}
            onChange={(e) => updateField('branch', e.target.value)}
            className="flex-1 px-2.5 py-1 bg-surface font-bold text-xs rounded-lg border border-border-glass focus:border-primary outline-none"
            placeholder="PADALARANG"
          />
        </div>
      </div>

      {/* ─── BOX 1: IDENTITAS OUTLET ─────────────────────────────────────────── */}
      <div className="border border-slate-700/80 rounded-xl overflow-hidden divide-y divide-slate-700/60 bg-surface">
        {/* Nama Outlet & Kode Outlet */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-700/60 p-2.5 items-center gap-2">
          <div className="md:col-span-2 relative">
            <div className="flex items-center gap-2">
              <span className="w-28 text-xs font-black shrink-0">NAMA OUTLET :</span>
              <div className="relative flex-1">
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleNameChange}
                  className="w-full px-2.5 py-1.5 text-xs font-bold bg-transparent border-b-2 border-slate-400 focus:border-primary outline-none"
                  placeholder="Ketik nama toko (otomatis cari Google dlm 3 detik)"
                />
                {(isDebouncing || isSearchingPlace) && (
                  <LuRefreshCw className="animate-spin text-primary absolute right-2 top-2 text-sm" />
                )}
              </div>
            </div>

            {/* Locked Place Chip */}
            {verifiedPlace && (
              <div className="mt-1.5 flex items-center justify-between text-[11px] bg-emerald-500/10 border border-emerald-500/30 rounded px-2 py-0.5 text-emerald-700 dark:text-emerald-400 font-bold">
                <span className="flex items-center gap-1">
                  <LuCheck /> Terkunci ke data Google Place: <u>{verifiedPlace.name}</u>
                </span>
                <button
                  type="button"
                  onClick={handleUnlockGooglePlace}
                  className="text-[10px] text-red-600 underline hover:text-red-700 cursor-pointer"
                >
                  Lepas Kunci
                </button>
              </div>
            )}

            {/* Dropdown Hasil Pencarian Google Place */}
            {placeSearchResults.length > 0 && !isSearchingPlace && !isDebouncing && (
              <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-surface rounded-xl border-2 border-primary shadow-2xl max-h-56 overflow-y-auto divide-y divide-border-glass">
                <div className="p-1.5 bg-primary/10 text-[10px] font-bold text-primary flex items-center justify-between">
                  <span>Pilih Tempat Resmi dari Google Places API (Radius &le; 100m):</span>
                  <span>{placeSearchResults.length} toko</span>
                </div>
                {placeSearchResults.map((place, idx) => (
                  <div
                    key={place.placeId || idx}
                    onClick={() => {
                      handleSelectGooglePlace(place);
                      setHasSearched(false);
                    }}
                    className="p-2.5 hover:bg-primary/10 cursor-pointer text-xs space-y-0.5"
                  >
                    <div className="font-extrabold text-on-surface flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <LuMapPin className="text-primary text-xs" /> {place.name}
                      </span>
                      {place.rating && (
                        <span className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5">
                          <LuStar className="fill-amber-500 text-amber-500 text-[10px]" /> {place.rating} ({place.userRatingsTotal || 1})
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-on-surface-variant line-clamp-1">
                      {place.address}
                    </div>
                    <div className="text-[9px] text-primary font-mono flex items-center gap-2">
                      <span>Jarak: {place.distanceMeters || '< 100'} m</span>
                      <span className="font-bold">{place.area}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Not Found Dropdown */}
            {hasSearched && placeSearchResults.length === 0 && !isSearchingPlace && !isDebouncing && formData.name?.trim()?.length >= 2 && !verifiedPlace && (
              <div className="absolute left-0 right-0 top-full mt-1 z-30 p-2.5 bg-surface rounded-xl border border-amber-500/40 shadow-xl flex items-start gap-2 text-xs">
                <LuInfo className="text-amber-500 text-sm shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-600">Toko &quot;{formData.name}&quot; Tidak Ditemukan di Google Places</strong>
                  <p className="text-[10px] text-on-surface-variant m-0">
                    Tidak terdaftar dalam radius 100m. Sistem menggunakan data manual & sensor GPS aktual.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-on-surface-variant shrink-0">KODE OUTLET :</span>
            <input
              type="text"
              readOnly
              value="*diisi Admin"
              className="w-full px-2 py-1 text-xs italic text-on-surface-variant bg-surface-container/60 border border-dashed border-border-glass rounded text-center"
            />
          </div>
        </div>

        {/* Alamat Outlet (Auto-fill dari Google Place API & Diizinkan Diedit) */}
        <div className="p-2.5 flex items-start gap-2">
          <span className="w-28 text-xs font-black shrink-0 pt-1">ALAMAT OUTLET :</span>
          <textarea
            required
            rows={2}
            value={formData.address}
            onChange={(e) => updateField('address', e.target.value)}
            className="w-full px-2.5 py-1 text-xs bg-transparent border-b border-slate-400 focus:border-primary outline-none resize-y"
            placeholder="Terisi otomatis saat memilih Google Place atau ketik alamat lengkap manual..."
          />
        </div>

        {/* No Telp & Nama Pemilik */}
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-700/60 p-2.5 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-28 text-xs font-black shrink-0">NO TELP :</span>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              className="w-full px-2 py-1 text-xs font-mono bg-transparent border-b border-slate-400 focus:border-primary outline-none"
              placeholder="081234567890"
            />
          </div>
          <div className="flex items-center gap-2 sm:pl-2">
            <span className="w-28 text-xs font-black shrink-0">PEMILIK :</span>
            <input
              type="text"
              value={formData.ownerName}
              onChange={(e) => updateField('ownerName', e.target.value)}
              className="w-full px-2 py-1 text-xs bg-transparent border-b border-slate-400 focus:border-primary outline-none"
              placeholder="Nama penanggung jawab"
            />
          </div>
        </div>

        {/* Lokasi Fisik */}
        <div className="p-2.5 flex flex-wrap items-center gap-3">
          <span className="w-28 text-xs font-black shrink-0">LOKASI :</span>
          <div className="flex flex-wrap items-center gap-4">
            {LOCATION_OPTIONS.map((loc) => {
              const isChecked = formData.locationType === loc.id;
              return (
                <label
                  key={loc.id}
                  onClick={() => updateField('locationType', loc.id)}
                  className="flex items-center gap-1.5 text-xs font-bold cursor-pointer select-none"
                >
                  <div
                    className={`w-4 h-4 border-2 rounded flex items-center justify-center transition-colors ${
                      isChecked ? 'border-primary bg-primary text-white' : 'border-slate-500 bg-surface'
                    }`}
                  >
                    {isChecked && <LuCheck className="text-xs" />}
                  </div>
                  <span>{loc.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── BOX 2: VALIDASI GOOGLE PLACE & TITIK GPS (DI BAWAH NAMA OUTLET) ─── */}
      <div className="border border-slate-700/80 rounded-xl overflow-hidden divide-y divide-slate-700/60 bg-surface">
        <div className="p-2.5 bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <LuMapPin className="text-primary" />
            <span className="font-black">VALIDASI GOOGLE PLACE & KOORDINAT GPS (OTOMATIS TERSIMPAN)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-700 rounded text-[10px] font-black border border-emerald-500/30 flex items-center gap-1">
              <LuLock className="text-[10px]" /> GPS Terkunci by Sistem
            </span>
            <button
              type="button"
              onClick={handleDetectGPS}
              disabled={isLocating}
              className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
            >
              <LuRefreshCw className={isLocating ? 'animate-spin' : ''} />
              <span>{isLocating ? 'Mendeteksi...' : 'Ambil Ulang GPS'}</span>
            </button>
          </div>
        </div>

        <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          {/* Sisi Kiri: Profil Google Place */}
          <div>
            <GooglePlaceDetailCard
              place={verifiedPlace}
              currentLat={Number(formData.latitude) || -6.8722}
              currentLng={Number(formData.longitude) || 107.5422}
              searchedQuery={formData.name}
            />
          </div>

          {/* Sisi Kanan: Foto Outlet Live Kamera */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold">Foto Fisik Outlet:</span>
              <span className="text-[10px] text-amber-600 font-bold">* Wajib Kamera Device</span>
            </div>

            {formData.photoUrl ? (
              <div className="relative w-full h-36 rounded-xl overflow-hidden border border-slate-700/60 bg-black flex items-center justify-center">
                <img
                  src={formData.photoUrl}
                  alt="Foto Outlet"
                  className="w-full h-full object-contain"
                />
                <div className="absolute bottom-2 left-2 bg-black/75 text-white font-mono text-[9px] px-2 py-0.5 rounded">
                  GPS: {formData.latitude}, {formData.longitude}
                </div>
                <button
                  type="button"
                  onClick={() => setIsOutletCameraOpen(true)}
                  className="absolute top-2 right-2 px-2 py-1 bg-black/80 hover:bg-neutral-800 text-white rounded text-[10px] font-bold flex items-center gap-1"
                >
                  <LuRefreshCw /> Ambil Ulang
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsOutletCameraOpen(true)}
                className="w-full py-6 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 flex flex-col items-center justify-center gap-2 text-primary font-black transition-all active:scale-98"
              >
                <LuCamera className="text-2xl" />
                <span>Buka Kamera Outlet (Wajib di Lokasi)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── BOX 3: JENIS PAJAK & DOKUMEN KTP/NPWP ────────────────────────────── */}
      <div className="border border-slate-700/80 rounded-xl overflow-hidden divide-y divide-slate-700/60 bg-surface">
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-700/60">
          {/* Sisi Kiri: PKP */}
          <div
            onClick={() => updateField('taxType', 'PKP')}
            className={`p-3 space-y-2 cursor-pointer transition-colors ${
              formData.taxType === 'PKP' ? 'bg-primary/5' : 'opacity-85'
            }`}
          >
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-black cursor-pointer">
                <div
                  className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                    formData.taxType === 'PKP'
                      ? 'border-primary bg-primary text-white'
                      : 'border-slate-500 bg-surface'
                  }`}
                >
                  {formData.taxType === 'PKP' && <LuCheck className="text-xs" />}
                </div>
                <span>PKP (Wajib Pajak Badan)</span>
              </label>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-24 text-on-surface-variant font-bold">NO. NPWP :</span>
                <input
                  type="text"
                  value={formData.taxType === 'PKP' ? formData.taxNumber : ''}
                  onChange={(e) => updateField('taxNumber', e.target.value)}
                  disabled={formData.taxType !== 'PKP'}
                  className="flex-1 px-1.5 py-0.5 font-mono text-xs bg-transparent border-b border-slate-400 outline-none"
                  placeholder="00.000.000.0-000.000"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-24 text-on-surface-variant font-bold">NAMA NPWP :</span>
                <input
                  type="text"
                  value={formData.taxType === 'PKP' ? formData.taxName : ''}
                  onChange={(e) => updateField('taxName', e.target.value)}
                  disabled={formData.taxType !== 'PKP'}
                  className="flex-1 px-1.5 py-0.5 text-xs bg-transparent border-b border-slate-400 outline-none"
                  placeholder="Nama badan usaha"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-24 text-on-surface-variant font-bold">ALAMAT NPWP :</span>
                <input
                  type="text"
                  value={formData.taxType === 'PKP' ? formData.taxAddress : ''}
                  onChange={(e) => updateField('taxAddress', e.target.value)}
                  disabled={formData.taxType !== 'PKP'}
                  className="flex-1 px-1.5 py-0.5 text-xs bg-transparent border-b border-slate-400 outline-none"
                  placeholder="Alamat terdaftar di NPWP"
                />
              </div>
            </div>
          </div>

          {/* Sisi Kanan: NON PKP */}
          <div
            onClick={() => updateField('taxType', 'NON_PKP')}
            className={`p-3 space-y-2 cursor-pointer transition-colors ${
              formData.taxType === 'NON_PKP' ? 'bg-primary/5' : 'opacity-85'
            }`}
          >
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-black cursor-pointer">
                <div
                  className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                    formData.taxType === 'NON_PKP'
                      ? 'border-primary bg-primary text-white'
                      : 'border-slate-500 bg-surface'
                  }`}
                >
                  {formData.taxType === 'NON_PKP' && <LuCheck className="text-xs" />}
                </div>
                <span>NON PKP (KTP / Personal)</span>
              </label>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-24 text-on-surface-variant font-bold">NIK (KTP) :</span>
                <input
                  type="text"
                  value={formData.taxType === 'NON_PKP' ? formData.taxNumber : ''}
                  onChange={(e) => updateField('taxNumber', e.target.value)}
                  disabled={formData.taxType !== 'NON_PKP'}
                  className="flex-1 px-1.5 py-0.5 font-mono text-xs bg-transparent border-b border-slate-400 outline-none"
                  placeholder="327701xxxxxxxxxx"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-24 text-on-surface-variant font-bold">NAMA KTP :</span>
                <input
                  type="text"
                  value={formData.taxType === 'NON_PKP' ? formData.taxName : ''}
                  onChange={(e) => updateField('taxName', e.target.value)}
                  disabled={formData.taxType !== 'NON_PKP'}
                  className="flex-1 px-1.5 py-0.5 text-xs bg-transparent border-b border-slate-400 outline-none"
                  placeholder="Nama sesuai KTP pemilik"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-24 text-on-surface-variant font-bold">ALAMAT KTP :</span>
                <input
                  type="text"
                  value={formData.taxType === 'NON_PKP' ? formData.taxAddress : ''}
                  onChange={(e) => updateField('taxAddress', e.target.value)}
                  disabled={formData.taxType !== 'NON_PKP'}
                  className="flex-1 px-1.5 py-0.5 text-xs bg-transparent border-b border-slate-400 outline-none"
                  placeholder="Alamat sesuai KTP"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Lampiran Foto Dokumen KTP/NPWP via Kamera Langsung */}
        <div className="p-2.5 bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <LuShieldCheck className="text-teal-600 text-base" />
            <span className="font-bold text-on-surface">
              * Lampiran Foto Dokumen {cardTypeLabel} (Wajib Kamera Device):
            </span>
          </div>

          <div className="flex items-center gap-2">
            {formData.taxDocumentUrl ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                  <LuCheck /> {cardTypeLabel} Terlampir
                </span>
                <button
                  type="button"
                  onClick={() => setIsKtpCameraOpen(true)}
                  className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-[11px] font-bold flex items-center gap-1"
                >
                  <LuRefreshCw className="text-[10px]" /> Foto Ulang
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsKtpCameraOpen(true)}
                className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-black flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <LuCamera className="text-sm" /> Buka Kamera {cardTypeLabel}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── BOX 4: AREA & WILAYAH ────────────────────────────────────────────── */}
      <div className="border border-slate-700/80 rounded-xl overflow-hidden divide-y divide-slate-700/60 bg-surface">
        <div className="p-2.5 flex flex-wrap items-center gap-3">
          <span className="w-28 text-xs font-black shrink-0">AREA :</span>
          <div className="flex flex-wrap items-center gap-4">
            {AREA_OPTIONS.map((a) => {
              const isChecked = formData.area === a.id;
              return (
                <label
                  key={a.id}
                  onClick={() => updateField('area', a.id)}
                  className="flex items-center gap-1.5 text-xs font-bold cursor-pointer select-none"
                >
                  <div
                    className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                      isChecked ? 'border-primary bg-primary text-white' : 'border-slate-500 bg-surface'
                    }`}
                  >
                    {isChecked && <LuCheck className="text-xs" />}
                  </div>
                  <span>{a.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-700/60 p-2.5 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-28 text-xs font-black shrink-0">SUB AREA / KEC :</span>
            <input
              type="text"
              value={formData.subAreaKecamatan}
              onChange={(e) => updateField('subAreaKecamatan', e.target.value)}
              className="w-full px-2 py-1 text-xs bg-transparent border-b border-slate-400 outline-none"
              placeholder="Contoh: Padalarang"
            />
          </div>
          <div className="flex items-center gap-2 sm:pl-2">
            <span className="w-28 text-xs font-black shrink-0">KELURAHAN :</span>
            <input
              type="text"
              value={formData.kelurahan}
              onChange={(e) => updateField('kelurahan', e.target.value)}
              className="w-full px-2 py-1 text-xs bg-transparent border-b border-slate-400 outline-none"
              placeholder="Contoh: Laksanamekar"
            />
          </div>
        </div>
      </div>

      {/* ─── BOX 5: CHANNEL & SUB CHANNEL ─────────────────────────────────────── */}
      <div className="border border-slate-700/80 rounded-xl overflow-hidden divide-y divide-slate-700/60 bg-surface">
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-700/60 text-xs">
          {/* Kolom 1: Modern Trade */}
          <div className="p-3 space-y-2">
            <label
              onClick={() => {
                updateField('channel', 'MODERN_TRADE');
                updateField('subChannel', 'CHAIN_MINIMARKET');
              }}
              className="flex items-center gap-1.5 font-black border-b border-slate-300 pb-1 cursor-pointer"
            >
              <div
                className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                  formData.channel === 'MODERN_TRADE'
                    ? 'border-primary bg-primary text-white'
                    : 'border-slate-500 bg-surface'
                }`}
              >
                {formData.channel === 'MODERN_TRADE' && <LuCheck className="text-xs" />}
              </div>
              <span>MODERN TRADE (MT)</span>
            </label>
            <div className="space-y-1 pl-2">
              {MT_SUB_CHANNELS.map((item) => {
                const isSelected =
                  formData.channel === 'MODERN_TRADE' && formData.subChannel === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      updateField('channel', 'MODERN_TRADE');
                      updateField('subChannel', item.id);
                    }}
                    className="flex items-center justify-between py-0.5 cursor-pointer text-[11px] font-medium"
                  >
                    <span>{item.label}</span>
                    <div
                      className={`w-3.5 h-3.5 border rounded flex items-center justify-center ${
                        isSelected ? 'border-primary bg-primary text-white' : 'border-slate-400'
                      }`}
                    >
                      {isSelected && <LuCheck className="text-[10px]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Kolom 2: General Trade */}
          <div className="p-3 space-y-2">
            <label
              onClick={() => {
                updateField('channel', 'GENERAL_TRADE');
                updateField('subChannel', 'TOKO_RETAIL');
              }}
              className="flex items-center gap-1.5 font-black border-b border-slate-300 pb-1 cursor-pointer"
            >
              <div
                className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                  formData.channel === 'GENERAL_TRADE'
                    ? 'border-primary bg-primary text-white'
                    : 'border-slate-500 bg-surface'
                }`}
              >
                {formData.channel === 'GENERAL_TRADE' && <LuCheck className="text-xs" />}
              </div>
              <span>GENERAL TRADE (GT)</span>
            </label>
            <div className="space-y-1 pl-2">
              {GT_SUB_CHANNELS.map((item) => {
                const isSelected =
                  formData.channel === 'GENERAL_TRADE' && formData.subChannel === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      updateField('channel', 'GENERAL_TRADE');
                      updateField('subChannel', item.id);
                    }}
                    className="flex items-center justify-between py-0.5 cursor-pointer text-[11px] font-medium"
                  >
                    <span>{item.label}</span>
                    <div
                      className={`w-3.5 h-3.5 border rounded flex items-center justify-center ${
                        isSelected ? 'border-primary bg-primary text-white' : 'border-slate-400'
                      }`}
                    >
                      {isSelected && <LuCheck className="text-[10px]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Kolom 3: Tier Channel */}
          <div className="p-3 space-y-2">
            <div className="font-black border-b border-slate-300 pb-1">
              CHANEL TIER
            </div>
            <div className="space-y-2 pl-2 pt-1">
              {TIERS.map((t) => {
                const isSelected = formData.channelTier === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => updateField('channelTier', t.id)}
                    className="flex items-center justify-between py-1 cursor-pointer text-xs font-bold"
                  >
                    <span>{t.label}</span>
                    <div
                      className={`w-4 h-4 border rounded flex items-center justify-center ${
                        isSelected ? 'border-primary bg-primary text-white' : 'border-slate-400'
                      }`}
                    >
                      {isSelected && <LuCheck className="text-xs" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ─── BOX 6: PAYMENT TERMS ─────────────────────────────────────────────── */}
      <div className="border border-slate-700/80 rounded-xl overflow-hidden divide-y divide-slate-700/60 bg-surface">
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-700/60 text-xs">
          {/* Kolom 1: TOP */}
          <div className="p-3 space-y-2">
            <label
              onClick={() => updateField('paymentType', 'TOP')}
              className="flex items-center gap-1.5 font-black border-b border-slate-300 pb-1 cursor-pointer"
            >
              <div
                className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                  formData.paymentType === 'TOP'
                    ? 'border-primary bg-primary text-white'
                    : 'border-slate-500 bg-surface'
                }`}
              >
                {formData.paymentType === 'TOP' && <LuCheck className="text-xs" />}
              </div>
              <span>TERM OF PAYMENT (TOP)</span>
            </label>
            <div className="space-y-1.5 pl-2">
              {[7, 14, 30].map((days) => {
                const isSelected = formData.paymentType === 'TOP' && formData.termOfPaymentDays === days;
                return (
                  <div
                    key={days}
                    onClick={() => {
                      updateField('paymentType', 'TOP');
                      updateField('termOfPaymentDays', days);
                    }}
                    className="flex items-center justify-between py-0.5 cursor-pointer text-xs font-medium"
                  >
                    <span>{days} HARI</span>
                    <div
                      className={`w-3.5 h-3.5 border rounded flex items-center justify-center ${
                        isSelected ? 'border-primary bg-primary text-white' : 'border-slate-400'
                      }`}
                    >
                      {isSelected && <LuCheck className="text-[10px]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Kolom 2: Cash Payment */}
          <div className="p-3 space-y-2">
            <label
              onClick={() => updateField('paymentType', 'CASH')}
              className="flex items-center gap-1.5 font-black border-b border-slate-300 pb-1 cursor-pointer"
            >
              <div
                className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                  formData.paymentType === 'CASH'
                    ? 'border-primary bg-primary text-white'
                    : 'border-slate-500 bg-surface'
                }`}
              >
                {formData.paymentType === 'CASH' && <LuCheck className="text-xs" />}
              </div>
              <span>CASH PAYMENT</span>
            </label>
            <div className="space-y-1.5 pl-2">
              {['TUNAI', 'GIRO', 'CEK'].map((m) => {
                const isSelected = formData.paymentType === 'CASH' && formData.cashMethod === m;
                return (
                  <div
                    key={m}
                    onClick={() => {
                      updateField('paymentType', 'CASH');
                      updateField('cashMethod', m);
                    }}
                    className="flex items-center justify-between py-0.5 cursor-pointer text-xs font-medium"
                  >
                    <span>{m}</span>
                    <div
                      className={`w-3.5 h-3.5 border rounded flex items-center justify-center ${
                        isSelected ? 'border-primary bg-primary text-white' : 'border-slate-400'
                      }`}
                    >
                      {isSelected && <LuCheck className="text-[10px]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Kolom 3: Transfer Bank BCA */}
          <div
            onClick={() => updateField('paymentType', 'TRANSFER')}
            className={`p-3 space-y-1 text-xs cursor-pointer ${
              formData.paymentType === 'TRANSFER' ? 'bg-primary/5' : ''
            }`}
          >
            <div className="font-black border-b border-slate-300 pb-1 flex items-center justify-between">
              <span>KHUSUS PEMBAYARAN TRANSFER</span>
              <div
                className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                  formData.paymentType === 'TRANSFER'
                    ? 'border-primary bg-primary text-white'
                    : 'border-slate-500 bg-surface'
                }`}
              >
                {formData.paymentType === 'TRANSFER' && <LuCheck className="text-xs" />}
              </div>
            </div>
            <div className="text-[11px] space-y-0.5 pt-1">
              <div>NO REKENING : <strong className="font-mono font-black">7774628887</strong></div>
              <div>BANK BCA</div>
              <div className="font-bold">CV SINAR ANUGRAH</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── BOX 7: KUNJUNGAN (CALL PLAN PJP) ─────────────────────────────────── */}
      <div className="border border-slate-700/80 rounded-xl overflow-hidden divide-y divide-slate-700/60 bg-surface">
        <div className="p-2 bg-surface-container-low text-xs font-black flex items-center justify-between">
          <span>KUNJUNGAN (CALL PLAN PJP)</span>
          <span className="text-[10px] text-on-surface-variant font-normal italic">
            * Beri Tanda V Pada Kolom Pilihan
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-700/60 text-xs">
          {/* Week Ganjil */}
          <div className="p-3 space-y-2">
            <label
              onClick={() => updateField('visitWeekSchedule', 'WEEK_GANJIL')}
              className="flex items-center gap-1.5 font-black border-b border-slate-300 pb-1 cursor-pointer"
            >
              <div
                className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                  formData.visitWeekSchedule === 'WEEK_GANJIL'
                    ? 'border-primary bg-primary text-white'
                    : 'border-slate-500 bg-surface'
                }`}
              >
                {formData.visitWeekSchedule === 'WEEK_GANJIL' && <LuCheck className="text-xs" />}
              </div>
              <span>WEEK GANJIL</span>
            </label>
            <div className="space-y-1 pl-2">
              {DAYS_LIST.map((day) => {
                const isDayChecked =
                  formData.visitWeekSchedule === 'WEEK_GANJIL' && formData.visitDays.includes(day);
                return (
                  <div
                    key={day}
                    onClick={() => {
                      updateField('visitWeekSchedule', 'WEEK_GANJIL');
                      toggleDay(day);
                    }}
                    className="flex items-center justify-between py-0.5 cursor-pointer text-xs"
                  >
                    <span>{day}</span>
                    <div
                      className={`w-3.5 h-3.5 border rounded flex items-center justify-center ${
                        isDayChecked ? 'border-primary bg-primary text-white' : 'border-slate-400'
                      }`}
                    >
                      {isDayChecked && <LuCheck className="text-[10px]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Week Genap */}
          <div className="p-3 space-y-2">
            <label
              onClick={() => updateField('visitWeekSchedule', 'WEEK_GENAP')}
              className="flex items-center gap-1.5 font-black border-b border-slate-300 pb-1 cursor-pointer"
            >
              <div
                className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                  formData.visitWeekSchedule === 'WEEK_GENAP'
                    ? 'border-primary bg-primary text-white'
                    : 'border-slate-500 bg-surface'
                }`}
              >
                {formData.visitWeekSchedule === 'WEEK_GENAP' && <LuCheck className="text-xs" />}
              </div>
              <span>WEEK GENAP</span>
            </label>
            <div className="space-y-1 pl-2">
              {DAYS_LIST.map((day) => {
                const isDayChecked =
                  formData.visitWeekSchedule === 'WEEK_GENAP' && formData.visitDays.includes(day);
                return (
                  <div
                    key={day}
                    onClick={() => {
                      updateField('visitWeekSchedule', 'WEEK_GENAP');
                      toggleDay(day);
                    }}
                    className="flex items-center justify-between py-0.5 cursor-pointer text-xs"
                  >
                    <span>{day}</span>
                    <div
                      className={`w-3.5 h-3.5 border rounded flex items-center justify-center ${
                        isDayChecked ? 'border-primary bg-primary text-white' : 'border-slate-400'
                      }`}
                    >
                      {isDayChecked && <LuCheck className="text-[10px]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* All Week */}
          <div className="p-3 space-y-2">
            <label
              onClick={() => updateField('visitWeekSchedule', 'ALL_WEEK')}
              className="flex items-center gap-1.5 font-black border-b border-slate-300 pb-1 cursor-pointer"
            >
              <div
                className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                  formData.visitWeekSchedule === 'ALL_WEEK'
                    ? 'border-primary bg-primary text-white'
                    : 'border-slate-500 bg-surface'
                }`}
              >
                {formData.visitWeekSchedule === 'ALL_WEEK' && <LuCheck className="text-xs" />}
              </div>
              <span>ALL WEEK</span>
            </label>
            <div className="space-y-1 pl-2">
              {DAYS_LIST.map((day) => {
                const isDayChecked =
                  formData.visitWeekSchedule === 'ALL_WEEK' && formData.visitDays.includes(day);
                return (
                  <div
                    key={day}
                    onClick={() => {
                      updateField('visitWeekSchedule', 'ALL_WEEK');
                      toggleDay(day);
                    }}
                    className="flex items-center justify-between py-0.5 cursor-pointer text-xs"
                  >
                    <span>{day}</span>
                    <div
                      className={`w-3.5 h-3.5 border rounded flex items-center justify-center ${
                        isDayChecked ? 'border-primary bg-primary text-white' : 'border-slate-400'
                      }`}
                    >
                      {isDayChecked && <LuCheck className="text-[10px]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ─── BOX 8: MAPPING PATOKAN FISIK ────────────────────────────────────── */}
      <div className="border border-slate-700/80 rounded-xl overflow-hidden p-3.5 bg-surface space-y-2 text-xs">
        <label className="font-black block text-sm">Mapping Lokasi :</label>
        <textarea
          rows={6}
          value={formData.mappingLocation}
          onChange={(e) => updateField('mappingLocation', e.target.value)}
          className="w-full min-h-[140px] p-3 text-xs bg-transparent border border-slate-400 rounded-lg focus:border-primary outline-none resize-y"
          placeholder="Tuliskan deskripsi patokan fisik, ancer-ancer lokasi, ciri bangunan, atau petunjuk jalan menuju toko secara rinci..."
        />
      </div>

      {/* ─── Tombol Aksi Submit & Reset Terpadu di Dokumen ─────────────────────── */}
      <div className="pt-2 border-t-2 border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="text-[11px] text-on-surface-variant font-bold">
          * Pastikan seluruh data fisik outlet dan foto kamera telah sesuai sebelum mengajukan.
        </span>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={onReset}
            className="px-4 py-2.5 rounded-xl border-2 border-slate-500 hover:bg-surface-container font-bold text-xs transition-all cursor-pointer"
          >
            Reset Formulir
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <LuSend className="text-sm" />
            <span>{isSubmitting ? 'Mengirim Pengajuan...' : 'Ajukan Registrasi Outlet'}</span>
          </button>
        </div>
      </div>

      {/* ─── Hardware Camera Modals ───────────────────────────────────────────── */}
      <IdCardCameraModal
        isOpen={isKtpCameraOpen}
        onClose={() => setIsKtpCameraOpen(false)}
        onCapture={(photoDataUrl) => updateField('taxDocumentUrl', photoDataUrl)}
        cardType={cardTypeLabel}
        outletName={formData.name}
        division={formData.division}
      />

      <OutletCameraModal
        isOpen={isOutletCameraOpen}
        onClose={() => setIsOutletCameraOpen(false)}
        onCapture={(photoDataUrl) => updateField('photoUrl', photoDataUrl)}
        outletName={formData.name}
        latitude={formData.latitude}
        longitude={formData.longitude}
        division={formData.division}
      />
    </div>
  );
};
