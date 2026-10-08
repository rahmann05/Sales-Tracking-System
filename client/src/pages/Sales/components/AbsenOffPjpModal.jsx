import {SalesDialog} from './SalesDialog';
import { AttendanceSalesInput } from './AttendanceSalesInput';
import {VisitOutcomeInput} from './VisitOutcomeInput';
import React from 'react';
import { FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { DeviceCameraCapture } from '../../../shared/components/camera/DeviceCameraCapture';
import { AbsenNotesInput } from './AbsenNotesInput';
import { OffPjpIdentityForm } from './OffPjpIdentityForm';
import { useOffPjpCheckIn } from '../hooks/useOffPjpCheckIn';

/**
 * AbsenOffPjpModal Component (Orchestrator)
 * Single Responsibility: Compose modal check-in toko luar PJP dari
 * camera capture + identity form + notes. State didelegasikan ke useOffPjpCheckIn.
 */
export const AbsenOffPjpModal = ({ isOpen, onClose, onSubmit }) => {
  const form = useOffPjpCheckIn({ isOpen, onSubmit });

  if (!isOpen) return null;

  return <SalesDialog title="Kunjungan luar PJP" description={'Catat kunjungan tambahan untuk diperiksa Supervisor.'} onClose={onClose} busy={form.saving} dirty={form.dirty||form.retryPending} restored={form.restored} draftError={form.draftError} freshEvidence={!form.retryPending}>
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-2.5 text-xs text-amber-800 font-medium">
          <FiAlertCircle className="text-lg flex-shrink-0 text-amber-600" />
          <span>
            Absen luar PJP akan dicatat dengan status <strong>MENUNGGU VALIDASI</strong> hingga diverifikasi oleh Supervisor Anda.
          </span>
        </div>

        <fieldset disabled={form.saving || form.retryPending} className="space-y-4">
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
            outletName={form.outletName || 'Toko Luar PJP'}
            facingModeDefault="user"
            buttonLabel="Jepret Foto Presensi Luar PJP (GPS Aktif)"
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

        <AttendanceSalesInput value={form.salesResult} onChange={form.setSalesResult} />
        <VisitOutcomeInput value={form.visitOutcome} onChange={form.setVisitOutcome}/>
        <AbsenNotesInput
          notes={form.notes}
          onChangeNotes={form.setNotes}
          label="Keterangan / Alasan Kunjungan Luar PJP"
          placeholder="Tuliskan keterangan kunjungan atau alasan toko non-PJP..."
        />
        </fieldset>

        {form.error && <p role="alert" className="text-red-600 text-sm">{form.error}</p>}
        {form.retryPending && !form.saving && <p role="status" className="text-sm">Hasil pengiriman belum terkonfirmasi. Kirim ulang pengajuan yang sama untuk memeriksa hasilnya. Identitas pengajuan tetap dipulihkan saat formulir dibuka kembali di sesi browser ini.</p>}
        {form.capturedPhoto && (
          <button
            type="button"
            onClick={form.handleConfirm}
            disabled={form.saving}
            className="w-full py-3.5 bg-primary text-on-primary font-bold text-xs rounded-2xl hover:bg-primary/90 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <FiCheckCircle className="text-base" />
            <span>{form.saving ? 'Memeriksa pengajuan…' : form.retryPending ? 'Kirim ulang pengajuan yang sama' : 'Simpan Absen Toko Luar PJP'}</span>
          </button>
        )}
  </SalesDialog>;
};
