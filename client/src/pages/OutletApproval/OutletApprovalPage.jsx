import React,{useState} from 'react';
import {AdminFinalizeModal} from '../OutletRegistrationReport/components/AdminFinalizeModal';
import {customerRegistrationsApi} from '../../services/api';
import '../../styles/pages/OutletWorkspace.css';
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
 * Single Responsibility: Compose header, queue table, and review/reject modals for Supervisor & Admin.
 */
export const OutletApprovalPage = () => {
  const { user } = useApp();
  const [activation,setActivation]=useState(null),[activating,setActivating]=useState(false),[activationError,setActivationError]=useState('');
  const canApprove=['ADMIN','SUPERVISOR'].includes(user?.role)&&user.permissions?.can_approve_outlet!==false;

  const {
    items,
    statusCounts,
    isLoading,
    loadError,
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
    page,setPage,pagination,
  } = useOutletApproval();
  const finalize=async(id,customerCode,clusterId,duplicateReason)=>{setActivating(true);setActivationError('');try{await customerRegistrationsApi.finalize(id,{customerCode,clusterId,duplicateReason:duplicateReason||undefined});setActivation(null);await refreshData();}catch(error){setActivationError(error.message);}finally{setActivating(false);}};

  return (
    <div className="outlet-reg-container">
      {/* 1. Header with Filters & Search */}
      <OutletApprovalHeader
        userRole={user?.role}
        items={items}
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
      {loadError ? <div role="alert" className="app-error"><p>{loadError}</p><button type="button" className="app-button" onClick={refreshData}>Coba lagi</button></div> : <OutletApprovalTable
        items={items}
        isLoading={isLoading}
        onReview={setSelectedItem}
      />}
      <div className="outlet-pagination"><button type="button" className="app-button" disabled={isLoading||page<=1} onClick={()=>setPage(page-1)}>Sebelumnya</button><span>{pagination.total} pengajuan · {page} / {Math.max(1,pagination.totalPages)}</span><button type="button" className="app-button" disabled={isLoading||page>=pagination.totalPages} onClick={()=>setPage(page+1)}>Berikutnya</button></div>
      {activationError&&<p className="app-error" role="alert">{activationError}</p>}

      {/* 4. Review Detail Modal */}
      {selectedItem && (
        <OutletApprovalReviewModal
          item={selectedItem}
          userRole={user?.role}
          isProcessing={isProcessing}
          onClose={() => setSelectedItem(null)}
          onApprove={handleApprove}
          onOpenReject={() => setIsRejectModalOpen(true)}
          canApprove={canApprove}
          onActivate={item=>{setSelectedItem(null);setActivationError('');setActivation(item);}}
        />
      )}
      {activation&&<AdminFinalizeModal error={activationError} item={activation} isProcessing={activating} onClose={()=>setActivation(null)} onConfirmFinalize={finalize}/>}

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
