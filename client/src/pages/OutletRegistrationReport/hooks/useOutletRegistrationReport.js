import { useState, useEffect, useCallback } from 'react';
import { customerRegistrationsApi } from '../../../services/api';
import {
  exportCustomerExcel,
  exportCustomerNd6Txt,
  exportCustomerSummaryTxt,
  exportImportNikExcel,
} from '../../../utils/customerExport';

/**
 * useOutletRegistrationReport Hook
 * Single Responsibility: Manage data filtering, Admin activation, and Excel/CSV/TXT file exports.
 */
export const useOutletRegistrationReport = () => {
  const [data, setData] = useState([]);
  const [statusCounts, setStatusCounts] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [filters, setFilters] = useState({
    status: 'ALL',
    area: 'ALL',
    channel: 'ALL',
    division: 'ALL',
    search: '',
    startDate: '',
    endDate: '',
  });

  // Modal states
  const [finalizeTarget, setFinalizeTarget] = useState(null);
  const [pdfTarget, setPdfTarget] = useState(null);
  const [isNikModalOpen, setIsNikModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const updateFilter = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const loadReportData = useCallback(async () => {
    setIsLoading(true);
    try {
      const query = {
        limit: 100,
        status: filters.status === 'ALL' ? undefined : filters.status,
        area: filters.area === 'ALL' ? undefined : filters.area,
        channel: filters.channel === 'ALL' ? undefined : filters.channel,
        division: filters.division === 'ALL' ? undefined : filters.division,
        search: filters.search || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      };

      const res = await customerRegistrationsApi.getAll(query);
      if (res?.data) {
        setData(res.data);
        setStatusCounts(res.statusCounts || {});
      }
    } catch (err) {
      console.warn('[useOutletRegistrationReport] Load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  // Admin Finalize Action
  const handleFinalize = async (id, customerCode, clusterId) => {
    setIsProcessing(true);
    try {
      await customerRegistrationsApi.finalize(id, { customerCode, clusterId });
      setFeedbackMsg({
        type: 'success',
        text: `Outlet berhasil diinput ke sistem aktif dengan Kode Outlet "${customerCode}"!`,
      });
      setFinalizeTarget(null);
      await loadReportData();
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Gagal mendaftarkan outlet ke sistem' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Export to Excel (Styled ND6 Master .xls)
  const exportToCSV = () => {
    exportCustomerExcel(data, `IMPORT_CUSTOMER_ND6_MASTER_${new Date().toISOString().split('T')[0]}.xls`);
  };

  // Export to ND6 TXT Format
  const exportToNd6TXT = () => {
    exportCustomerNd6Txt(data, `IMPORT_CUSTOMER_ND6_${new Date().toISOString().split('T')[0]}.txt`);
  };

  // Export to Human Readable TXT
  const exportToTXT = () => {
    exportCustomerSummaryTxt(data, `Ringkasan_Registrasi_Outlet_${new Date().toISOString().split('T')[0]}.txt`);
  };

  // Export to Official IMPORT NIK Excel (.xls)
  const exportToNikExcel = () => {
    exportImportNikExcel(data, `IMPORT_NIK_${new Date().toISOString().split('T')[0]}.xls`);
  };

  return {
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
    setFeedbackMsg,
    handleFinalize,
    exportToCSV,
    exportToNd6TXT,
    exportToTXT,
    exportToNikExcel,
    refreshData: loadReportData,
  };
};
