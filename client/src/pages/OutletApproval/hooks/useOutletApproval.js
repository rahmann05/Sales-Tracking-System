import { useState, useEffect, useCallback } from 'react';
import { customerRegistrationsApi } from '../../../services/api';

/**
 * useOutletApproval Hook
 * Single Responsibility: Fetch approval queue data, filter by status & search, and execute approve/reject actions.
 */
export const useOutletApproval = () => {
  const [items, setItems] = useState([]);
  const [statusCounts, setStatusCounts] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('SUBMITTED');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedItem, setSelectedItem] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await customerRegistrationsApi.getAll({
        status: filterStatus === 'ALL' ? undefined : filterStatus,
        search: searchQuery || undefined,
        limit: 50,
      });
      if (res?.data) {
        setItems(res.data);
        setStatusCounts(res.statusCounts || {});
      }
    } catch (err) {
      console.warn('[useOutletApproval] Failed to load data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApprove = async (item) => {
    if (!window.confirm(`Setujui pengajuan registrasi outlet "${item.name}"?`)) return;
    setIsProcessing(true);
    try {
      await customerRegistrationsApi.approve(item.id);
      setFeedbackMsg({ type: 'success', text: `Outlet "${item.name}" berhasil disetujui!` });
      setSelectedItem(null);
      await loadData();
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Gagal menyetujui pengajuan' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Mohon isi alasan penolakan.');
      return;
    }
    setIsProcessing(true);
    try {
      await customerRegistrationsApi.reject(selectedItem.id, rejectReason);
      setFeedbackMsg({ type: 'success', text: `Outlet "${selectedItem.name}" telah ditolak.` });
      setIsRejectModalOpen(false);
      setSelectedItem(null);
      setRejectReason('');
      await loadData();
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Gagal menolak pengajuan' });
    } finally {
      setIsProcessing(false);
    }
  };

  return {
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
    setFeedbackMsg,
    handleApprove,
    handleReject,
    refreshData: loadData,
  };
};
