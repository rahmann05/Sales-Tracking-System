import { wibDateKey } from '../../../../../shared/visit-metrics.mjs';
import { dailyCallCsv, reportSalesOptions } from '../../../../../shared/report-semantics.mjs';
import { useState, useEffect, useCallback, useRef } from 'react';
import { collectPages, dailyCallsApi, usersApi } from '../../../services/api';

/**
 * useDailyCallMonitor Hook
 * Single Responsibility: Fetch Daily Call Report data from backend with filters, sales team list, and export support.
 */
export const useDailyCallMonitor = () => {
  const [date, setDate] = useState(wibDateKey);
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
  const [error, setError] = useState('');
  const loadRevision = useRef(0);
  const [selectedRow, setSelectedRow] = useState(null);

  // 1. Fetch Sales Team for dropdown
  useEffect(() => {
    const fetchSalesTeam = async () => {
      try {
        const res = await collectPages(usersApi.getAll,{role:'SALES'});
        if (res?.data) {
          setSalesTeam(res.data);
        }
      } catch (err) {
        console.warn('[useDailyCallMonitor] Failed to fetch sales team:', err.message);
      }
    };
    fetchSalesTeam();
  }, []);

  // 2. Load Report Data
  const loadData = useCallback(async () => {
    const revision=++loadRevision.current;
    setIsLoading(true);setError('');
    try {
      const res = await dailyCallsApi.getReport({
        date,
        userId: salesmanId || undefined,
        filterType,
        search: search || undefined,
      });

      if (revision===loadRevision.current && res?.data) {
        setReportData(res.data);
      }
    } catch (err) {
      if(revision===loadRevision.current)setError(err.message);
    } finally {
      if(revision===loadRevision.current)setIsLoading(false);
    }
  }, [date, salesmanId, filterType, search]);

  useEffect(() => {
    loadData();
    return ()=>{loadRevision.current++;};
  }, [loadData]);

  // 3. Export to CSV/Excel format compatible with ND6 Daily Call
  const exportToCsv = () => {
    if (!reportData?.rows || reportData.rows.length === 0) {
      alert('Tidak ada data kunjungan untuk diekspor.');
      return;
    }

    const blob = new Blob(['\uFEFF' + dailyCallCsv(reportData)], { type: 'text/csv;charset=utf-8;' });
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
    salesTeam: reportSalesOptions(salesTeam, reportData.salesmanSummaries, salesmanId),
    reportData,
    isLoading, error,
    selectedRow,
    setSelectedRow,
    refreshData: loadData,
    exportToCsv,
  };
};

