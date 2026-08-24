import React, { useState } from 'react';
import { LuSend, LuCheck, LuInfo, LuFileText, LuClock } from 'react-icons/lu';
import { useApp } from '../../context/AppContext';
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
  const { user } = useApp();
  const [activeTab, setActiveTab] = useState('FORM'); // 'FORM' | 'HISTORY'

  const {
    submissions,
    isLoading: isLoadingHistory,
    selectedSubmission,
    setSelectedSubmission,
    refreshHistory,
  } = useOutletRegistrationHistory();

  const {
    formData,
    updateField,
    isSubmitting,
    isLocating,
    isSearchingPlace,
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
  } = useOutletRegistrationForm(() => {
    refreshHistory();
    setTimeout(() => setActiveTab('HISTORY'), 1800);
  });

  return (
    <div className="outlet-reg-container pb-32">
      {/* Tab Switcher Minimalis */}
      <div className="flex items-center justify-end max-w-5xl mx-auto mb-4">
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
            <LuFileText className="text-sm" /> Formulir Pendaftaran
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
            <LuClock className="text-sm" /> Riwayat Pengajuan ({submissions.length})
          </button>
        </div>
      </div>

      {/* 2. Formulir Registrasi (Format Dokumen Fisik Resmi) */}
      {activeTab === 'FORM' && (
        <form onSubmit={submitForm} className="space-y-6 pb-20">
          {submitSuccess && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-sm flex items-center gap-2 max-w-5xl mx-auto">
              <LuCheck className="text-lg shrink-0" />
              <div>
                <strong>Pengajuan Berhasil Disubmit!</strong>
                <p className="text-xs m-0 mt-0.5">
                  Pengajuan pendaftaran outlet &quot;{submitSuccess.name}&quot; telah dikirimkan ke Supervisor dan Manajer Operasional untuk persetujuan.
                </p>
              </div>
            </div>
          )}

          {submitError && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 text-sm flex items-center gap-2 max-w-5xl mx-auto">
              <LuInfo className="text-lg shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Authentic Physical Document Form Layout */}
          <PhysicalDocumentForm
            formData={formData}
            updateField={updateField}
            isSearchingPlace={isSearchingPlace}
            placeSearchResults={placeSearchResults}
            verifiedPlace={verifiedPlace}
            searchGooglePlaces={searchGooglePlaces}
            handleSelectGooglePlace={handleSelectGooglePlace}
            handleUnlockGooglePlace={handleUnlockGooglePlace}
            isLocating={isLocating}
            handleDetectGPS={handleDetectGPS}
            toggleDay={toggleDay}
            onReset={resetForm}
            isSubmitting={isSubmitting}
          />
        </form>
      )}

      {/* 3. Riwayat Pengajuan Sales */}
      {activeTab === 'HISTORY' && (
        <RegistrationHistoryTable
          submissions={submissions}
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
        />
      )}
    </div>
  );
};
