import {EarlyReasonInput} from './EarlyReasonInput';
import {earlyReasonError} from '../../../../../shared/visit-reasons.mjs';
import {processPolicyValues} from '../../../../../shared/process-policy.mjs';
import {visitPolicy} from '../../../../../shared/operational-policy.mjs';
import {useFormDraft} from '../../../shared/hooks/useFormDraft';
import {SalesDialog} from './SalesDialog';
import { AttendanceSalesInput } from './AttendanceSalesInput';
import {VisitOutcomeInput} from './VisitOutcomeInput';
import {visitResultPolicyError} from '../../../../../shared/visit-outcome.mjs';
import { useApp } from '../../../context/AppContext';
import React, { useState, useEffect } from 'react';
import { FiCheckCircle, FiAlertTriangle, FiClock } from 'react-icons/fi';
import { DeviceCameraCapture } from '../../../shared/components/camera/DeviceCameraCapture';
import { AbsenNotesInput } from './AbsenNotesInput';



/**
 * AbsenOutModal Component
 * Single Responsibility: Sales Rep Absen Out with Live Camera, Real-Time GPS Tracking,
 * Duration Anti-Fraud Check, and Result Notes.
 */
export const AbsenOutModal = ({ stop, onClose, onConfirm }) => {
  const { settings:runtime,user } = useApp();
  const settings=processPolicyValues(stop?.policySnapshot,runtime);
  const policy=visitPolicy(settings);
  const requireEvidence=policy.requireOut;
  const draft=useFormDraft(`AbsenOutModal:${stop?.id}`,{notes:'',visitOutcome:{purpose:''},salesResult:{orderAmount:'',productIds:[]},earlyReason:''});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const cacheKey = stop?.id ? `sales_cached_photo_out_${user.id}_${stop.id}` : null;
  const [capturedPhoto, setCapturedPhoto] = useState(() => {
    try {
      return (cacheKey && sessionStorage.getItem(cacheKey)) || null;
    } catch  {
      return null;
    }
  });
  const [gpsData, setGpsData] = useState(null);
  const notes=draft.value.notes,setNotes=draft.field('notes');
  const visitOutcome=draft.value.visitOutcome,setVisitOutcome=draft.field('visitOutcome');
  const salesResult=draft.value.salesResult,setSalesResult=draft.field('salesResult');
  const earlyReason=draft.value.earlyReason,setEarlyReason=draft.field('earlyReason');
  const [elapsedSecs, setElapsedSecs] = useState(0);

  const checkInTimestamp = stop?.inTimestamp;

  useEffect(() => {
    const startMs = checkInTimestamp ? new Date(checkInTimestamp).getTime() : Date.now() - 60000;
    const diff = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
    setElapsedSecs(diff);

    const interval = setInterval(() => {
      const currentDiff = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
      setElapsedSecs(currentDiff);
    }, 1000);

    return () => clearInterval(interval);
  }, [checkInTimestamp]);

  if (!stop) return null;

  const minMinutes = settings.MINIMUM_VISIT_DURATION_MINUTES;
  const minDurationSecs = minMinutes * 60;
  const isEarlyCheckout = requireEvidence && settings.ATTENDANCE_ENFORCE_MIN_DURATION && elapsedSecs < minDurationSecs;
  const earlyBlocked = isEarlyCheckout && (!settings.ATTENDANCE_ALLOW_EARLY_CHECKOUT || !!earlyReasonError(earlyReason,settings));
  const remainingSecs = Math.max(0, minDurationSecs - elapsedSecs);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

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
    const outcomeError=visitResultPolicyError(visitOutcome.purpose?visitOutcome:null,settings,notes);
    if(settings.SALES_REQUIRE_VISIT_RESULT&&!visitOutcome.purpose){setError('Pilih tujuan dan hasil kunjungan.');return;}
    if(outcomeError){setError(outcomeError);return;}
    if (requireEvidence && settings.SALES_REQUIRE_GPS && (!gpsData || !Number.isFinite(gpsData.lat) || !Number.isFinite(gpsData.lng))) { setError('Ambil ulang foto dengan GPS aktif sebelum mengirim absensi.'); return; }
    if (requireEvidence && policy.photoOut && !capturedPhoto) {
      setError('Ambil foto presensi keluar menggunakan kamera terlebih dahulu.');
      return;
    }

    if (earlyBlocked) {
      setError(`Durasi belum mencapai ${minMinutes} menit. ${settings.ATTENDANCE_ALLOW_EARLY_CHECKOUT ? 'Pilih alasan checkout lebih awal.' : 'Tunggu sampai durasi minimum terpenuhi.'}`);
      return;
    }

    if (settings.ATTENDANCE_ALLOW_MANUAL_SALES && (!Number.isFinite(Number(salesResult.orderAmount)) || Number(salesResult.orderAmount) < 0)) { setError('Nominal penjualan harus angka positif atau nol.'); return; }
    setSaving(true); setError('');
    try {
    await onConfirm(stop.id, {
      photoUrl: capturedPhoto,
      gpsLocation: gpsData,
      notes: notes || 'Kunjungan Selesai',
      ...(visitOutcome.purpose?{visitOutcome}:{}),
      earlyReason: isEarlyCheckout ? earlyReason : null,
      ...(settings.ATTENDANCE_ALLOW_MANUAL_SALES ? { orderAmount: Number(salesResult.orderAmount || 0), productIds: salesResult.productIds } : {}),
      durationMinutes: Math.round((elapsedSecs / 60) * 10) / 10,
    });
    draft.clear();if (cacheKey) sessionStorage.removeItem(cacheKey);
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  return <SalesDialog title={requireEvidence?"Hasil kunjungan & absen keluar":"Catat hasil & selesaikan kegiatan"} description={stop.outletName} onClose={onClose} busy={saving} dirty={draft.dirty||!!capturedPhoto} restored={draft.restored} draftNotice={draft.restored||draft.policyChanged?draft.restoreMessage:''} draftError={draft.storageError} freshEvidence>
        {/* Duration Status Bar */}
        {requireEvidence && <div className="p-3 bg-surface-container rounded-2xl border border-border-glass flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-bold text-on-surface">
            <FiClock className="text-primary" />
            <span>Durasi Kunjungan:</span>
            <span className="font-mono font-black text-primary text-sm">{formatTime(elapsedSecs)}</span>
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
              !isEarlyCheckout
                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
            }`}
          >
            {!isEarlyCheckout ? (
              <>
                <FiCheckCircle className="text-xs" /> {settings.ATTENDANCE_ENFORCE_MIN_DURATION ? `Standar Terpenuhi (≥ ${minMinutes}m)` : 'Durasi minimum nonaktif'}
              </>
            ) : (
              <>
                <FiAlertTriangle className="text-xs" /> Sisa {formatTime(remainingSecs)}
              </>
            )}
          </span>
        </div>}

        {/* Early Checkout Warning & Reason Selector */}
        {isEarlyCheckout && (
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2.5 text-xs text-amber-900">
            <div className="flex items-start gap-2">
              <FiAlertTriangle className="text-base text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-700 block font-bold">Peringatan: Checkout Dini (&lt; {minMinutes} Menit)</strong>
                <span className="text-[11px] text-amber-800">
                  Standar minimal kunjungan toko adalah {minMinutes} menit. {settings.ATTENDANCE_ALLOW_EARLY_CHECKOUT ? 'Pilih alasan wajib untuk checkout dini.' : 'Tunggu sampai durasi minimum terpenuhi.'}
                </span>
              </div>
            </div>

            {settings.ATTENDANCE_ALLOW_EARLY_CHECKOUT && <EarlyReasonInput value={earlyReason} onChange={setEarlyReason} settings={settings}/>}
          </div>
        )}

        {/* 1. Live Device Camera & GPS Verification */}
        {requireEvidence && <DeviceCameraCapture policyValues={settings} outletId={stop.outletId}
          photoRequired={policy.photoOut}
          capturedPhoto={capturedPhoto}
          onCapture={handleCapture}
          onLocationChange={requireEvidence && policy.photoOut ? undefined : setGpsData}
          onRetake={handleRetake}
          requireGps={settings.SALES_REQUIRE_GPS}
          enforceGeofence={settings.ATTENDANCE_ENFORCE_GEOFENCE}
          targetLat={stop.latitude}
          targetLng={stop.longitude}
          maxRadiusMeters={settings.ATTENDANCE_USE_OUTLET_RADIUS ? (stop.radiusMeters || settings.ATTENDANCE_RADIUS_METERS) : settings.ATTENDANCE_RADIUS_METERS}
          outletName={stop.outletName}
          facingModeDefault="user"
          buttonLabel="Jepret Foto Selfie Absen Out"
        />}

        <AttendanceSalesInput value={salesResult} onChange={setSalesResult} />
        <VisitOutcomeInput policy={settings} value={visitOutcome} onChange={setVisitOutcome} allowCollection={settings.FEATURE_COLLECTION_MODE==='ACTIVE'} required={settings.SALES_REQUIRE_VISIT_RESULT}/>
        {/* 2. Keterangan Hasil Kunjungan */}
        <AbsenNotesInput
          notes={notes}
          onChangeNotes={setNotes}
          label="Keterangan Selesai / Catatan Hasil Kunjungan"
          placeholder="Tuliskan ringkasan hasil kunjungan toko..."
        />

        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        {/* 3. Confirmation Button */}
        {requireEvidence && !policy.photoOut && <p className="text-xs text-on-surface-variant">Foto opsional.{settings.SALES_REQUIRE_GPS?' Tunggu GPS aktif sebelum mengirim absensi.':''}</p>}
        {(capturedPhoto || !(requireEvidence && policy.photoOut)) && (
          <button
            type="button"
            onClick={handleConfirm}
            disabled={saving || earlyBlocked}
            className={`w-full py-3 font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 ${
              earlyBlocked
                ? 'bg-slate-400 text-slate-200 cursor-not-allowed opacity-60'
                : 'bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer'
            }`}
          >
            <FiCheckCircle className="text-lg" />
            <span>{requireEvidence?"Selesaikan kunjungan & absen keluar":"Simpan hasil & selesaikan kegiatan"}</span>
          </button>
        )}
  </SalesDialog>;
};
