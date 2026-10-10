import {processPolicyValues} from '../../../../../shared/process-policy.mjs';
import {visitPolicy} from '../../../../../shared/operational-policy.mjs';
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
  const { settings:runtime,user } = useApp();
  const settings=processPolicyValues(stop?.policySnapshot,runtime);
  const policy=visitPolicy(settings);
  const requireEvidence=policy.mode!=='OPTIONAL';
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
    if (requireEvidence && settings.SALES_REQUIRE_GPS && (!gpsData || !Number.isFinite(gpsData.lat) || !Number.isFinite(gpsData.lng))) { setError('Ambil ulang foto dengan GPS aktif sebelum mengirim absensi.'); return; }
    if (requireEvidence && policy.photoIn && !capturedPhoto) {
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

  return <SalesDialog title={requireEvidence?"Absen masuk":"Mulai kegiatan kunjungan"} description={stop.outletName} onClose={onClose} busy={saving} dirty={draft.dirty||!!capturedPhoto} restored={draft.restored} draftNotice={draft.restored||draft.policyChanged?draft.restoreMessage:''} draftError={draft.storageError} freshEvidence>
        {/* 1. Live Device Camera & GPS Verification (Top Section) */}
        {requireEvidence && <DeviceCameraCapture policyValues={settings} outletId={stop.outletId}
          photoRequired={policy.photoIn}
          capturedPhoto={capturedPhoto}
          onCapture={handleCapture}
          onLocationChange={requireEvidence && policy.photoIn ? undefined : setGpsData}
          onRetake={handleRetake}
          requireGps={settings.SALES_REQUIRE_GPS}
          enforceGeofence={settings.ATTENDANCE_ENFORCE_GEOFENCE}
          targetLat={stop.latitude}
          targetLng={stop.longitude}
          maxRadiusMeters={settings.ATTENDANCE_USE_OUTLET_RADIUS ? (stop.radiusMeters || settings.ATTENDANCE_RADIUS_METERS) : settings.ATTENDANCE_RADIUS_METERS}
          outletName={stop.outletName}
          facingModeDefault="user"
          buttonLabel="Jepret Foto Selfie Absen In"
        />}

        {/* 2. Keterangan Kunjungan Awal (Below Camera) */}
        <AbsenNotesInput
          notes={notes}
          onChangeNotes={setNotes}
          label="Keterangan Masuk / Rencana Aktivitas Toko"
          placeholder="Tuliskan keterangan kunjungan atau rencana aktivitas..."
        />

        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        {/* 3. Confirmation Button */}
        {!(requireEvidence && policy.photoIn) && <p className="text-xs text-on-surface-variant">{requireEvidence?`Foto opsional.${settings.SALES_REQUIRE_GPS?' Tunggu GPS aktif sebelum mengirim absensi.':''}`:'Kegiatan tanpa presensi wajib; foto dan GPS tidak diperlukan.'}</p>}
        {(capturedPhoto || !(requireEvidence && policy.photoIn)) && (
          <button
            type="button"
            onClick={handleConfirm}
            disabled={saving}
            className="w-full py-3 bg-primary text-on-primary font-bold text-sm rounded-xl hover:bg-primary/90 transition-all shadow-md flex items-center justify-center gap-2"
          >
            <FiCheckCircle className="text-lg" />
            <span>{requireEvidence?'Konfirmasi absen masuk':'Mulai kegiatan'}</span>
          </button>
        )}
  </SalesDialog>;
};
