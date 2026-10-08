import {weeklyCsv,reportSalesOptions} from '../../../../../shared/report-semantics.mjs';
import { WeeklyMetrics } from './WeeklyMetrics';
import { ReportBasisNote } from './ReportBasisNote';
import { ReportCalendarEditor } from './ReportCalendarEditor';
import { ReportArchivePanel } from './ReportArchivePanel';
import { WeeklySalesTable } from './WeeklySalesTable';
import { wibDateKey } from '../../../../../shared/visit-metrics.mjs';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { collectPages, reportsApi, usersApi } from '../../../services/api';
import { WeeklyReportPdfView } from './WeeklyReportPdfView';
/**
 * WeeklyReportView Component
 * Single Responsibility: Weekly Performance Analysis (WTD) & 6-Day Work Week Matrix Table ala ND6.
 */
export const WeeklyReportView = () => {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(`${wibDateKey()}T12:00:00Z`);
    const day = d.getUTCDay();
    const diff = (day + 6) % 7;
    d.setUTCDate(d.getUTCDate() - diff);
    return d.toISOString().split('T')[0];
  });
  const [salesmanId, setSalesmanId] = useState('');
  const [search, setSearch] = useState('');
  const [salesTeam, setSalesTeam] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const loadRevision = useRef(0);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [reportData, setReportData] = useState({
    period: {
      startDate: '',
      endDate: '',
      weekDays: []
    },
    summary: {
      totalPlanCalls: 0,
      totalActualCalls: 0,
      callComplianceRate: '0%',
      totalEffectiveCalls: 0,
      effectiveCallRate: '0%',
      totalOrderAmount: 0,
      totalSkuSold: 0,
      avgDurationMinutes: 0,
      totalAnomalies: 0
    },
    daysSummary: [],
    salesmen: []
  });

  // Fetch Sales Team
  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const res = await collectPages(usersApi.getAll, {
          role: 'SALES'
        });
        if (res?.data) {
          setSalesTeam(res.data.filter(u => u.role === 'SALES'));
        }
      } catch (err) {
        console.warn('[WeeklyReportView] Failed to fetch sales team:', err.message);
      }
    };
    fetchTeam();
  }, []);

  // Fetch Weekly Data
  const loadData = useCallback(async () => {
    const revision = ++loadRevision.current;
    setIsLoading(true);
    setError('');
    try {
      const res = await reportsApi.getWeekly({
        startDate,
        userId: salesmanId || undefined
      });
      if (revision === loadRevision.current && res?.data) {
        setReportData(res.data);
      }
    } catch (err) {
      if (revision === loadRevision.current) setError(err.message);
    } finally {
      if (revision === loadRevision.current) setIsLoading(false);
    }
  }, [startDate, salesmanId]);
  useEffect(() => {
    loadData();
    return () => {
      loadRevision.current++;
    };
  }, [loadData]);
  const salesOptions = reportSalesOptions(salesTeam,reportData.salesmen,salesmanId);
  const selectedSalesman = salesOptions.find(s => s.id === salesmanId);
  const salesmanName = selectedSalesman?.name || '';

  // Export to CSV/Excel
  const exportToCsv = () => {
    if (!reportData?.salesmen || reportData.salesmen.length === 0) {
      alert('Tidak ada data mingguan untuk diekspor.');
      return;
    }
    const blob = new Blob(['\uFEFF' + weeklyCsv(reportData)], {
      type: 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WEEKLY_PERFORMANCE_REPORT_${startDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const {
    summary = {},
    salesmen = [],
    daysSummary = []
  } = reportData;
  const filteredSalesmen = search ? salesmen.filter(s => s.salesmanName.toLowerCase().includes(search.toLowerCase())) : salesmen;
  return <div className="space-y-5">
      {error && <div className="app-error" role="alert"><p>Laporan belum berhasil diperbarui: {error}</p><button type="button" className="app-button" onClick={loadData} disabled={isLoading}>Coba lagi</button></div>}
      {isLoading && <p role="status">Memuat laporan…</p>}
      {/* 1. Top Summary KPI Cards */}
      <WeeklyMetrics summary={summary} />
      <ReportBasisNote basis={reportData.basis} />
      <ReportArchivePanel kind="WEEK" period={startDate}/>
      <div className="flex flex-wrap gap-2">{reportData.basis?.calendarMonths?.map(row=><ReportCalendarEditor key={row.month} month={row.month} onSaved={loadData}/>)}</div>

      {/* 2. Unified Workspace Card: Header + Filters + Matrix Table */}
      <WeeklySalesTable daysSummary={daysSummary} exportToCsv={exportToCsv} filteredSalesmen={filteredSalesmen} isLoading={isLoading} loadData={loadData} salesTeam={salesOptions} salesmanId={salesmanId} search={search} setIsPdfModalOpen={setIsPdfModalOpen} setSalesmanId={setSalesmanId} setSearch={setSearch} setStartDate={setStartDate} startDate={startDate} targetPeriod={reportData.period?.targetPeriod} summary={summary} />

      {/* PDF Modal */}
      {isPdfModalOpen && <WeeklyReportPdfView reportData={reportData} salesmanName={salesmanName} onClose={() => setIsPdfModalOpen(false)} />}
    </div>;
};
