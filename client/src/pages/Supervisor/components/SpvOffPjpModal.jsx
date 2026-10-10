import React, { useState } from 'react';
import { SPV_MODE_OPTIONS } from '../../../constants/supervisor';
import { LuCheck, LuCamera, LuMapPin, LuRotateCw, LuInfo } from 'react-icons/lu';
import { DeviceCameraCapture } from '../../../shared/components/camera/DeviceCameraCapture';
import {useAddressLookup} from '../../../shared/hooks/useAddressLookup';
import { SpvModalShell } from './SpvModalShell';
import {useApp} from '../../../context/AppContext';

/**
 * SpvOffPjpModal Component
 * Single Responsibility: Modal absen kunjungan supervisi luar jadwal / toko dadakan
 * lengkap dengan foto kamera langsung, verifikasi GPS, auto-reverse geocode, dan langkah absen seperti sales.
 */
export const SpvOffPjpModal = ({
  form,
  onChangeForm,
  spvMode,
  onChangeSpvMode,
  onClose,
  onConfirm,
  error,
  saving,
}) => {
  const [capture, setCapture] = useState(null);
  const {settings}=useApp();
  const optional=settings.SPV_ATTENDANCE_MODE==='OPTIONAL',photoRequired=!optional&&settings.SPV_REQUIRE_PHOTO,gpsRequired=!optional&&settings.SPV_REQUIRE_GPS;
  const [localError,setLocalError]=useState('');
  const {lookupEnabled,lookupError,isGeocodingLoading,fetchAddressFromCoords,handleAddressChange,refresh}=useAddressLookup({address:form?.address,onChange:address=>onChangeForm({...form,address})});
  const handleCapture=(photoUrl,gps)=>{setCapture({photoUrl,gps});setLocalError('');if(gps)fetchAddressFromCoords(gps.lat,gps.lng);};
  const handleRetake=()=>setCapture(null);
  const handleRefreshAddress=()=>refresh(capture?.gps);

  const handleSubmit = () => {
    if (photoRequired&&!capture?.photoUrl || gpsRequired&&!capture?.gps) {
      setLocalError('Wajib menjepret foto presensi di lokasi toko dengan GPS aktif.');
      return;
    }
    if (!form?.outletName?.trim()) {
      setLocalError('Harap isi Nama Outlet / Toko terlebih dahulu.');
      return;
    }
    if (!form?.address?.trim()) {
      setLocalError('Harap isi Alamat / Lokasi Toko.');
      return;
    }
    if (!form?.reason?.trim()) {
      setLocalError('Harap isi Alasan Kunjungan Supervisi.');
      return;
    }

    setLocalError('');
    onConfirm({
      ...form,
      photoUrl: capture?.photoUrl,
      accuracy:capture?.gps?.accuracy,observedAt:capture?.gps?.observedAt,latitude: capture?.gps?.lat,
      longitude: capture?.gps?.lng,
      visitMode: spvMode,
    });
  };

  const displayError = error || localError;
  const isSubmitDisabled = saving || photoRequired&&!capture?.photoUrl || gpsRequired&&!capture?.gps;

  return (
    <SpvModalShell
      error={displayError}
      saving={saving}
      title="Kunjungan Supervisi Luar RJP"
      subtitle={optional?'Catat kegiatan supervisi tanpa presensi wajib':'Catat kegiatan dan bukti sesuai aturan aktif'}
      maxWidth="max-w-xl md:max-w-2xl"
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2.5 rounded-xl border border-border-glass text-xs font-bold text-on-surface-variant hover:bg-surface-variant cursor-pointer transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer ${
              isSubmitDisabled
                ? 'bg-neutral-300 dark:bg-neutral-800 text-neutral-500 cursor-not-allowed opacity-70'
                : 'bg-primary text-on-primary hover:bg-primary/90'
            }`}
          >
            <LuCheck className="text-base" />
            <span>{saving ? 'Menyimpan…' : 'Simpan Absen Supervisi'}</span>
          </button>
        </>
      }
    >
      <div className="space-y-4 py-2">
        {/* Notice Info Banner */}
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300 font-medium">
          <LuInfo className="text-base shrink-0 mt-0.5 text-amber-600" />
          <span>
            Kegiatan supervisi dicatat terpisah dari kunjungan Sales. Foto {photoRequired?'wajib':'opsional'} · GPS {gpsRequired?'wajib':'opsional'} sesuai aturan aktif.
          </span>
        </div>

        {/* 1. Camera & GPS Verification */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
              <LuCamera className="text-sm text-primary" />
              <span>Foto {photoRequired?'wajib':'opsional'} · GPS {gpsRequired?'wajib':'opsional'}</span>
            </label>
            {capture?.gps && (
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <LuMapPin className="text-xs" />
                GPS Terkunci ({capture.gps.lat.toFixed(5)}, {capture.gps.lng.toFixed(5)})
              </span>
            )}
          </div>

          <DeviceCameraCapture policyValues={settings}
            photoRequired={photoRequired}
            capturedPhoto={capture?.photoUrl}
            onCapture={handleCapture}
            onRetake={handleRetake}
            requireGps={gpsRequired}
            onLocationChange={photoRequired?undefined:gps=>setCapture(c=>({...c,gps}))}
            targetLat={null}
            targetLng={null}
            outletName={form?.outletName || 'Toko Supervisi Luar RJP'}
            facingModeDefault="user"
            buttonLabel="Jepret Foto Presensi Supervisi (GPS Aktif)"
          />
        </div>

        {/* 2. Jenis Kunjungan */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-on-surface block">Jenis Kunjungan Supervisi:</label>
          <select
            value={spvMode}
            onChange={(e) => onChangeSpvMode(e.target.value)}
            className="w-full p-3 rounded-xl bg-surface-variant/30 border border-border-glass text-xs font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            {SPV_MODE_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Form Identitas Outlet */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface block">
              Nama Outlet / Toko: <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={form?.outletName || ''}
              onChange={(e) => onChangeForm({ ...form, outletName: e.target.value })}
              placeholder="Misal: Toko Berkah Abadi"
              className="w-full p-3 rounded-xl bg-surface-variant/30 border border-border-glass text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface block">
              Kontak / PIC Toko (Opsional):
            </label>
            <input
              type="text"
              value={form?.owner || ''}
              onChange={(e) => onChangeForm({ ...form, owner: e.target.value })}
              placeholder="Misal: Bpk. H. Ahmad"
              className="w-full p-3 rounded-xl bg-surface-variant/30 border border-border-glass text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        {/* 4. Alamat Toko dengan Auto-Geocoding */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-on-surface flex items-center gap-1">
              <LuMapPin className="text-xs text-primary" />
              <span>Alamat / Lokasi Toko: <span className="text-rose-500">*</span></span>
            </label>
            <button
              type="button"
              onClick={handleRefreshAddress}
              disabled={isGeocodingLoading||!lookupEnabled}
              className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              <LuRotateCw className={`text-xs ${isGeocodingLoading ? 'animate-spin' : ''}`} />
              <span>{isGeocodingLoading ? 'Mendeteksi…' : 'Deteksi dari GPS'}</span>
            </button>
          </div>
          <input
            type="text"
            value={form?.address || ''}
            onChange={e=>handleAddressChange(e.target.value)}
            placeholder="Misal: Jl. Raya Cimahi No. 100, Bandung Barat"
            className="w-full p-3 rounded-xl bg-surface-variant/30 border border-border-glass text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {lookupError&&<p role="status" className="text-sm">{lookupError}</p>}
        {!lookupEnabled&&<p className="text-sm">Pencarian alamat tidak tersedia. Isi alamat secara manual.</p>}
        {/* 5. Alasan Kunjungan */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-on-surface block">
            Alasan Kunjungan Supervisi: <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={2}
            value={form?.reason || ''}
            onChange={(e) => onChangeForm({ ...form, reason: e.target.value })}
            placeholder="Misal: Permintaan audit toko baru, pengecekan retur barang, eskalasi display promo..."
            className="w-full p-3 rounded-xl bg-surface-variant/30 border border-border-glass text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>
    </SpvModalShell>
  );
};
