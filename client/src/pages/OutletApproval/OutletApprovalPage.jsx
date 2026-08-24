import React from 'react';
import { LuCheck, LuInfo } from 'react-icons/lu';
import { useApp } from '../../context/AppContext';
import { useOutletApproval } from './hooks/useOutletApproval';
import { OutletApprovalHeader } from './components/OutletApprovalHeader';
import { OutletApprovalTable } from './components/OutletApprovalTable';
import { OutletApprovalReviewModal } from './components/OutletApprovalReviewModal';
import { OutletApprovalRejectModal } from './components/OutletApprovalRejectModal';
import '../../styles/pages/OutletRegistration.css';

/**
 * OutletApprovalPage Orchestrator Component
 * Single Responsibility: Compose header, queue table, and review/reject modals for Supervisor & Ops Manager.
 */
export const OutletApprovalPage = () => {
  const { user } = useApp();

  const {
    items,
    statusCounts,
    isLoading,
    filterStatus,
    setFilterStatus,
    searchQuery,
    setSearchQuery,
    selectedItem,
    setSelectedItem,
    isProcessing,
    isRejectModalOpen,
    setIsRejectModalOpen,
    rejectReason,
    setRejectReason,
    feedbackMsg,
    handleApprove,
    handleReject,
    refreshData,
  } = useOutletApproval();

  return (
    <div className="outlet-reg-container">
      {/* 1. Header with Filters & Search */}
      <OutletApprovalHeader
        userRole={user?.role}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterStatus={filterStatus}
        onSelectFilter={setFilterStatus}
        statusCounts={statusCounts}
        onRefresh={refreshData}
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

      {/* 3. Approval Table Queue */}
      <OutletApprovalTable
        items={items}
        isLoading={isLoading}
        onReview={setSelectedItem}
      />

      {/* 4. Review Detail Modal */}
      {selectedItem && (
        <OutletApprovalReviewModal
          item={selectedItem}
          isProcessing={isProcessing}
          onClose={() => setSelectedItem(null)}
          onApprove={handleApprove}
          onOpenReject={() => setIsRejectModalOpen(true)}
        />
      )}

      {/* 5. Reject Reason Modal */}
      <OutletApprovalRejectModal
        isOpen={isRejectModalOpen}
        reason={rejectReason}
        isProcessing={isProcessing}
        onChangeReason={setRejectReason}
        onClose={() => {
          setIsRejectModalOpen(false);
          setRejectReason('');
        }}
        onConfirmReject={handleReject}
      />
    </div>
  );
};
