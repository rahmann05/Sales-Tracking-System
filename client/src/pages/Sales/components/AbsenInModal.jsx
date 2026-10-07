import { useApp } from '../../../context/AppContext';
import React, { useState } from 'react';
import { FiXCircle, FiCheckCircle } from 'react-icons/fi';
import { DeviceCameraCapture } from '../../../shared/components/camera/DeviceCameraCapture';
import { AbsenNotesInput } from './AbsenNotesInput';

/**
 * AbsenInModal Component
 * Single Responsibility: Sales Rep Absen In with Live Camera, Real-Time GPS Tracking, and Keterangan Masuk.
 */
export const AbsenInModal = ({ stop, onClose, onConfirm }) => {
  const { settings } = useApp();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const cacheKey = stop?.id ? `sales_cached_photo_in_${stop.id}` : null;
  const [capturedPhoto, setCapturedPhoto] = useState(() => {
    try {
      return (cacheKey && sessionStorage.getItem(cacheKey)) || null;
    } catch (e) {
      return null;
    }
  });
  const [gpsData, setGpsData] = useState(null);
  const [notes, setNotes] = useState('Kunjungan Rutin & Cek Stok');

  if (!stop) return null;

  const handleCapture = (photoUrl, location) => {
    setCapturedPhoto(photoUrl);
    setGpsData(location);
    if (cacheKey && photoUrl) {
      try {
        sessionStorage.setItem(cacheKey, photoUrl);
      } catch (e) {}
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    if (cacheKey) {
      try {
        sessionStorage.removeItem(cacheKey);
      } catch (e) {}
    }
  };

  const handleConfirm = async () => {
    if (saving) return;
    if (!gpsData || !Number.isFinite(gpsData.lat) || !Number.isFinite(gpsData.lng)) { setError('Ambil ulang foto dengan GPS aktif sebelum mengirim absensi.'); return; }
    if (!capturedPhoto) {
      alert('Harap ambil foto selfie presensi terlebih dahulu menggunakan kamera.');
      return;
    }
    setSaving(true); setError('');
    try {
    await onConfirm(stop.id, {
      photoUrl: capturedPhoto,
      gpsLocation: gpsData,
      notes: notes || 'Kunjungan Rutin',
    });
    if (cacheKey) sessionStorage.removeItem(cacheKey);
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Absensi toko">
      <div className="bg-surface border border-border-glass rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="modal-header">
          <div>
            <h3 className="font-bold text-lg text-on-surface">Absen In Toko (Check-In)</h3>
            <p className="text-xs text-on-surface-variant">{stop.outletName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup absensi"
            disabled={saving}
            className="p-1 rounded-lg hover:bg-surface-variant text-on-surface-variant"
          >
            <FiXCircle className="text-xl" />
          </button>
        </div>

        {/* 1. Live Device Camera & GPS Verification (Top Section) */}
        <DeviceCameraCapture outletId={stop.outletId}
          capturedPhoto={capturedPhoto}
          onCapture={handleCapture}
          onRetake={handleRetake}
          requireGps={true}
          targetLat={stop.latitude}
          targetLng={stop.longitude}
          maxRadiusMeters={stop.radiusMeters || settings.ATTENDANCE_RADIUS_METERS}
          outletName={stop.outletName}
          facingModeDefault="user"
          buttonLabel="Jepret Foto Selfie Absen In"
        />

        {/* 2. Keterangan Kunjungan Awal (Below Camera) */}
        <AbsenNotesInput
          notes={notes}
          onChangeNotes={setNotes}
          label="Keterangan Masuk / Rencana Aktivitas Toko"
          placeholder="Tuliskan keterangan kunjungan atau rencana aktivitas..."
        />

        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        {/* 3. Confirmation Button */}
        {capturedPhoto && (
          <button
            type="button"
            onClick={handleConfirm}
            disabled={saving}
            className="w-full py-3 bg-primary text-on-primary font-bold text-sm rounded-xl hover:bg-primary/90 transition-all shadow-md flex items-center justify-center gap-2"
          >
            <FiCheckCircle className="text-lg" />
            <span>Konfirmasi Absen In Toko</span>
          </button>
        )}
      </div>
    </div>
  );
};
