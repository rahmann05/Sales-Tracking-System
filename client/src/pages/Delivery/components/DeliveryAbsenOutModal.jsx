import React, { useState } from 'react';
import { FiXCircle, FiCheckCircle } from 'react-icons/fi';
import { DeviceCameraCapture } from '../../../components/common/DeviceCameraCapture';
import { AbsenNotesInput } from '../../Sales/components/AbsenNotesInput';

/**
 * DeliveryAbsenOutModal Component
 * Single Responsibility: Driver/Helper Absen Out after POD is done with Live Camera, GPS tracking, and Handover Notes.
 */
export const DeliveryAbsenOutModal = ({ stop, onClose, onConfirm }) => {
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [gpsData, setGpsData] = useState(null);
  const [notes, setNotes] = useState('Barang Diterima Lengkap & Selesai Serah Terima');

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
      alert('Harap ambil foto bukti serah terima / armada siap berangkat.');
      return;
    }
    onConfirm(stop.id, {
      photoUrl: capturedPhoto,
      gpsLocation: gpsData,
      notes: notes || 'Pengiriman Selesai',
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="bg-surface border border-border-glass rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="modal-header">
          <div>
            <h3 className="font-bold text-lg text-on-surface">Absen Out Serah Terima Selesai</h3>
            <p className="text-xs text-on-surface-variant">Drop Point: {stop.outletName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-surface-variant text-on-surface-variant"
          >
            <FiXCircle className="text-xl" />
          </button>
        </div>

        {/* 1. Keterangan Penyelesaian Serah Terima */}
        <AbsenNotesInput
          notes={notes}
          onChangeNotes={setNotes}
          label="Keterangan Selesai / Catatan Serah Terima Barang"
          presets={[
            'Barang Diterima Lengkap & Selesai Serah Terima',
            'Pembayaran Cash COD Diterima Pas Sesuai Faktur',
            'Faktur Diberi Stempel Toko & Ditandatangani',
            'Armada Siap Berangkat ke Titik Drop Berikutnya',
          ]}
        />

        {/* 2. Live Device Camera & GPS Verification */}
        <DeviceCameraCapture
          capturedPhoto={capturedPhoto}
          onCapture={handleCapture}
          onRetake={handleRetake}
          requireGps={true}
          targetLat={stop.latitude || -6.8722}
          targetLng={stop.longitude || 107.5423}
          maxRadiusMeters={50}
          outletName={stop.outletName}
          facingModeDefault="environment"
          buttonLabel="Jepret Foto Bukti Selesai Serah Terima"
        />

        {/* 3. Confirmation Button */}
        {capturedPhoto && (
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full py-3 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-700 transition-all shadow-md flex items-center justify-center gap-2"
          >
            <FiCheckCircle className="text-lg" />
            <span>Selesaikan Drop Point & Absen Out</span>
          </button>
        )}
      </div>
    </div>
  );
};
