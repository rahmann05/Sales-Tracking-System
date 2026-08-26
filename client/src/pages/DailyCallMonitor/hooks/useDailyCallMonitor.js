import { useState, useEffect, useCallback } from 'react';
import { dailyCallsApi, usersApi } from '../../../services/api';

/**
 * useDailyCallMonitor Hook
 * Single Responsibility: Fetch Daily Call Report data from backend with filters, sales team list, and export support.
 */
export const useDailyCallMonitor = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [salesmanId, setSalesmanId] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [search, setSearch] = useState('');
  const [salesTeam, setSalesTeam] = useState([]);

  const [reportData, setReportData] = useState({
    summary: {
      totalPlanCalls: 0,
      totalActualCalls: 0,
      totalEffectiveCalls: 0,
      effectiveCallRate: '0%',
      effectiveCallRateNum: 0,
      totalOrderAmount: 0,
      totalSkuSold: 0,
      totalDurationMinutes: 0,
      avgDurationMinutes: 0,
      totalDurationAnomalies: 0,
      totalDistanceAnomalies: 0,
      totalAnomalies: 0,
    },
    rows: [],
    totalRows: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [selectedRow, setSelectedRow] = useState(null);

  // 1. Fetch Sales Team for dropdown
  useEffect(() => {
    const fetchSalesTeam = async () => {
      try {
        const res = await usersApi.getUsers();
        if (res?.data) {
          const salesOnly = res.data.filter((u) => u.role === 'SALES');
          setSalesTeam(salesOnly);
        }
      } catch (err) {
        console.warn('[useDailyCallMonitor] Failed to fetch sales team:', err.message);
      }
    };
    fetchSalesTeam();
  }, []);

  // 2. Load Report Data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await dailyCallsApi.getReport({
        date,
        userId: salesmanId || undefined,
        filterType,
        search: search || undefined,
      });

      if (res?.data) {
        setReportData(res.data);
      }
    } catch (err) {
      console.warn('[useDailyCallMonitor] Failed to load daily calls report:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [date, salesmanId, filterType, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 3. Export to CSV/Excel format compatible with ND6 Daily Call
  const exportToCsv = () => {
    if (!reportData?.rows || reportData.rows.length === 0) {
      alert('Tidak ada data kunjungan untuk diekspor.');
      return;
    }

    const headers = [
      'No',
      'Salesman',
      'Tanggal',
      'Time-In',
      'Time-Out',
      'Duration (Min)',
      'Customer ID',
      'Customer Name',
      'Sub Channel',
      'Freq',
      'Itny',
      'Plan Call',
      'Actual Call',
      'Effective Call',
      'SKU Sold',
      'Order Of The Day (Rp)',
      'Reason',
      'Remark',
      'Deviation (Meters)',
      'Distance Warning',
      'Anomali Durasi (<5m)',
    ];

    const csvRows = [headers.join(',')];

    reportData.rows.forEach((r) => {
      const rowVals = [
        r.no,
        `"${(r.salesmanName || '').replace(/"/g, '""')}"`,
        r.date,
        r.timeIn,
        r.timeOut,
        r.durationMinutes,
        `"${r.customerId}"`,
        `"${(r.customerName || '').replace(/"/g, '""')}"`,
        r.subChannel,
        r.freq,
        r.itny,
        r.planCall,
        r.actualCall,
        r.effectiveCall,
        r.skuSold,
        r.orderAmount,
        `"${(r.reason || '').replace(/"/g, '""')}"`,
        `"${(r.remark || '').replace(/"/g, '""')}"`,
        r.deviationMeters,
        r.distanceWarning,
        r.isDurationAnomaly ? 'YA' : 'TIDAK',
      ];
      csvRows.push(rowVals.join(','));
    });

    const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DAILY_CALL_REPORT_${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return {
    date,
    setDate,
    salesmanId,
    setSalesmanId,
    filterType,
    setFilterType,
    search,
    setSearch,
    salesTeam,
    reportData,
    isLoading,
    selectedRow,
    setSelectedRow,
    refreshData: loadData,
    exportToCsv,
  };
};

