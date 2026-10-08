import {useFormDraft} from '../../../shared/hooks/useFormDraft';
import {SalesDialog} from './SalesDialog';
import { useApp } from '../../../context/AppContext';
import React, { useState } from 'react';
import { FiCheckCircle } from 'react-icons/fi';
import { DeviceCameraCapture } from '../../../shared/components/camera/DeviceCameraCapture';
import { AbsenNotesInput } from './AbsenNotesInput';

/**
 * AbsenInModal Component
 * Single Responsibility: Sales Rep Absen In with Live Camera, Real-Time GPS Tracking, and Keterangan Masuk.
 */
export const AbsenInModal = ({ stop, onClose, onConfirm }) => {
  const { settings,user } = useApp();
  const draft=useFormDraft(`AbsenInModal:${stop?.id}`,{notes:'Kunjungan pelanggan'});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const cacheKey = stop?.id ? `sales_cached_photo_in_${user.id}_${stop.id}` : null;
  const [capturedPhoto, setCapturedPhoto] = useState(() => {
    try {
      return (cacheKey && sessionStorage.getItem(cacheKey)) || null;
    } catch  {
      return null;
    }
  });
  const [gpsData, setGpsData] = useState(null);
  const notes=draft.value.notes,setNotes=draft.field('notes');

  if (!stop) return null;

  const handleCapture = (photoUrl, location) => {
    setCapturedPhoto(photoUrl);
    setGpsData(location);
    if (cacheKey && photoUrl) {
      try {
        sessionStorage.setItem(cacheKey, photoUrl);
      } catch  {}
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);setGpsData(null);
    if (cacheKey) {
      try {
        sessionStorage.removeItem(cacheKey);
      } catch  {}
    }
  };

  const handleConfirm = async () => {
    if (saving) return;
    if (!gpsData || !Number.isFinite(gpsData.lat) || !Number.isFinite(gpsData.lng)) { setError('Ambil ulang foto dengan GPS aktif sebelum mengirim absensi.'); return; }
    if (settings.ATTENDANCE_REQUIRE_PHOTO && !capturedPhoto) {
      setError('Ambil foto presensi menggunakan kamera terlebih dahulu.');
      return;
    }
    setSaving(true); setError('');
    try {
    await onConfirm(stop.id, {
      photoUrl: capturedPhoto,
      gpsLocation: gpsData,
      notes: notes || 'Kunjungan Rutin',
    });
    draft.clear();if (cacheKey) sessionStorage.removeItem(cacheKey);
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  return <SalesDialog title="Absen masuk" description={stop.outletName} onClose={onClose} busy={saving} dirty={draft.dirty||!!capturedPhoto} restored={draft.restored} draftError={draft.storageError} freshEvidence>
        {/* 1. Live Device Camera & GPS Verification (Top Section) */}
        <DeviceCameraCapture outletId={stop.outletId}
          capturedPhoto={capturedPhoto}
          onCapture={handleCapture}
          onLocationChange={settings.ATTENDANCE_REQUIRE_PHOTO ? undefined : setGpsData}
          onRetake={handleRetake}
          requireGps={true}
          enforceGeofence={settings.ATTENDANCE_ENFORCE_GEOFENCE}
          targetLat={stop.latitude}
          targetLng={stop.longitude}
          maxRadiusMeters={settings.ATTENDANCE_USE_OUTLET_RADIUS ? (stop.radiusMeters || settings.ATTENDANCE_RADIUS_METERS) : settings.ATTENDANCE_RADIUS_METERS}
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
        {!settings.ATTENDANCE_REQUIRE_PHOTO && <p className="text-xs text-on-surface-variant">Foto opsional. Tunggu GPS aktif sebelum mengirim absensi.</p>}
        {(capturedPhoto || !settings.ATTENDANCE_REQUIRE_PHOTO) && (
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
  </SalesDialog>;
};
