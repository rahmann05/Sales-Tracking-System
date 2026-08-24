import React, { useState } from 'react';
import { LuSend, LuCheck, LuInfo } from 'react-icons/lu';
import { useApp } from '../../context/AppContext';
import { useOutletRegistrationForm } from './hooks/useOutletRegistrationForm';
import { useOutletRegistrationHistory } from './hooks/useOutletRegistrationHistory';
import { OutletRegistrationHeader } from './components/OutletRegistrationHeader';
import { DivisionBranchSection } from './components/DivisionBranchSection';
import { OutletIdentitySection } from './components/OutletIdentitySection';
import { TaxLegalSection } from './components/TaxLegalSection';
import { GeoMapSection } from './components/GeoMapSection';
import { ChannelSubChannelSection } from './components/ChannelSubChannelSection';
import { PaymentTermsSection } from './components/PaymentTermsSection';
import { PjpScheduleSection } from './components/PjpScheduleSection';
import { LocationMappingSection } from './components/LocationMappingSection';
import { RegistrationHistoryTable } from './components/RegistrationHistoryTable';
import { RegistrationHistoryDetailModal } from './components/RegistrationHistoryDetailModal';
import '../../styles/pages/OutletRegistration.css';

/**
 * OutletRegistrationPage Orchestrator Component
 * Single Responsibility: Compose header, form sections, and history tab for Sales Outlet Registration.
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
    handlePhotoUpload,
    handleTaxDocUpload,
    toggleDay,
    resetForm,
    submitForm,
  } = useOutletRegistrationForm(() => {
    refreshHistory();
    setTimeout(() => setActiveTab('HISTORY'), 1800);
  });

  return (
    <div className="outlet-reg-container">
      {/* 1. Header Card */}
      <OutletRegistrationHeader
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        division={formData.division}
        submissionsCount={submissions.length}
      />

      {/* 2. Formulir Pendaftaran Baru */}
      {activeTab === 'FORM' && (
        <form onSubmit={submitForm}>
          {submitSuccess && (
            <div className="mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-sm flex items-center gap-2">
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
            <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 text-sm flex items-center gap-2">
              <LuInfo className="text-lg shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Kolom Kiri: Identitas, Divisi, Pajak & Mapping Patokan (4 Sections) */}
            <div className="space-y-6">
              <DivisionBranchSection
                division={formData.division}
                branch={formData.branch}
                onChange={updateField}
              />

              <OutletIdentitySection
                name={formData.name}
                ownerName={formData.ownerName}
                address={formData.address}
                area={formData.area}
                subAreaKecamatan={formData.subAreaKecamatan}
                kelurahan={formData.kelurahan}
                phone={formData.phone}
                locationType={formData.locationType}
                isSearchingPlace={isSearchingPlace}
                placeSearchResults={placeSearchResults}
                verifiedPlace={verifiedPlace}
                onSearchGooglePlaces={searchGooglePlaces}
                onSelectGooglePlace={handleSelectGooglePlace}
                onUnlockGooglePlace={handleUnlockGooglePlace}
                onChange={updateField}
              />

              <TaxLegalSection
                taxType={formData.taxType}
                taxNumber={formData.taxNumber}
                taxName={formData.taxName}
                taxAddress={formData.taxAddress}
                taxDocumentUrl={formData.taxDocumentUrl}
                outletName={formData.name}
                division={formData.division}
                onChange={updateField}
              />

              <LocationMappingSection
                mappingLocation={formData.mappingLocation}
                salesmanName={user?.name}
                division={formData.division}
                onChange={updateField}
              />
            </div>

            {/* Kolom Kanan: Peta Google Place, Channel, Payment & Jadwal PJP (4 Sections) */}
            <div className="space-y-6">
              <GeoMapSection
                latitude={formData.latitude}
                longitude={formData.longitude}
                photoUrl={formData.photoUrl}
                outletName={formData.name}
                division={formData.division}
                isLocating={isLocating}
                verifiedPlace={verifiedPlace}
                onDetectGPS={handleDetectGPS}
                onChange={updateField}
              />

              <ChannelSubChannelSection
                channel={formData.channel}
                subChannel={formData.subChannel}
                channelTier={formData.channelTier}
                onChange={updateField}
              />

              <PaymentTermsSection
                paymentType={formData.paymentType}
                cashMethod={formData.cashMethod}
                termOfPaymentDays={formData.termOfPaymentDays}
                onChange={updateField}
              />

              <PjpScheduleSection
                visitWeekSchedule={formData.visitWeekSchedule}
                visitDays={formData.visitDays}
                onToggleDay={toggleDay}
                onChange={updateField}
              />
            </div>
          </div>

          {/* Submit Action Bar */}
          <div className="mt-6 flex items-center justify-end gap-3 p-4 bg-surface rounded-2xl border border-border-glass shadow-md">
            <button
              type="button"
              onClick={resetForm}
              className="outlet-reg-btn-outline"
            >
              Reset Formulir
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="outlet-reg-btn-primary"
            >
              <LuSend /> {isSubmitting ? 'Mengirim Pengajuan...' : 'Ajukan Registrasi Outlet'}
            </button>
          </div>
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
