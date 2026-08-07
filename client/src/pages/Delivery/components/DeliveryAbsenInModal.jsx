import React, { useState } from 'react';
import { FiXCircle, FiCheckCircle } from 'react-icons/fi';
import { DeviceCameraCapture } from '../../../components/common/DeviceCameraCapture';
import { AbsenNotesInput } from '../../Sales/components/AbsenNotesInput';

/**
 * DeliveryAbsenInModal Component
 * Single Responsibility: Driver/Helper Absen In at Drop Point with Live Camera, GPS tracking, and Arrival Notes.
 */
export const DeliveryAbsenInModal = ({ stop, onClose, onConfirm }) => {
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [gpsData, setGpsData] = useState(null);
  const [notes, setNotes] = useState('Armada Tiba di Lokasi & Mulai Bongkar Muatan');

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
      alert('Harap ambil foto kedatangan di toko menggunakan kamera.');
      return;
    }
    onConfirm(stop.id, {
      photoUrl: capturedPhoto,
      gpsLocation: gpsData,
      notes: notes || 'Tiba di Drop Point',
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="bg-surface border border-border-glass rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="modal-header">
          <div>
            <h3 className="font-bold text-lg text-on-surface">Absen In Tiba Drop Point</h3>
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

        {/* 1. Keterangan Kedatangan Logistik */}
        <AbsenNotesInput
          notes={notes}
          onChangeNotes={setNotes}
          label="Keterangan Kedatangan / Kondisi Parkir & Drop"
          presets={[
            'Armada Tiba di Lokasi & Mulai Bongkar Muatan',
            'Parkir di Depan Ruko, Penerima Siap di Tempat',
            'Toko Ramai, Menunggu Antrean Bongkar',
            'Akses Jalan Sempit, Bongkar Menggunakan Troli',
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
          buttonLabel="Jepret Foto Kedatangan di Toko"
        />

        {/* 3. Confirmation Button */}
        {capturedPhoto && (
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full py-3 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition-all shadow-md flex items-center justify-center gap-2"
          >
            <FiCheckCircle className="text-lg" />
            <span>Konfirmasi Absen In Drop Point</span>
          </button>
        )}
      </div>
    </div>
  );
};
