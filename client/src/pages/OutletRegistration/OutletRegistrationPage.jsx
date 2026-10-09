import React from 'react';
import {useWorkspaceState} from '../../shared/hooks/useWorkspaceState';
import { LuCheck, LuInfo, LuFileText, LuClock } from "react-icons/lu";
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
  const [activeTab, setActiveTab] = useWorkspaceState('registrationView','FORM'); // 'FORM' | 'HISTORY'

  const {
    submissions,historyError,
    isLoading: isLoadingHistory,
    selectedSubmission,
    setSelectedSubmission,
    refreshHistory,
  } = useOutletRegistrationHistory();

  const {
    formData,draftRestored,draftError,
    updateField,
    isSubmitting,
    isLocating,gpsError,
    isSearchingPlace,placeSearchError,
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

  return (
    <div className="outlet-reg-container pb-32">
      <header className="sales-heading"><div><p className="admin-eyebrow">Pelanggan / Pengajuan</p><h1>Outlet baru</h1><p>Lengkapi identitas, lokasi, dan rencana kunjungan. Pantau keputusan pengajuan melalui Riwayat.</p></div></header>
      {/* Tab Switcher Minimalis */}
      <div className="flex items-center justify-start mb-0">
        <div className="flex bg-surface-container rounded-xl p-1 border border-border-glass shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab('FORM')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'FORM'
                ? 'bg-primary text-white shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <LuFileText className="text-sm" /> Daftarkan outlet
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('HISTORY')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'HISTORY'
                ? 'bg-primary text-white shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <LuClock className="text-sm" /> Riwayat pengajuan
          </button>
        </div>
      </div>

      {draftRestored&&<p role="status" className="sales-form-help">Draft teks dipulihkan. Ambil ulang GPS, foto outlet, dan foto dokumen sebelum mengajukan.</p>}{draftError&&<p role="alert" className="app-error">{draftError}</p>}
      {/* 2. Formulir Registrasi (Format Dokumen Fisik Resmi) */}
      {activeTab === 'FORM' && (
        <form onSubmit={submitForm} className="space-y-6 pb-20">
          {formData.revisionId&&<div className="app-form"><p>Memperbaiki pengajuan {formData.registrationCode}. Kode dan riwayat pengajuan tetap digunakan.</p><label className="app-field">Penjelasan perbaikan<textarea required minLength={10} maxLength={1000} value={formData.revisionReason || ''} onChange={e=>updateField('revisionReason',e.target.value)}/></label></div>}
          {submitSuccess && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-sm flex items-center gap-2 max-w-5xl mx-auto">
              <LuCheck className="text-lg shrink-0" />
              <div>
                <strong>Pengajuan Berhasil Disubmit!</strong>
                <p className="text-xs m-0 mt-0.5">
                  Pengajuan pendaftaran outlet &quot;{submitSuccess.name}&quot; telah tersimpan. Lihat tahap pemeriksaan dan aktivasi pada Riwayat.
                </p>
              </div>
            </div>
          )}

          {submitError && (
            <div role="alert" className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 text-sm flex items-center gap-2 max-w-5xl mx-auto">
              <LuInfo className="text-lg shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {submitError.includes('Kemungkinan outlet ganda')&&<label className="app-field">Alasan outlet ini berbeda dari kandidat yang disebutkan<textarea required minLength={10} maxLength={1000} value={formData.duplicateReason || ''} onChange={e=>updateField('duplicateReason',e.target.value)}/></label>}
          {/* Authentic Physical Document Form Layout */}
          <fieldset disabled={isSubmitting} className="sales-registration-fieldset"><PhysicalDocumentForm
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
          /></fieldset>
        </form>
      )}

      {/* 3. Riwayat Pengajuan Sales */}
      {activeTab === 'HISTORY' && (
        <RegistrationHistoryTable
          submissions={submissions}
          error={historyError}
          isLoading={isLoadingHistory}
          onRefresh={refreshHistory}
          onSelectDetail={setSelectedSubmission}
        />
      )}

      {/* 4. Detail Modal */}
      {selectedSubmission && (
        <RegistrationHistoryDetailModal
          item={selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          onRevise={item=>{startRevision(item);setSelectedSubmission(null);setActiveTab('FORM');}}
        />
      )}
    </div>
  );
};
