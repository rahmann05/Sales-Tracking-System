import { useState, useEffect, useCallback } from 'react';
import { customerRegistrationsApi } from '../../../services/api';
import { useApp } from '../../../context/AppContext';
import { useConfiguredFilters } from '../../../shared/hooks/useConfiguredFilters';
import { reportDateRange } from '../../../../../shared/report-filter-defaults.mjs';
import { exportCustomerNd6Txt } from '../../../utils/customerExport';
import { exportOutletMaster } from '../../../utils/export/reports/outletMasterExport';
import { exportImportNik } from '../../../utils/export/documents/importNikExport';

/**
 * useOutletRegistrationReport Hook
 * Single Responsibility: Manage data filtering, Admin activation, and 5-format file exports.
 */
export const useOutletRegistrationReport = () => {
  const { settings } = useApp();
  const [data, setData] = useState([]);
  const [statusCounts, setStatusCounts] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const [filters, updateFilter] = useConfiguredFilters({
    status: settings.REPORT_REGISTRATION_DEFAULT_STATUS || 'ALL',
    area: 'ALL',
    channel: 'ALL',
    division: 'ALL',
    search: '',
    ...reportDateRange(settings.REPORT_REGISTRATION_DEFAULT_PERIOD || 'ALL'),
  });

  const [finalizeTarget, setFinalizeTarget] = useState(null);
  const [pdfTarget, setPdfTarget] = useState(null);
  const [isNikModalOpen, setIsNikModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

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

  const handleFinalize = async (id, customerCode, clusterId, duplicateReason, point = {}) => {
    setIsProcessing(true);
    try {
      const result = await customerRegistrationsApi.finalize(id, {
        customerCode,
        clusterId,
        ...point,
        duplicateReason: duplicateReason || undefined,
      });
      setFeedbackMsg({
        type: 'success',
        text: `Outlet berhasil diinput ke sistem aktif dengan Kode Outlet "${result.data?.outlet?.outletCode || customerCode}"!`,
      });
      setFinalizeTarget(null);
      await loadReportData();
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Gagal mendaftarkan outlet ke sistem' });
    } finally {
      setIsProcessing(false);
    }
  };

  const dateCode = new Date().toISOString().split('T')[0];
  const outletExporters = exportOutletMaster(data, `DATA_OUTLET_${dateCode}`);
  const nikExporters = exportImportNik(data, `IMPORT_NIK_${dateCode}`);

  const exportToNd6TXT = () => {
    exportCustomerNd6Txt(data, `IMPORT_CUSTOMER_ND6_${dateCode}.txt`);
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
    outletExporters,
    nikExporters,
    exportToNd6TXT,
    refreshData: loadReportData,
  };
};
