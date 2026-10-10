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

  return <SalesDialog title="Kunjungan luar PJP" description={form.settings.OFF_PJP_REQUIRE_REVIEW?'Catat kunjungan tambahan untuk diperiksa Supervisor.':'Catat kunjungan tambahan sesuai aturan perusahaan.'} onClose={onClose} busy={form.saving} dirty={form.dirty||form.retryPending} restored={form.restored} draftNotice={form.draftNotice} draftError={form.draftError} freshEvidence={!form.retryPending}>
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-2.5 text-xs text-amber-800 font-medium">
          <FiAlertCircle className="text-lg flex-shrink-0 text-amber-600" />
          <span>
            {form.settings.OFF_PJP_REQUIRE_REVIEW?'Kunjungan menunggu pemeriksaan Supervisor.':'Kunjungan diterima tanpa pemeriksaan tambahan sesuai kebijakan. Bukti asli tetap disimpan.'}
          </span>
        </div>

        <fieldset disabled={form.saving || form.retryPending} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-on-surface block">
            Bukti kunjungan · Foto {form.settings.OFF_PJP_REQUIRE_PHOTO?'wajib':'opsional'} · GPS {form.settings.OFF_PJP_REQUIRE_GPS?'wajib':'opsional'}
          </label>
          <DeviceCameraCapture
            photoRequired={form.settings.OFF_PJP_REQUIRE_PHOTO}
            capturedPhoto={form.capturedPhoto}
            onCapture={form.handleCapture}
            onRetake={form.handleRetake}
            requireGps={form.settings.OFF_PJP_REQUIRE_GPS}
            onLocationChange={form.settings.OFF_PJP_REQUIRE_PHOTO?undefined:form.setCapturedGps}
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
          lookupEnabled={form.lookupEnabled}
          userLocation={form.userLocation}
          onRefreshAddress={form.handleManualRefreshAddress}
        />

        {form.lookupError&&<p role="status" className="text-sm">{form.lookupError}</p>}
        {!form.lookupEnabled&&<p className="text-sm">Pencarian alamat tidak tersedia. Isi alamat secara manual.</p>}
        <AttendanceSalesInput value={form.salesResult} onChange={form.setSalesResult} />
        <VisitOutcomeInput value={form.visitOutcome} onChange={form.setVisitOutcome} allowCollection={form.settings.FEATURE_COLLECTION_MODE==='ACTIVE'}/>
        <AbsenNotesInput
          notes={form.notes}
          onChangeNotes={form.setNotes}
          label="Keterangan / Alasan Kunjungan Luar PJP"
          placeholder="Tuliskan keterangan kunjungan atau alasan toko non-PJP..."
        />
        </fieldset>

        {form.error && <p role="alert" className="text-red-600 text-sm">{form.error}</p>}
        {form.retryPending && !form.saving && <p role="status" className="text-sm">Hasil pengiriman belum terkonfirmasi. Kirim ulang pengajuan yang sama untuk memeriksa hasilnya. Identitas pengajuan tetap dipulihkan saat formulir dibuka kembali di sesi browser ini.</p>}
        {(form.capturedPhoto || !form.settings.OFF_PJP_REQUIRE_PHOTO) && (
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
