import { FollowUpVisitSchedule } from './FollowUpVisitSchedule';
import { useFormDraft } from '../../hooks/useFormDraft';
import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { useUnsavedNavigation } from '../../hooks/useUnsavedNavigation';
import { staffAttendanceApi } from '../../../services/api';
import { followUpAllowed } from '../../../../../shared/follow-up-policy.mjs';
import { processPolicyValues } from '../../../../../shared/process-policy.mjs';
import { DeviceCameraCapture } from '../camera/DeviceCameraCapture';
import { EvidencePhoto } from './EvidencePhoto';
import { FollowUpAssignment } from './FollowUpAssignment';

const hasCoordinates = (outlet) =>
  Number.isFinite(Number(outlet?.latitude)) &&
  Number.isFinite(Number(outlet?.longitude)) &&
  Math.abs(Number(outlet.latitude)) <= 90 &&
  Math.abs(Number(outlet.longitude)) <= 180;

export function FollowUpActions({
  id,
  followUp: f,
  policySnapshot,
  targetOutlet = null,
  outletName = '',
  onChanged,
}) {
  const { user, settings } = useApp();
  const values = policySnapshot?.values ? processPolicyValues(policySnapshot, settings) : settings;
  const requirePhoto = values.FOLLOW_UP_REQUIRE_PHOTO !== false;
  const requireGps = values.FOLLOW_UP_REQUIRE_GPS !== false;
  const enforceGeofence = values.FOLLOW_UP_ENFORCE_GEOFENCE !== false;
  const maxRadiusMeters =
    values.ATTENDANCE_USE_OUTLET_RADIUS !== false
      ? targetOutlet?.radiusMeters || values.ATTENDANCE_RADIUS_METERS || 50
      : values.ATTENDANCE_RADIUS_METERS || 50;

  const draft = useFormDraft(`followup:${id}:${f.submission?.id || 'open'}:${f.status}`, {
    note: '',
    evidence: '',
  });
  const { note, evidence } = draft.value,
    setNote = draft.field('note'),
    setEvidence = draft.field('evidence');

  const photoCacheKey = user?.id && id ? `follow_up_photo_${user.id}_${id}` : null;
  const [capturedPhoto, setCapturedPhoto] = useState(() => {
    try {
      return (photoCacheKey && sessionStorage.getItem(photoCacheKey)) || null;
    } catch {
      return null;
    }
  });
  const [gpsData, setGpsData] = useState(null);
  const [decision, setDecision] = useState('ACCEPT'),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');

  useUnsavedNavigation(Boolean(note || evidence || capturedPhoto), busy);

  const review =
    f.status === 'SUBMITTED' &&
    (!f.reviewerMode || f.reviewerMode === 'BOTH' || f.reviewerMode === user?.role) &&
    ['ADMIN', 'SUPERVISOR'].includes(user?.role) &&
    followUpAllowed(user, 'review') &&
    f.ownerId !== user.id;
  const submit = f.status === 'OPEN' && followUpAllowed(user, 'complete') && f.ownerId === user?.id;
  const displayOutletName = targetOutlet?.name || outletName || 'Outlet';
  const targetHasCoords = hasCoordinates(targetOutlet);

  const handleCapture = (photoUrl, location) => {
    setCapturedPhoto(photoUrl);
    if (location) setGpsData(location);
    if (photoCacheKey && photoUrl) {
      try {
        sessionStorage.setItem(photoCacheKey, photoUrl);
      } catch {}
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    setGpsData(null);
    if (photoCacheKey) {
      try {
        sessionStorage.removeItem(photoCacheKey);
      } catch {}
    }
  };

  const save = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!review) {
      if (
        requireGps &&
        (!gpsData || !Number.isFinite(gpsData.lat) || !Number.isFinite(gpsData.lng))
      ) {
        setError(
          'GPS lokasi belum terdeteksi. Pastikan izin lokasi aktif dan tunggu hingga GPS terkunci.'
        );
        return;
      }
      if (requirePhoto && !capturedPhoto) {
        setError(
          'Ambil foto langsung menggunakan kamera saat berada di lokasi outlet terlebih dahulu.'
        );
        return;
      }
    }
    setBusy(true);
    setError('');
    try {
      if (review) {
        await staffAttendanceApi.reviewFollowUp(id, {
          decision,
          note,
          submissionId: f.submission.id,
        });
      } else {
        await staffAttendanceApi.completeFollowUp(id, {
          note,
          evidence,
          ...(capturedPhoto ? { photoUrl: capturedPhoto } : {}),
          ...(gpsData && Number.isFinite(gpsData.lat) && Number.isFinite(gpsData.lng)
            ? {
                latitude: gpsData.lat,
                longitude: gpsData.lng,
                accuracy: gpsData.accuracy,
                observedAt: gpsData.observedAt,
              }
            : {}),
        });
      }
      setNote('');
      setEvidence('');
      setCapturedPhoto(null);
      setGpsData(null);
      if (photoCacheKey) {
        try {
          sessionStorage.removeItem(photoCacheKey);
        } catch {}
      }
      draft.clear();
      await onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      {(draft.restored || draft.policyChanged) && <p role="status">{draft.restoreMessage}</p>}
      {draft.storageError && <p role="alert">{draft.storageError}</p>}
      <p>Yang perlu dilakukan: {f.note}</p>
      {targetOutlet && (
        <div className="border rounded-xl p-3 space-y-1 text-sm">
          {targetOutlet.address && <p>Alamat outlet: {targetOutlet.address}</p>}
          <p className="text-xs text-on-surface-variant">
            {enforceGeofence
              ? `Verifikasi posisi ke titik outlet aktif (radius ${maxRadiusMeters} m).`
              : 'Verifikasi GPS dan kamera sesuai aturan tugas.'}
          </p>
          {targetHasCoords ? (
            <a
              className="text-xs text-primary underline inline-flex items-center min-h-11 md:min-h-0"
              href={`https://www.google.com/maps/search/?api=1&query=${targetOutlet.latitude},${targetOutlet.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Buka titik outlet di peta ({Number(targetOutlet.latitude).toFixed(5)},{' '}
              {Number(targetOutlet.longitude).toFixed(5)})
            </a>
          ) : (
            <p className="text-xs text-amber-700">Koordinat master outlet belum tersedia.</p>
          )}
        </div>
      )}
      <FollowUpVisitSchedule id={id} followUp={f} onChanged={onChanged} />
      {f.status === 'DONE' && !f.submission && <p>{f.completionNote}</p>}
      {f.submission && (
        <div className="border rounded-xl p-3 space-y-2">
          <strong>Hasil dari Sales</strong>
          <p>{f.submission.note}</p>
          {f.submission.evidence && <p>Bukti / referensi: {f.submission.evidence}</p>}
          {f.submission.photoUrl && (
            <EvidencePhoto
              url={f.submission.photoUrl}
              label={`tindak lanjut ${displayOutletName}`}
            />
          )}
          {f.submission.latitude != null && f.submission.longitude != null && (
            <p className="text-xs text-on-surface-variant">
              Lokasi pengiriman: {Number(f.submission.latitude).toFixed(5)},{' '}
              {Number(f.submission.longitude).toFixed(5)}
              {f.submission.deviationMeters != null
                ? ` · Jarak ${f.submission.deviationMeters} m dari titik outlet`
                : ''}
            </p>
          )}
          <p className="text-xs">
            Dikirim{' '}
            {new Date(f.submission.at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}
          </p>
        </div>
      )}
      {f.review && (
        <p className="text-sm">
          {f.review.decision === 'ACCEPT' ? 'Diterima pemeriksa' : 'Diminta perbaikan'}:{' '}
          {f.review.note}
        </p>
      )}
      {f.status === 'SUBMITTED' && !review && (
        <p role="status">Hasil dikirim, menunggu pemeriksaan SPV / Admin.</p>
      )}
      {(submit || review) && (
        <form className="space-y-3" onSubmit={save}>
          <fieldset disabled={busy} className="space-y-3">
            {review && (
              <label className="block">
                Keputusan
                <select
                  className="form-input block w-full"
                  value={decision}
                  onChange={(e) => setDecision(e.target.value)}
                >
                  <option value="ACCEPT">Terima hasil dan selesaikan tugas</option>
                  <option value="RETURN">Minta perbaikan dari Sales</option>
                </select>
              </label>
            )}
            {submit && (requirePhoto || requireGps) && (
              <div className="space-y-1.5">
                <span className="text-xs font-semibold block">
                  Bukti lapangan · Foto {requirePhoto ? 'wajib' : 'opsional'} · GPS{' '}
                  {requireGps ? 'wajib' : 'opsional'}
                </span>
                <DeviceCameraCapture
                  policyValues={values}
                  outletId={targetOutlet?.id || null}
                  photoRequired={requirePhoto}
                  capturedPhoto={capturedPhoto}
                  onCapture={handleCapture}
                  onLocationChange={requirePhoto ? undefined : setGpsData}
                  onRetake={handleRetake}
                  requireGps={requireGps}
                  enforceGeofence={enforceGeofence}
                  targetLat={targetHasCoords ? Number(targetOutlet.latitude) : null}
                  targetLng={targetHasCoords ? Number(targetOutlet.longitude) : null}
                  maxRadiusMeters={maxRadiusMeters}
                  outletName={displayOutletName}
                  facingModeDefault="user"
                  buttonLabel="Ambil foto bukti tugas"
                />
              </div>
            )}
            <label className="block">
              {review
                ? decision === 'RETURN'
                  ? 'Alasan dan perbaikan yang diminta'
                  : 'Catatan pemeriksaan (opsional)'
                : 'Apa yang dilakukan dan hasilnya'}
              <textarea
                className="form-input block w-full"
                required={!review || decision === 'RETURN'}
                maxLength={review ? 2000 : 4000}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>
            {submit && (
              <label className="block">
                Catatan / referensi tambahan{' '}
                {values.FOLLOW_UP_REQUIRE_EVIDENCE && !requirePhoto ? '(wajib)' : '(opsional)'}
                <textarea
                  className="form-input block w-full"
                  required={Boolean(
                    values.FOLLOW_UP_REQUIRE_EVIDENCE && !requirePhoto && !capturedPhoto
                  )}
                  maxLength={2000}
                  value={evidence}
                  onChange={(e) => setEvidence(e.target.value)}
                  placeholder="Contoh: pihak yang ditemui di toko atau keterangan tambahan (opsional jika foto sudah diambil)"
                />
              </label>
            )}

            {(review || !requirePhoto || capturedPhoto) && (
              <button className="btn btn-secondary min-h-11">
                {busy
                  ? 'Menyimpan…'
                  : review
                    ? 'Simpan pemeriksaan'
                    : values.FOLLOW_UP_REQUIRE_REVIEW
                      ? 'Kirim hasil untuk diperiksa'
                      : 'Simpan hasil & selesaikan tugas'}
              </button>
            )}
          </fieldset>
        </form>
      )}
      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}
      {f.status === 'OPEN' &&
        ['ADMIN', 'SUPERVISOR'].includes(user?.role) &&
        followUpAllowed(user, 'assign') && (
          <FollowUpAssignment
            key={`${id}:${f.revision || 0}`}
            id={id}
            followUp={f}
            onChanged={onChanged}
          />
        )}
      <details>
        <summary className="cursor-pointer min-h-11">
          Riwayat pekerjaan ({f.history?.length || 0})
        </summary>
        {f.history?.map((h, i) => (
          <p className="text-sm py-1" key={i}>
            {new Date(h.at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} ·{' '}
            {h.action === 'REASSIGNED'
              ? `Pengalihan ${h.before?.ownerName || 'Petugas sebelumnya'} → ${h.after?.ownerName || 'Petugas baru'} · Tenggat ${h.after?.dueDate || 'tidak tersedia'}`
              : h.action}{' '}
            · {h.note || h.after?.note} {h.evidence ? `· Bukti / referensi: ${h.evidence}` : ''}
            {h.deviationMeters != null ? ` · Jarak ${h.deviationMeters}m` : ''}
          </p>
        ))}
      </details>
    </div>
  );
}
