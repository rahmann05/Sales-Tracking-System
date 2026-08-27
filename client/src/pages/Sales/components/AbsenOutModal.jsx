import React, { useState, useEffect } from 'react';
import { FiXCircle, FiCheckCircle, FiAlertTriangle, FiClock } from 'react-icons/fi';
import { DeviceCameraCapture } from '../../../components/common/DeviceCameraCapture';
import { AbsenNotesInput } from './AbsenNotesInput';

const EARLY_REASON_OPTIONS = [
  'Pemilik Toko Sedang Terburu-buru / Sibuk',
  'Toko Tutup / Sedang Istirahat Siang',
  'Hanya Mengantar Nota / Tagihan Pembayaran',
  'Stok Masih Sangat Penuh (Tidak Mengambil Order)',
  'Kendala Teknis / Darurat Lapangan Lainnya',
];

/**
 * AbsenOutModal Component
 * Single Responsibility: Sales Rep Absen Out with Live Camera, Real-Time GPS Tracking,
 * Duration Anti-Fraud Check, and Result Notes.
 */
export const AbsenOutModal = ({ stop, onClose, onConfirm }) => {
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [gpsData, setGpsData] = useState(null);
  const [notes, setNotes] = useState('Kunjungan Selesai & Transaksi Berhasil');
  const [earlyReason, setEarlyReason] = useState('');
  const [elapsedSecs, setElapsedSecs] = useState(0);

  const checkInTimestamp = stop?.checkInTime || stop?.inTimestamp || stop?.createdAt;

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

  const minDurationSecs = 5 * 60; // 5 minutes
  const isEarlyCheckout = elapsedSecs < minDurationSecs;
  const remainingSecs = Math.max(0, minDurationSecs - elapsedSecs);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleCapture = (photoUrl, location) => {
    setCapturedPhoto(photoUrl);
    setGpsData(location);
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
  };

  const handleConfirm = () => {
    if (!capturedPhoto) {
      alert('Harap ambil foto selfie presensi keluar terlebih dahulu menggunakan kamera.');
      return;
    }

    if (isEarlyCheckout && !earlyReason) {
      alert('Durasi kunjungan belum mencapai 5 menit. Harap pilih alasan checkout lebih awal.');
      return;
    }

    onConfirm(stop.id, {
      photoUrl: capturedPhoto,
      gpsLocation: gpsData,
      notes: notes || 'Kunjungan Selesai',
      earlyReason: isEarlyCheckout ? earlyReason : null,
      durationMinutes: Math.round((elapsedSecs / 60) * 10) / 10,
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="bg-surface border border-border-glass rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Header Modal */}
        <div className="modal-header">
          <div>
            <h3 className="font-bold text-lg text-on-surface">Absen Out Toko (Check-Out)</h3>
            <p className="text-xs text-on-surface-variant font-medium">{stop.outletName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-surface-variant text-on-surface-variant"
          >
            <FiXCircle className="text-xl" />
          </button>
        </div>

        {/* Duration Status Bar */}
        <div className="p-3 bg-surface-container rounded-2xl border border-border-glass flex items-center justify-between text-xs">
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
                <FiCheckCircle className="text-xs" /> Standar Terpenuhi (≥ 5m)
              </>
            ) : (
              <>
                <FiAlertTriangle className="text-xs" /> Sisa {formatTime(remainingSecs)}
              </>
            )}
          </span>
        </div>

        {/* Early Checkout Warning & Reason Selector */}
        {isEarlyCheckout && (
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2.5 text-xs text-amber-900">
            <div className="flex items-start gap-2">
              <FiAlertTriangle className="text-base text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-700 block font-bold">Peringatan: Checkout Dini (&lt; 5 Menit)</strong>
                <span className="text-[11px] text-amber-800">
                  Standar minimal kunjungan toko adalah 5 menit. Karena Anda checkout lebih awal, mohon pilih alasan wajib:
                </span>
              </div>
            </div>

            <select
              value={earlyReason}
              onChange={(e) => setEarlyReason(e.target.value)}
              className="w-full p-2.5 bg-surface border border-amber-500/40 rounded-xl text-xs font-semibold text-on-surface focus:ring-2 focus:ring-amber-500 outline-none"
            >
              <option value="">-- Pilih Alasan Checkout Lebih Awal --</option>
              {EARLY_REASON_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 1. Live Device Camera & GPS Verification */}
        <DeviceCameraCapture
          capturedPhoto={capturedPhoto}
          onCapture={handleCapture}
          onRetake={handleRetake}
          requireGps={true}
          targetLat={stop.latitude}
          targetLng={stop.longitude}
          maxRadiusMeters={50}
          outletName={stop.outletName}
          facingModeDefault="user"
          buttonLabel="Jepret Foto Selfie Absen Out"
        />

        {/* 2. Keterangan Hasil Kunjungan */}
        <AbsenNotesInput
          notes={notes}
          onChangeNotes={setNotes}
          label="Keterangan Selesai / Catatan Hasil Kunjungan"
          placeholder="Tuliskan ringkasan hasil kunjungan toko..."
        />

        {/* 3. Confirmation Button */}
        {capturedPhoto && (
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isEarlyCheckout && !earlyReason}
            className={`w-full py-3 font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 ${
              isEarlyCheckout && !earlyReason
                ? 'bg-slate-400 text-slate-200 cursor-not-allowed opacity-60'
                : 'bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer'
            }`}
          >
            <FiCheckCircle className="text-lg" />
            <span>Selesaikan Kunjungan & Absen Out</span>
          </button>
        )}
      </div>
    </div>
  );
};
