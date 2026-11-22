import { RegistrationAdditionalFields } from './RegistrationAdditionalFields';
import { useFeaturePolicy } from '../../../shared/hooks/useFeaturePolicy';
import { RegistrationIdentitySection } from './RegistrationIdentitySection';
import { RegistrationLocationSection } from './RegistrationLocationSection';
import { RegistrationTaxSection } from './RegistrationTaxSection';
import { RegistrationTerritorySection } from './RegistrationTerritorySection';
import { RegistrationChannelSection } from './RegistrationChannelSection';
import { RegistrationPaymentSection } from './RegistrationPaymentSection';
import { RegistrationVisitSection } from './RegistrationVisitSection';
import React, { useRef, useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { LuSend } from 'react-icons/lu';
import { IdCardCameraModal } from './IdCardCameraModal';
import { OutletCameraModal } from './OutletCameraModal';
import { BusinessCodeInput } from '../../../shared/components/common/BusinessCodeInput';
import { confirmAction } from '../../../services/notificationService';
import { RegistrationDivisionBar } from './RegistrationDivisionBar';
import {
  LOCATION_OPTIONS,
  MT_SUB_CHANNELS,
  GT_SUB_CHANNELS,
  TIERS,
  DAYS_LIST,
} from '../constants/registrationOptions';

/**
 * PhysicalDocumentForm Component
 * Render outlet registration in four task groups with explicit GPS and camera actions.
 */
export const PhysicalDocumentForm = ({
  formData,
  updateField,
  isSearchingPlace,
  placeSearchError,
  placeSearchResults,
  verifiedPlace,
  searchGooglePlaces,
  handleSelectGooglePlace,
  handleUnlockGooglePlace,
  isLocating,
  gpsError,
  handleDetectGPS,
  toggleDay,
  onReset,
  isSubmitting = false,
}) => {
  const featurePolicy = useFeaturePolicy('REGISTRATION');
  const { clusters, divisions, settings: liveSettings } = useApp();
  const settings = formData.revisionId
    ? { ...liveSettings, ...formData.revisionPolicyValues }
    : liveSettings;
  const [isKtpCameraOpen, setIsKtpCameraOpen] = useState(false);
  const [isOutletCameraOpen, setIsOutletCameraOpen] = useState(false);
  const debounceTimerRef = useRef(null);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  useEffect(() => () => clearTimeout(debounceTimerRef.current), []);
  const handleNameChange = (e) => {
    const val = e.target.value;
    updateField('name', val);
    setHasSearched(false);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (val.trim().length >= 2) {
      setIsDebouncing(true);
      debounceTimerRef.current = setTimeout(async () => {
        setIsDebouncing(false);
        if (
          searchGooglePlaces &&
          settings.FEATURE_MAPS_MODE === 'ACTIVE' &&
          settings.PLACE_LOOKUP_PROVIDER !== 'OFF'
        ) {
          await searchGooglePlaces(val.trim());
          setHasSearched(true);
        }
      }, 3000);
    } else {
      setIsDebouncing(false);
      setHasSearched(false);
    }
  };
  const cardTypeLabel = formData.taxType === 'PKP' ? 'NPWP' : 'KTP';
  return (
    <div className="sales-registration-document bg-surface border-2 border-slate-700/80 rounded-2xl shadow-xl p-4 sm:p-7 max-w-5xl mx-auto space-y-4 text-on-surface">
      <div className="sales-registration-intro">
        <div>
          <h2>Data calon pelanggan</h2>
          <p className="sales-note">
            Isi data berikut sesuai kondisi outlet. Pengajuan akan diperiksa sebelum menjadi
            pelanggan aktif.
          </p>
        </div>
        <nav className="sales-registration-nav" aria-label="Bagian formulir outlet">
          {[
            ['identity', 'Identitas'],
            ['location', 'Lokasi & dokumen'],
            ['plan', 'Wilayah & kunjungan'],
            ['submit', 'Periksa & ajukan'],
          ].map(([id, label]) => (
            <button
              type="button"
              className="app-button"
              key={id}
              onClick={() =>
                document
                  .getElementById(`registration-${id}`)
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
            >
              {label}
            </button>
          ))}
        </nav>
      </div>
      {/* ─── Baris Divisi & Cabang Operasional ──────────────────────────────── */}
      <RegistrationDivisionBar
        divisions={divisions}
        formData={formData}
        updateField={updateField}
      />

      <BusinessCodeInput
        entity="NOO"
        value={formData.registrationCode || ''}
        onChange={(value) => updateField('registrationCode', value)}
        disabled={isSubmitting || Boolean(formData.revisionId)}
      />
      {/* ─── BOX 1: IDENTITAS OUTLET ─────────────────────────────────────────── */}
      <section id="registration-identity" className="sales-registration-group">
        <h3>1. Identitas outlet</h3>
        <RegistrationIdentitySection
          LOCATION_OPTIONS={LOCATION_OPTIONS}
          formData={formData}
          handleNameChange={handleNameChange}
          handleSelectGooglePlace={handleSelectGooglePlace}
          handleUnlockGooglePlace={handleUnlockGooglePlace}
          hasSearched={hasSearched}
          isDebouncing={isDebouncing}
          isSearchingPlace={isSearchingPlace}
          placeSearchError={placeSearchError}
          placeSearchResults={placeSearchResults}
          setHasSearched={setHasSearched}
          settings={settings}
          updateField={updateField}
          verifiedPlace={verifiedPlace}
        />

        {/* ─── BOX 2: VALIDASI GOOGLE PLACE & TITIK GPS (DI BAWAH NAMA OUTLET) ─── */}
      </section>
      <section id="registration-location" className="sales-registration-group">
        <h3>2. Lokasi & dokumen</h3>
        <RegistrationLocationSection
          formData={formData}
          handleDetectGPS={handleDetectGPS}
          isLocating={isLocating}
          gpsError={gpsError}
          setIsOutletCameraOpen={setIsOutletCameraOpen}
          settings={settings}
          verifiedPlace={verifiedPlace}
        />

        {/* ─── BOX 3: JENIS PAJAK & DOKUMEN KTP/NPWP ────────────────────────────── */}
        <RegistrationTaxSection
          cardTypeLabel={cardTypeLabel}
          formData={formData}
          setIsKtpCameraOpen={setIsKtpCameraOpen}
          settings={settings}
          updateField={updateField}
        />

        {/* ─── BOX 4: AREA & WILAYAH ────────────────────────────────────────────── */}
      </section>
      <section id="registration-plan" className="sales-registration-group">
        <h3>3. Wilayah & rencana kunjungan</h3>
        <RegistrationAdditionalFields
          formData={formData}
          updateField={updateField}
          settings={settings}
        />
        <RegistrationTerritorySection
          clusters={clusters}
          formData={formData}
          updateField={updateField}
        />

        {/* ─── BOX 5: CHANNEL & SUB CHANNEL ─────────────────────────────────────── */}
        <RegistrationChannelSection
          GT_SUB_CHANNELS={GT_SUB_CHANNELS}
          MT_SUB_CHANNELS={MT_SUB_CHANNELS}
          TIERS={TIERS}
          formData={formData}
          updateField={updateField}
        />

        {/* ─── BOX 6: PAYMENT TERMS ─────────────────────────────────────────────── */}
        <RegistrationPaymentSection formData={formData} updateField={updateField} />

        {/* ─── BOX 7: KUNJUNGAN (CALL PLAN PJP) ─────────────────────────────────── */}
        <RegistrationVisitSection
          DAYS_LIST={DAYS_LIST}
          formData={formData}
          toggleDay={toggleDay}
          updateField={updateField}
        />
      </section>
      <section id="registration-submit" className="sales-registration-group">
        <h3>4. Periksa & ajukan</h3>
        {/* ─── BOX 8: MAPPING PATOKAN FISIK ────────────────────────────────────── */}
        <div className="border border-slate-700/80 rounded-xl overflow-hidden p-3.5 bg-surface space-y-2 text-xs">
          <label htmlFor="registration-landmark" className="font-black block text-sm">
            Patokan & petunjuk lokasi
          </label>
          <textarea
            id="registration-landmark"
            rows={3}
            value={formData.mappingLocation}
            onChange={(e) => updateField('mappingLocation', e.target.value)}
            className="w-full min-h-[96px] p-3 text-xs bg-transparent border border-slate-400 rounded-lg focus:border-primary outline-none resize-y"
            placeholder="Tuliskan deskripsi patokan fisik, ancer-ancer lokasi, ciri bangunan, atau petunjuk jalan menuju toko secara rinci..."
          />
        </div>

        {/* ─── Tombol Aksi Submit & Reset Terpadu di Dokumen ─────────────────────── */}
        <div className="pt-2 border-t-2 border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-[11px] text-on-surface-variant font-bold">
            * Pastikan seluruh data fisik outlet dan foto kamera telah sesuai sebelum mengajukan.
          </span>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={async () => {
                if (
                  await confirmAction('Kosongkan seluruh isian formulir ini?', {
                    title: 'Reset Formulir',
                    confirmLabel: 'Kosongkan',
                    danger: true,
                  })
                )
                  onReset();
              }}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border-2 border-slate-500 hover:bg-surface-container font-bold text-xs transition-all cursor-pointer"
            >
              Reset Formulir
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (!formData.revisionId && !featurePolicy.canStart)}
              title={!formData.revisionId ? featurePolicy.reason : undefined}
              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <LuSend className="text-sm" />
              <span>{isSubmitting ? 'Mengirim Pengajuan...' : 'Ajukan Registrasi Outlet'}</span>
            </button>
          </div>
        </div>
      </section>
      {/* ─── Hardware Camera Modals ───────────────────────────────────────────── */}
      <IdCardCameraModal
        policyValues={settings}
        isOpen={isKtpCameraOpen}
        onClose={() => setIsKtpCameraOpen(false)}
        onCapture={(photoDataUrl) => updateField('taxDocumentUrl', photoDataUrl)}
        cardType={cardTypeLabel}
        outletName={formData.name}
        division={formData.division}
      />

      <OutletCameraModal
        policyValues={settings}
        isOpen={isOutletCameraOpen}
        onClose={() => setIsOutletCameraOpen(false)}
        onCapture={(photoDataUrl) => updateField('photoUrl', photoDataUrl)}
        outletName={formData.name}
        latitude={formData.latitude}
        longitude={formData.longitude}
        division={formData.division}
      />
    </div>
  );
};
