import { useState, useEffect, useCallback } from 'react';
import { customerRegistrationsApi } from '../../../services/api';

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

  // Export to CSV
  const exportToCSV = () => {
    if (data.length === 0) {
      alert('Tidak ada data untuk diekspor.');
      return;
    }

    const headers = [
      'Kode Outlet',
      'Nama Outlet',
      'Pemilik',
      'Alamat',
      'No Telp',
      'Area',
      'Kecamatan',
      'Divisi',
      'Channel',
      'Sub Channel',
      'Pajak',
      'Payment',
      'Jadwal Kunjungan',
      'Salesman',
      'Status',
      'Tanggal Input',
    ];

    const rows = data.map((d) => [
      d.customerCode || '-',
      `"${(d.name || '').replace(/"/g, '""')}"`,
      `"${(d.ownerName || '').replace(/"/g, '""')}"`,
      `"${(d.address || '').replace(/"/g, '""')}"`,
      d.phone || '-',
      d.area,
      d.subAreaKecamatan || '-',
      d.division,
      d.channel,
      d.subChannel,
      d.taxType,
      d.paymentType,
      `"${d.visitWeekSchedule} (${d.visitDays || ''})"`,
      `"${(d.salesmanName || '').replace(/"/g, '""')}"`,
      d.registrationStatus,
      new Date(d.createdAt).toISOString().split('T')[0],
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Registrasi_Outlet_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to TXT
  const exportToTXT = () => {
    if (data.length === 0) {
      alert('Tidak ada data untuk diekspor.');
      return;
    }

    let txt = `========================================================================================\n`;
    txt += `CV SINAR ANUGRAH FMCG DISTRIBUTOR - LAPORAN REGISTRASI OUTLET BARU\n`;
    txt += `Tanggal Cetak: ${new Date().toLocaleString('id-ID')}\n`;
    txt += `Total Record: ${data.length} Outlet\n`;
    txt += `========================================================================================\n\n`;

    data.forEach((d, idx) => {
      txt += `[#${idx + 1}] KODE: ${d.customerCode || 'MENUNGGU KODE'} | STATUS: ${d.registrationStatus}\n`;
      txt += `  Nama Outlet : ${d.name} (${d.division})\n`;
      txt += `  Alamat      : ${d.address}, ${d.subAreaKecamatan || ''}, ${d.area}\n`;
      txt += `  No Telp     : ${d.phone || '-'} | Pemilik: ${d.ownerName || '-'}\n`;
      txt += `  Channel     : ${d.channel} - ${d.subChannel} (Tier: ${d.channelTier})\n`;
      txt += `  Pajak       : ${d.taxType} (${d.taxNumber || '-'})\n`;
      txt += `  Payment     : ${d.paymentType} ${d.termOfPaymentDays ? `(${d.termOfPaymentDays} Hari)` : ''}\n`;
      txt += `  Jadwal PJP  : ${d.visitWeekSchedule} - Hari: ${d.visitDays || '-'}\n`;
      txt += `  Salesman    : ${d.salesmanName || '-'} | SPV: ${d.spvName || '-'} | Ops: ${d.opsManagerName || '-'}\n`;
      txt += `  Koordinat   : ${d.latitude}, ${d.longitude}\n`;
      txt += `----------------------------------------------------------------------------------------\n`;
    });

    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Laporan_Registrasi_Outlet_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    isProcessing,
    feedbackMsg,
    setFeedbackMsg,
    handleFinalize,
    exportToCSV,
    exportToTXT,
    refreshData: loadReportData,
  };
};
