import {
  DEFAULT_REGISTRATION_SUBMIT_REQUIRED_FIELDS,
  requiredRegistrationFields,
} from '../../../../../shared/registration-fields.mjs';
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
import '../../../styles/pages/OutletRegistrationPaper.css';
import {
  LOCATION_OPTIONS,
  MT_SUB_CHANNELS,
  GT_SUB_CHANNELS,
  TIERS,
  DAYS_LIST,
} from '../constants/registrationOptions';

/**
 * PhysicalDocumentForm Component
 * Formulir isian NOO yang mengikuti formulir kertas "FORM REGISTRASI OUTLET": kotak bergaris,
 * isian titik-titik, dan pilihan bertanda V. Ruang pengecekan API dan foto tetap tersedia.
 * `fitToScreen` true: lembar menyesuaikan lebar layar (kolom ditumpuk di layar sempit);
 * false: lembar tetap selebar kertas ("Zoom 100%") dan dapat digulir ke samping.
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
  fitToScreen = true,
}) => {
  const featurePolicy = useFeaturePolicy('REGISTRATION');
  const { clusters, divisions, settings: liveSettings } = useApp();
  const settings = formData.revisionId
    ? { ...liveSettings, ...formData.revisionPolicyValues }
    : liveSettings;
  const requiredFields = requiredRegistrationFields(
    formData.revisionPolicyValues?.REGISTRATION_SUBMIT_REQUIRED_FIELDS ??
      settings.REGISTRATION_SUBMIT_REQUIRED_FIELDS ??
      DEFAULT_REGISTRATION_SUBMIT_REQUIRED_FIELDS
  );

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
    <>
      <div className="npf-stage" data-fit={fitToScreen}>
        <div className="npf-sheet">
          <header className="npf-head">
            <div className="npf-brand">
              <img src="/logo-mark.png" alt="" />
              <div>
                <b>CV. SINAR ANUGRAH</b>
                <small>FMCG DISTRIBUTOR</small>
              </div>
            </div>
            <h2 className="npf-title">FORM REGISTRASI OUTLET</h2>
            <div className="npf-code">
              <BusinessCodeInput
                entity="NOO"
                value={formData.registrationCode || ''}
                onChange={(value) => updateField('registrationCode', value)}
                disabled={isSubmitting || Boolean(formData.revisionId)}
              />
            </div>
          </header>

          <RegistrationDivisionBar
            divisions={divisions}
            formData={formData}
            updateField={updateField}
          />

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
            requiredFields={requiredFields}
            setHasSearched={setHasSearched}
            settings={settings}
            updateField={updateField}
            verifiedPlace={verifiedPlace}
          />

          <RegistrationLocationSection
            formData={formData}
            handleDetectGPS={handleDetectGPS}
            isLocating={isLocating}
            gpsError={gpsError}
            setIsOutletCameraOpen={setIsOutletCameraOpen}
            settings={settings}
            verifiedPlace={verifiedPlace}
          />

          <RegistrationTaxSection
            cardTypeLabel={cardTypeLabel}
            formData={formData}
            requiredFields={requiredFields}
            setIsKtpCameraOpen={setIsKtpCameraOpen}
            settings={settings}
            updateField={updateField}
          />

          <RegistrationTerritorySection
            clusters={clusters}
            formData={formData}
            requiredFields={requiredFields}
            updateField={updateField}
          />

          <RegistrationChannelSection
            GT_SUB_CHANNELS={GT_SUB_CHANNELS}
            MT_SUB_CHANNELS={MT_SUB_CHANNELS}
            TIERS={TIERS}
            formData={formData}
            updateField={updateField}
          />

          <RegistrationPaymentSection
            formData={formData}
            requiredFields={requiredFields}
            updateField={updateField}
          />

          <RegistrationVisitSection
            DAYS_LIST={DAYS_LIST}
            formData={formData}
            requiredFields={requiredFields}
            toggleDay={toggleDay}
            updateField={updateField}
          />

          <p className="npf-footnote">* Beri tanda V pada kolom pilihan</p>

          <section className="npf-block npf-mapping">
            <label htmlFor="registration-landmark" className="npf-heading">
              Mapping lokasi :
              {requiredFields.includes('mappingLocation') ? (
                <span className="npf-req" aria-hidden="true">
                  {' '}
                  *
                </span>
              ) : null}
            </label>
            <textarea
              id="registration-landmark"
              name="mappingLocation"
              required={requiredFields.includes('mappingLocation')}
              rows={6}
              value={formData.mappingLocation || ''}
              onChange={(e) => updateField('mappingLocation', e.target.value)}
              placeholder="Ciri bangunan, sebelah kiri/kanan patokan jalan, atau petunjuk rute menuju toko…"
            />
          </section>

          <footer id="registration-submit" className="npf-actions">
            <span>
              <span className="npf-req">*</span> Wajib dilengkapi sesuai standar dokumen NOO
              sebelum diajukan.
            </span>
            <div>
              <button
                type="button"
                className="npf-btn"
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
              >
                Reset
              </button>
              <button
                type="submit"
                className="npf-btn npf-btn--primary"
                disabled={isSubmitting || (!formData.revisionId && !featurePolicy.canStart)}
                title={!formData.revisionId ? featurePolicy.reason : undefined}
              >
                <LuSend aria-hidden="true" />
                <span>{isSubmitting ? 'Mengirim…' : 'Ajukan Registrasi Outlet'}</span>
              </button>
            </div>
          </footer>
        </div>
      </div>

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
    </>
  );
};
