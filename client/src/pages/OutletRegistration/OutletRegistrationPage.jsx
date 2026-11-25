import React, { useState } from 'react';
import { useWorkspaceState } from '../../shared/hooks/useWorkspaceState';
import { LuCheck, LuInfo, LuFileText, LuClock, LuMaximize2, LuMinimize2 } from 'react-icons/lu';
import { useOutletRegistrationForm } from './hooks/useOutletRegistrationForm';
import { useOutletRegistrationHistory } from './hooks/useOutletRegistrationHistory';
import { PhysicalDocumentForm } from './components/PhysicalDocumentForm';
import { RegistrationHistoryTable } from './components/RegistrationHistoryTable';
import { RegistrationHistoryDetailModal } from './components/RegistrationHistoryDetailModal';
import '../../styles/pages/OutletRegistration.css';

/**
 * OutletRegistrationPage Orchestrator Component
 * Single Responsibility: Compose physical document form and history tab for Sales Outlet Registration.
 */
export const OutletRegistrationPage = () => {
  const [activeTab, setActiveTab] = useWorkspaceState('registrationView', 'FORM'); // 'FORM' | 'HISTORY'
  const [fitToScreen, setFitToScreen] = useState(true);

  const {
    submissions,
    historyError,
    isLoading: isLoadingHistory,
    selectedSubmission,
    setSelectedSubmission,
    refreshHistory,
  } = useOutletRegistrationHistory();

  const {
    formData,
    draftRestored,
    draftNotice,
    draftError,
    updateField,
    isSubmitting,
    isLocating,
    gpsError,
    isSearchingPlace,
    placeSearchError,
    placeSearchResults,
    verifiedPlace,
    submitSuccess,
    submitError,
    handleDetectGPS,
    searchGooglePlaces,
    handleSelectGooglePlace,
    handleUnlockGooglePlace,
    toggleDay,
    resetForm,
    submitForm,
    startRevision,
  } = useOutletRegistrationForm(() => {
    refreshHistory();
    setTimeout(() => setActiveTab('HISTORY'), 1800);
  });

  const isFormTab = activeTab === 'FORM';
  const containerClass = isFormTab
    ? `outlet-reg-container is-noo-form${fitToScreen ? ' is-noo-fit' : ' is-noo-zoom-free'}`
    : 'outlet-reg-container pb-32';

  return (
    <div className={containerClass}>
      <header className="noo-page-bar">
        <div className="noo-page-title">
          <span className="noo-page-eyebrow">Pelanggan / Pengajuan</span>
          <h1>Outlet baru</h1>
        </div>
        <div className="noo-page-controls">
          <div className="noo-tab-switch" role="tablist" aria-label="Tampilan pengajuan outlet">
            <button
              type="button"
              role="tab"
              aria-selected={isFormTab}
              onClick={() => setActiveTab('FORM')}
              className={`noo-tab-btn${isFormTab ? ' is-active' : ''}`}
            >
              <LuFileText aria-hidden="true" /> Daftarkan outlet
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={!isFormTab}
              onClick={() => setActiveTab('HISTORY')}
              className={`noo-tab-btn${!isFormTab ? ' is-active' : ''}`}
            >
              <LuClock aria-hidden="true" /> Riwayat pengajuan
            </button>
          </div>
          {isFormTab ? (
            <button
              type="button"
              className="noo-zoom-toggle"
              aria-pressed={fitToScreen}
              onClick={() => setFitToScreen((v) => !v)}
              title={fitToScreen ? 'Perbesar ke skala 100%' : 'Sesuaikan lebar lembar ke layar'}
            >
              {fitToScreen ? (
                <>
                  <LuMaximize2 aria-hidden="true" /> Zoom 100%
                </>
              ) : (
                <>
                  <LuMinimize2 aria-hidden="true" /> Pas lebar layar
                </>
              )}
            </button>
          ) : null}
        </div>
      </header>

      {draftRestored ? (
        <p role="status" className="noo-notice-banner">
          {draftNotice} Ambil ulang GPS, foto outlet, dan foto dokumen sebelum mengajukan.
        </p>
      ) : null}
      {draftError ? (
        <p role="alert" className="app-error">
          {draftError}
        </p>
      ) : null}

      {isFormTab ? (
        <form onSubmit={submitForm} className="noo-form-shell">
          {formData.revisionId ? (
            <div className="noo-revision-banner">
              <span>
                Memperbaiki pengajuan <strong>{formData.registrationCode}</strong>
              </span>
              <input
                type="text"
                aria-label="Penjelasan perbaikan"
                required
                minLength={10}
                maxLength={1000}
                placeholder="Penjelasan perbaikan (min. 10 karakter)…"
                value={formData.revisionReason || ''}
                onChange={(e) => updateField('revisionReason', e.target.value)}
              />
            </div>
          ) : null}

          {submitSuccess ? (
            <div role="status" className="noo-success-banner">
              <LuCheck aria-hidden="true" />
              <span>
                <strong>Pengajuan berhasil dikirim!</strong> Outlet &quot;{submitSuccess.name}&quot;
                tersimpan — pantau pada Riwayat pengajuan.
              </span>
            </div>
          ) : null}

          {submitError ? (
            <div role="alert" className="noo-error-banner">
              <LuInfo aria-hidden="true" />
              <span>{submitError}</span>
            </div>
          ) : null}

          {submitError.includes('Kemungkinan outlet ganda') ? (
            <div className="noo-revision-banner">
              <span>Alasan bukan outlet ganda:</span>
              <input
                type="text"
                aria-label="Alasan outlet berbeda dari kandidat ganda"
                required
                minLength={10}
                maxLength={1000}
                placeholder="Jelaskan perbedaan outlet ini (min. 10 karakter)…"
                value={formData.duplicateReason || ''}
                onChange={(e) => updateField('duplicateReason', e.target.value)}
              />
            </div>
          ) : null}

          <fieldset disabled={isSubmitting} className="sales-registration-fieldset noo-fieldset-shell">
            <PhysicalDocumentForm
              formData={formData}
              updateField={updateField}
              isSearchingPlace={isSearchingPlace}
              placeSearchError={placeSearchError}
              placeSearchResults={placeSearchResults}
              verifiedPlace={verifiedPlace}
              searchGooglePlaces={searchGooglePlaces}
              handleSelectGooglePlace={handleSelectGooglePlace}
              handleUnlockGooglePlace={handleUnlockGooglePlace}
              isLocating={isLocating}
              gpsError={gpsError}
              handleDetectGPS={handleDetectGPS}
              toggleDay={toggleDay}
              onReset={resetForm}
              isSubmitting={isSubmitting}
              fitToScreen={fitToScreen}
            />
          </fieldset>
        </form>
      ) : null}

      {activeTab === 'HISTORY' ? (
        <RegistrationHistoryTable
          submissions={submissions}
          error={historyError}
          isLoading={isLoadingHistory}
          onRefresh={refreshHistory}
          onSelectDetail={setSelectedSubmission}
        />
      ) : null}

      {selectedSubmission ? (
        <RegistrationHistoryDetailModal
          item={selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          onRevise={(item) => {
            startRevision(item);
            setSelectedSubmission(null);
            setActiveTab('FORM');
          }}
        />
      ) : null}
    </div>
  );
};
