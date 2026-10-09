import { useState, useEffect, useCallback, useRef } from 'react';
import { customerRegistrationsApi } from '../../../services/api';
import { useDebounce } from '../../../shared/hooks/useDebounce';

/**
 * useOutletApproval Hook
 * Single Responsibility: Fetch approval queue data, filter by status & search, and execute approve/reject actions.
 */
export const useOutletApproval = () => {
  const [items, setItems] = useState([]);
  const [page,setPage]=useState(1),[pagination,setPagination]=useState({total:0,totalPages:1});
  const [statusCounts, setStatusCounts] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const loadRevision = useRef(0);
  const [filterStatus, setFilterStatus] = useState('SUBMITTED');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const [selectedItem, setSelectedItem] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const loadData = useCallback(async () => {
    const revision = ++loadRevision.current;
    setIsLoading(true);
    setLoadError('');
    setItems([]);
    setStatusCounts({});
    try {
      const res = await customerRegistrationsApi.getAll({
        status: filterStatus === 'ALL' ? undefined : filterStatus,
        search: debouncedSearch || undefined,
        limit: 50,
        page,
      });
      if (!Array.isArray(res?.data)) throw new Error('Respons pengajuan outlet belum dapat dibaca.');
      if (revision === loadRevision.current) {
        setItems(res.data);
        setStatusCounts(res.statusCounts || {});
        setPagination(res.pagination);
      }
    } catch (err) {
      if (revision === loadRevision.current) setLoadError(err.message || 'Gagal memuat pengajuan outlet.');
    } finally {
      if (revision === loadRevision.current) setIsLoading(false);
    }
  }, [filterStatus, debouncedSearch,page]);

  useEffect(() => {
    loadData();
    return () => { loadRevision.current++; };
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
    loadError,
    filterStatus,
    setFilterStatus:value=>{setFilterStatus(value);setPage(1);},
    searchQuery,
    setSearchQuery:value=>{setSearchQuery(value);setPage(1);},
    page,setPage,pagination,
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
