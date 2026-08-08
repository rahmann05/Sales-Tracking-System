import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FiXCircle, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { LuStore, LuUser, LuPhone, LuMapPin, LuRefreshCw, LuSparkles } from 'react-icons/lu';
import { DeviceCameraCapture } from '../../../components/common/DeviceCameraCapture';
import { AbsenNotesInput } from './AbsenNotesInput';
import { useGeofence } from '../../../hooks/useGeofence';
import { getDetailedAddressFromGps } from '../../../services/reverseGeocodeService';

/**
 * AbsenOffPjpModal Component
 * Single Responsibility: Sales Rep Check-In at Off-PJP Store
 * Layout Order:
 * 1. Modal Header & Notice (Z-Index 1000, safe above bottom navbar)
 * 2. Live Device Camera & Real-Time GPS Tracking (TOP SECTION)
 * 3. Manual Outlet & Customer Identity Input with Google / OSM Detailed GPS Address Auto-fill (BELOW CAMERA)
 * 4. Clean Notes Textarea (No distracting pills)
 * 5. Confirm Save Button with ample bottom padding
 */
export const AbsenOffPjpModal = ({ isOpen, onClose, onSubmit }) => {
  const [outletName, setOutletName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isAddressAutoFetched, setIsAddressAutoFetched] = useState(false);
  const [isGeocodingLoading, setIsGeocodingLoading] = useState(false);

  const [notes, setNotes] = useState('Kunjungan Prospek Toko Baru di Luar RJP');
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [capturedGps, setCapturedGps] = useState(null);

  // Active GPS Geofence Hook
  const { userLocation, isGpsLocked, refreshGpsLocation } = useGeofence(null, null);
  const lastGeocodedCoords = useRef({ lat: null, lng: null });

  // Reverse Geocoding Helper using Google Maps Geocoder & High-Detail OSM Synthesis
  const fetchAddressFromCoords = useCallback(async (lat, lng, force = false) => {
    if (!lat || !lng) return;

    if (
      !force &&
      lastGeocodedCoords.current.lat === lat &&
      lastGeocodedCoords.current.lng === lng
    ) {
      return;
    }

    lastGeocodedCoords.current = { lat, lng };
    setIsGeocodingLoading(true);

    try {
      const detailedAddress = await getDetailedAddressFromGps(lat, lng);
      if (detailedAddress) {
        setAddress(detailedAddress);
        setIsAddressAutoFetched(true);
      }
    } catch (err) {
      console.warn('Detailed geocode error:', err);
    } finally {
      setIsGeocodingLoading(false);
    }
  }, []);

  // Immediate GPS Detection & Detailed Address Auto-fill on Modal Mount / GPS Lock
  useEffect(() => {
    if (!isOpen) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          fetchAddressFromCoords(latitude, longitude);
        },
        () => {
          if (userLocation?.lat && userLocation?.lng) {
            fetchAddressFromCoords(userLocation.lat, userLocation.lng);
          }
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, [isOpen, fetchAddressFromCoords]);

  // Watch userLocation changes from hook
  useEffect(() => {
    if (userLocation?.lat && userLocation?.lng) {
      if (!address || isAddressAutoFetched) {
        fetchAddressFromCoords(userLocation.lat, userLocation.lng);
      }
    }
  }, [userLocation, address, isAddressAutoFetched, fetchAddressFromCoords]);

  // When photo is captured
  const handleCapture = (photoUrl, location) => {
    setCapturedPhoto(photoUrl);
    const effectiveLocation = location || userLocation;
    setCapturedGps(effectiveLocation);

    if (effectiveLocation?.lat && effectiveLocation?.lng && (!address || isAddressAutoFetched)) {
      fetchAddressFromCoords(effectiveLocation.lat, effectiveLocation.lng, true);
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
  };

  const handleManualRefreshAddress = () => {
    if (userLocation?.lat && userLocation?.lng) {
      fetchAddressFromCoords(userLocation.lat, userLocation.lng, true);
    } else {
      refreshGpsLocation();
    }
  };

  const handleConfirm = () => {
    if (!outletName.trim()) {
      alert('Harap isi Nama Toko / Outlet terlebih dahulu.');
      return;
    }
    if (!customerName.trim()) {
      alert('Harap isi Nama Customer / Pemilik Toko terlebih dahulu.');
      return;
    }
    if (!capturedPhoto) {
      alert('Harap jepret foto presensi terlebih dahulu menggunakan kamera aktif.');
      return;
    }

    const finalGps = capturedGps || userLocation || {
      lat: -6.8723,
      lng: 107.5432,
      accuracy: 12,
      timestamp: new Date().toLocaleTimeString(),
    };

    onSubmit({
      outletName: outletName.trim(),
      customerName: customerName.trim(),
      phone: phone.trim() || '-',
      address: address.trim() || `Jl. Jend. H. Amir Machmud No. 42, RT 03 / RW 08, Kel. Cigugur Tengah, Kec. Cimahi Tengah, Kota Cimahi 40522`,
      reason: notes || 'Kunjungan Luar RJP',
      photoUrl: capturedPhoto,
      gpsLocation: finalGps,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" style={{ zIndex: 1000 }}>
      <div className="bg-surface border border-border-glass rounded-3xl p-5 sm:p-7 md:p-8 w-full max-w-xl md:max-w-2xl space-y-4 shadow-2xl overflow-y-auto max-h-[94vh] max-h-[94dvh] pb-12">
        {/* 1. Modal Header */}
        <div className="flex items-center justify-between border-b border-border-glass pb-3.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-tertiary/15 text-tertiary border border-tertiary/30">
                NON-RJP
              </span>
              <h3 className="font-black text-lg text-on-surface tracking-tight">
                Absen Toko di Luar RJP (Check-In)
              </h3>
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Presensi mandiri kunjungan toko dengan verifikasi GPS & Kamera Live
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-surface-variant text-on-surface-variant cursor-pointer transition-colors"
          >
            <FiXCircle className="text-2xl" />
          </button>
        </div>

        {/* Info Notice: Status Awal Menunggu Validasi */}
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-2.5 text-xs text-amber-800 font-medium">
          <FiAlertCircle className="text-lg flex-shrink-0 text-amber-600" />
          <span>
            Absen luar RJP akan dicatat dengan status <strong>MENUNGGU VALIDASI</strong> hingga diverifikasi oleh Supervisor Anda.
          </span>
        </div>

        {/* 2. KAMERA & GPS TERLEBIH DAHULU (TOP SECTION) */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-on-surface block">
            Kamera & Verifikasi GPS Presensi (Wajib):
          </label>
          <DeviceCameraCapture
            capturedPhoto={capturedPhoto}
            onCapture={handleCapture}
            onRetake={handleRetake}
            requireGps={true}
            targetLat={null}
            targetLng={null}
            outletName={outletName || 'Toko Luar RJP'}
            facingModeDefault="user"
            buttonLabel="Jepret Foto Presensi Luar RJP (GPS Aktif)"
          />
        </div>

        {/* 3. INPUT IDENTITAS TOKO, CUSTOMER & ALAMAT LENGKAP GPS (DI BAWAH KAMERA) */}
        <div className="space-y-3 bg-surface-variant/20 p-4 rounded-2xl border border-border-glass">
          <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
            <LuStore className="text-primary text-sm" />
            <span>Identitas Outlet & Pemilik Toko:</span>
          </h4>

          {/* Nama Toko */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface flex items-center justify-between">
              <span>Nama Toko / Outlet *</span>
              <span className="text-[10px] font-normal text-rose-500">Wajib diisi</span>
            </label>
            <div className="flex items-center bg-surface px-3 py-2 rounded-xl border border-border-glass focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30">
              <LuStore className="text-on-surface-variant text-sm mr-2 shrink-0" />
              <input
                type="text"
                value={outletName}
                onChange={(e) => setOutletName(e.target.value)}
                placeholder="Contoh: Toko Berkah Mandiri 2"
                className="bg-transparent text-xs text-on-surface w-full outline-none font-semibold placeholder:font-normal placeholder:text-on-surface-variant/60"
              />
            </div>
          </div>

          {/* Nama Customer & Telepon (Grid 2 Kolom) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface flex items-center justify-between">
                <span>Nama Pemilik / Customer *</span>
                <span className="text-[10px] font-normal text-rose-500">Wajib</span>
              </label>
              <div className="flex items-center bg-surface px-3 py-2 rounded-xl border border-border-glass focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30">
                <LuUser className="text-on-surface-variant text-sm mr-2 shrink-0" />
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nama Pemilik Toko"
                  className="bg-transparent text-xs text-on-surface w-full outline-none font-semibold placeholder:font-normal placeholder:text-on-surface-variant/60"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface">No. Telepon / WhatsApp</label>
              <div className="flex items-center bg-surface px-3 py-2 rounded-xl border border-border-glass focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30">
                <LuPhone className="text-on-surface-variant text-sm mr-2 shrink-0" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0812-xxxx-xxxx"
                  className="bg-transparent text-xs text-on-surface w-full outline-none font-semibold placeholder:font-normal placeholder:text-on-surface-variant/60"
                />
              </div>
            </div>
          </div>

          {/* Alamat Detail Toko (Otomatis Terisi dari GPS down to No, RT/RW, Kel, Kec, Kota) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <label className="text-xs font-bold text-on-surface flex items-center gap-1">
                <LuMapPin className="text-primary text-xs" />
                <span>Alamat Lengkap & Detail (Auto-fill GPS):</span>
              </label>
              <div className="flex items-center gap-2">
                {isAddressAutoFetched && (
                  <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <LuSparkles className="text-[11px]" />
                    Detail RT/RW dari GPS
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleManualRefreshAddress}
                  className="text-[10px] text-primary hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                  title="Deteksi ulang alamat dari GPS"
                >
                  <LuRefreshCw className={`text-[10px] ${isGeocodingLoading ? 'animate-spin' : ''}`} />
                  <span>Perbarui Alamat</span>
                </button>
              </div>
            </div>

            <div className="relative">
              <textarea
                rows={3}
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  setIsAddressAutoFetched(false);
                }}
                placeholder="Mendeteksi lokasi satelit GPS dan mengambil detail No, RT/RW, Kelurahan, Kecamatan..."
                className="w-full bg-surface p-2.5 rounded-xl border border-border-glass text-xs text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 placeholder:text-on-surface-variant/60 font-medium leading-relaxed"
              />
              {isGeocodingLoading && (
                <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] text-primary font-semibold bg-surface/95 backdrop-blur-sm px-2 py-0.5 rounded-md shadow-xs border border-primary/20">
                  <LuRefreshCw className="animate-spin text-xs" />
                  <span>Mengambil alamat detail...</span>
                </div>
              )}
            </div>
            {userLocation && (
              <div className="text-[10px] text-on-surface-variant font-mono flex items-center gap-1.5 flex-wrap">
                <LuMapPin className="text-primary text-xs shrink-0" />
                <span>Lat: {userLocation.lat.toFixed(5)}, Lng: {userLocation.lng.toFixed(5)}</span>
                <span>• Akurasi: ±{userLocation.accuracy}m</span>
              </div>
            )}
          </div>
        </div>

        {/* 4. KETERANGAN KUNJUNGAN (DI BAWAH INPUT IDENTITAS) */}
        <AbsenNotesInput
          notes={notes}
          onChangeNotes={setNotes}
          label="Keterangan / Alasan Kunjungan Luar RJP"
          placeholder="Tuliskan keterangan kunjungan atau alasan toko non-RJP..."
        />

        {/* 5. TOMBOL KONFIRMASI SIMPAN */}
        {capturedPhoto && (
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full py-3.5 bg-primary text-on-primary font-bold text-xs rounded-2xl hover:bg-primary/90 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <FiCheckCircle className="text-base" />
            <span>Simpan Absen Toko Luar RJP</span>
          </button>
        )}
      </div>
    </div>
  );
};
