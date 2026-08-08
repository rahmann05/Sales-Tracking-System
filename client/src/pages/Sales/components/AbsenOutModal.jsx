import React, { useState } from 'react';
import { FiXCircle, FiCheckCircle } from 'react-icons/fi';
import { DeviceCameraCapture } from '../../../components/common/DeviceCameraCapture';
import { AbsenNotesInput } from './AbsenNotesInput';

/**
 * AbsenOutModal Component
 * Single Responsibility: Sales Rep Absen Out with Live Camera, Real-Time GPS Tracking, and Keterangan Selesai.
 */
export const AbsenOutModal = ({ stop, onClose, onConfirm }) => {
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [gpsData, setGpsData] = useState(null);
  const [notes, setNotes] = useState('Kunjungan Selesai & Transaksi Berhasil');

  if (!stop) return null;

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
    onConfirm(stop.id, {
      photoUrl: capturedPhoto,
      gpsLocation: gpsData,
      notes: notes || 'Kunjungan Selesai',
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="bg-surface border border-border-glass rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="modal-header">
          <div>
            <h3 className="font-bold text-lg text-on-surface">Absen Out Toko (Check-Out)</h3>
            <p className="text-xs text-on-surface-variant">{stop.outletName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-surface-variant text-on-surface-variant"
          >
            <FiXCircle className="text-xl" />
          </button>
        </div>

        {/* 1. Live Device Camera & GPS Verification (Top Section) */}
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

        {/* 2. Keterangan Hasil Kunjungan (Below Camera) */}
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
            className="w-full py-3 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-700 transition-all shadow-md flex items-center justify-center gap-2"
          >
            <FiCheckCircle className="text-lg" />
            <span>Selesaikan Kunjungan & Absen Out</span>
          </button>
        )}
      </div>
    </div>
  );
};
