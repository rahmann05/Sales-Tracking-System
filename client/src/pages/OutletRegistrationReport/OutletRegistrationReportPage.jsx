import React from 'react';
import { LuCheck, LuInfo } from 'react-icons/lu';
import { useOutletRegistrationReport } from './hooks/useOutletRegistrationReport';
import { OutletReportHeader } from './components/OutletReportHeader';
import { OutletReportFilterBar } from './components/OutletReportFilterBar';
import { OutletReportTable } from './components/OutletReportTable';
import { AdminFinalizeModal } from './components/AdminFinalizeModal';
import { OfficialFormPdfView } from './components/OfficialFormPdfView';
import { NikManagementModal } from './components/NikManagementModal';
import '../../styles/pages/OutletRegistration.css';

/**
 * OutletRegistrationReportPage Orchestrator Component
 * Single Responsibility: Compose report header, filters, master table, and modal actions for Admin.
 */
export const OutletRegistrationReportPage = () => {
  const {
    data,
    statusCounts,
    isLoading,
    filters,
    updateFilter,
    finalizeTarget,
    setFinalizeTarget,
    pdfTarget,
    setPdfTarget,
    isNikModalOpen,
    setIsNikModalOpen,
    isProcessing,
    feedbackMsg,
    handleFinalize,
    exportToCSV,
    exportToNd6TXT,
    exportToTXT,
    exportToNikExcel,
    refreshData,
  } = useOutletRegistrationReport();

  return (
    <div className="outlet-reg-container">
      {/* 1. Header & Export Actions */}
      <OutletReportHeader
        totalCount={data.length}
        onExportCSV={exportToCSV}
        onExportNd6TXT={exportToNd6TXT}
        onExportTXT={exportToTXT}
        onExportNikExcel={exportToNikExcel}
        onOpenNikModal={() => setIsNikModalOpen(true)}
      />

      {/* 2. Feedback Message Toast */}
      {feedbackMsg && (
        <div
          className={`mb-4 p-4 rounded-xl text-sm flex items-center gap-2 border ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700'
              : 'bg-red-500/10 border-red-500/30 text-red-700'
          }`}
        >
          {feedbackMsg.type === 'success' ? <LuCheck /> : <LuInfo />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* 3. Filter Bar */}
      <OutletReportFilterBar
        filters={filters}
        onUpdateFilter={updateFilter}
        onReset={() => {}}
      />

      {/* 4. Master Report Table */}
      <OutletReportTable
        data={data}
        isLoading={isLoading}
        onOpenPdf={setPdfTarget}
        onOpenFinalize={setFinalizeTarget}
      />

      {/* 5. Admin Finalize & Activation Modal */}
      {finalizeTarget && (
        <AdminFinalizeModal
          item={finalizeTarget}
          isProcessing={isProcessing}
          onClose={() => setFinalizeTarget(null)}
          onConfirmFinalize={handleFinalize}
        />
      )}

      {/* 6. Official Printable Form PDF View */}
      {pdfTarget && (
        <OfficialFormPdfView
          data={pdfTarget}
          onClose={() => setPdfTarget(null)}
        />
      )}

      {/* 7. NIK Management & Verification Modal */}
      <NikManagementModal
        isOpen={isNikModalOpen}
        onClose={() => setIsNikModalOpen(false)}
        customerList={data}
        onDataUpdated={refreshData}
      />
    </div>
  );
};
