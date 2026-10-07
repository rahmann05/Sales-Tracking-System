import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SPV_MODE_OPTIONS } from '../../../constants/supervisor';
import { LuCheck, LuCamera, LuMapPin, LuRotateCw, LuInfo } from 'react-icons/lu';
import { DeviceCameraCapture } from '../../../shared/components/camera/DeviceCameraCapture';
import { getDetailedAddressFromGps } from '../../../services/reverseGeocodeService';
import { SpvModalShell } from './SpvModalShell';

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
  const [isGeocodingLoading, setIsGeocodingLoading] = useState(false);
  const [isAddressAutoFetched, setIsAddressAutoFetched] = useState(false);
  const [localError, setLocalError] = useState('');

  const lastCoords = useRef({ lat: null, lng: null });

  const fetchAddressFromCoords = useCallback(async (lat, lng, force = false) => {
    if (!lat || !lng) return;
    if (!force && lastCoords.current.lat === lat && lastCoords.current.lng === lng) return;

    lastCoords.current = { lat, lng };
    setIsGeocodingLoading(true);
    try {
      const detailedAddress = await getDetailedAddressFromGps(lat, lng);
      if (detailedAddress) {
        onChangeForm({ ...form, address: detailedAddress });
        setIsAddressAutoFetched(true);
      }
    } catch (err) {
      console.warn('Geocoding error:', err);
    } finally {
      setIsGeocodingLoading(false);
    }
  }, [form, onChangeForm]);

  // Auto-fetch GPS address on modal open
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!form?.address || isAddressAutoFetched) {
          fetchAddressFromCoords(pos.coords.latitude, pos.coords.longitude);
        }
      },
      () => {},
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, [fetchAddressFromCoords]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCapture = (photoUrl, location) => {
    setCapture({ photoUrl, gps: location });
    setLocalError('');
    if (location?.lat && location?.lng && (!form?.address || isAddressAutoFetched)) {
      fetchAddressFromCoords(location.lat, location.lng, true);
    }
  };

  const handleRetake = () => {
    setCapture(null);
  };

  const handleRefreshAddress = () => {
    if (capture?.gps?.lat && capture?.gps?.lng) {
      fetchAddressFromCoords(capture.gps.lat, capture.gps.lng, true);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchAddressFromCoords(pos.coords.latitude, pos.coords.longitude, true),
        (err) => setLocalError('Gagal mendeteksi lokasi GPS: ' + err.message),
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
  };

  const handleSubmit = () => {
    if (!capture?.photoUrl || !capture?.gps) {
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
      photoUrl: capture.photoUrl,
      latitude: capture.gps.lat,
      longitude: capture.gps.lng,
      visitMode: spvMode,
    });
  };

  const displayError = error || localError;
  const isSubmitDisabled = saving || !capture?.photoUrl || !capture?.gps;

  return (
    <SpvModalShell
      error={displayError}
      saving={saving}
      title="Kunjungan Supervisi Luar RJP"
      subtitle="Presensi kunjungan toko dengan verifikasi foto kamera & titik GPS langsung"
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
            Presensi supervisi di luar jadwal memerlukan <strong>foto langsung di lokasi toko</strong> dan <strong>verifikasi GPS aktif</strong> persis seperti langkah presensi sales.
          </span>
        </div>

        {/* 1. Camera & GPS Verification */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
              <LuCamera className="text-sm text-primary" />
              <span>Foto Bukti Kunjungan & GPS (Wajib):</span>
            </label>
            {capture?.gps && (
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <LuMapPin className="text-xs" />
                GPS Terkunci ({capture.gps.lat.toFixed(5)}, {capture.gps.lng.toFixed(5)})
              </span>
            )}
          </div>

          <DeviceCameraCapture
            capturedPhoto={capture?.photoUrl}
            onCapture={handleCapture}
            onRetake={handleRetake}
            requireGps={true}
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
              disabled={isGeocodingLoading}
              className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              <LuRotateCw className={`text-xs ${isGeocodingLoading ? 'animate-spin' : ''}`} />
              <span>{isGeocodingLoading ? 'Mendeteksi…' : 'Deteksi dari GPS'}</span>
            </button>
          </div>
          <input
            type="text"
            value={form?.address || ''}
            onChange={(e) => {
              onChangeForm({ ...form, address: e.target.value });
              setIsAddressAutoFetched(false);
            }}
            placeholder="Misal: Jl. Raya Cimahi No. 100, Bandung Barat"
            className="w-full p-3 rounded-xl bg-surface-variant/30 border border-border-glass text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

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
