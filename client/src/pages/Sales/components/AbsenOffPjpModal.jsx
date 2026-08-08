import React from 'react';
import { FiXCircle, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { DeviceCameraCapture } from '../../../components/common/DeviceCameraCapture';
import { AbsenNotesInput } from './AbsenNotesInput';
import { OffPjpIdentityForm } from './OffPjpIdentityForm';
import { useOffPjpCheckIn } from '../hooks/useOffPjpCheckIn';

/**
 * AbsenOffPjpModal Component (Orchestrator)
 * Single Responsibility: Compose modal check-in toko luar RJP dari
 * camera capture + identity form + notes. State didelegasikan ke useOffPjpCheckIn.
 */
export const AbsenOffPjpModal = ({ isOpen, onClose, onSubmit }) => {
  const form = useOffPjpCheckIn({ isOpen, onSubmit });

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" style={{ zIndex: 1000 }}>
      <div className="bg-surface border border-border-glass rounded-3xl p-5 sm:p-7 md:p-8 w-full max-w-xl md:max-w-2xl space-y-4 shadow-2xl overflow-y-auto max-h-[94vh] max-h-[94dvh] pb-12">
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

        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-2.5 text-xs text-amber-800 font-medium">
          <FiAlertCircle className="text-lg flex-shrink-0 text-amber-600" />
          <span>
            Absen luar RJP akan dicatat dengan status <strong>MENUNGGU VALIDASI</strong> hingga diverifikasi oleh Supervisor Anda.
          </span>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-on-surface block">
            Kamera & Verifikasi GPS Presensi (Wajib):
          </label>
          <DeviceCameraCapture
            capturedPhoto={form.capturedPhoto}
            onCapture={form.handleCapture}
            onRetake={form.handleRetake}
            requireGps={true}
            targetLat={null}
            targetLng={null}
            outletName={form.outletName || 'Toko Luar RJP'}
            facingModeDefault="user"
            buttonLabel="Jepret Foto Presensi Luar RJP (GPS Aktif)"
          />
        </div>

        <OffPjpIdentityForm
          outletName={form.outletName}
          onOutletNameChange={form.setOutletName}
          customerName={form.customerName}
          onCustomerNameChange={form.setCustomerName}
          phone={form.phone}
          onPhoneChange={form.setPhone}
          address={form.address}
          onAddressChange={form.handleAddressChange}
          isAddressAutoFetched={form.isAddressAutoFetched}
          isGeocodingLoading={form.isGeocodingLoading}
          userLocation={form.userLocation}
          onRefreshAddress={form.handleManualRefreshAddress}
        />

        <AbsenNotesInput
          notes={form.notes}
          onChangeNotes={form.setNotes}
          label="Keterangan / Alasan Kunjungan Luar RJP"
          placeholder="Tuliskan keterangan kunjungan atau alasan toko non-RJP..."
        />

        {form.capturedPhoto && (
          <button
            type="button"
            onClick={form.handleConfirm}
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
