import {reportMoney} from '../../../../../shared/report-visibility.mjs';
import {downloadOperationalFile} from '../../../services/operationalExportService';
import { MtdMetrics } from './MtdMetrics';
import { mtdCsv, reportSalesOptions } from '../../../../../shared/report-semantics.mjs';
import { ReportBasisNote } from './ReportBasisNote';
import { ReportCalendarEditor } from './ReportCalendarEditor';
import { ReportArchivePanel } from './ReportArchivePanel';
import { MtdSalesTable } from './MtdSalesTable';
import {reportFilterDefaults} from '../../../../../shared/report-filter-defaults.mjs';
import {useApp} from '../../../context/AppContext';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { collectPages, reportsApi, usersApi } from '../../../services/api';
import { MtdReportPdfView } from './MtdReportPdfView';
import { LuLayers } from "react-icons/lu";
const MONTH_OPTIONS = [{
  value: 1,
  label: 'Januari'
}, {
  value: 2,
  label: 'Februari'
}, {
  value: 3,
  label: 'Maret'
}, {
  value: 4,
  label: 'April'
}, {
  value: 5,
  label: 'Mei'
}, {
  value: 6,
  label: 'Juni'
}, {
  value: 7,
  label: 'Juli'
}, {
  value: 8,
  label: 'Agustus'
}, {
  value: 9,
  label: 'September'
}, {
  value: 10,
  label: 'Oktober'
}, {
  value: 11,
  label: 'November'
}, {
  value: 12,
  label: 'Desember'
}];

/**
 * MtdReportView Component
 * Single Responsibility: Month-to-Date (MTD) Target Achievement, LMA Comparison & Channel Performance ala ND6.
 */
export const MtdReportView = () => {
  const {settings}=useApp();
  const [month, setMonth] = useState(() => reportFilterDefaults(settings).month);
  const [year, setYear] = useState(() => reportFilterDefaults(settings).year);
  const [salesmanId, setSalesmanId] = useState('');
  const [search, setSearch] = useState('');
  const [salesTeam, setSalesTeam] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const loadRevision = useRef(0);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [reportData, setReportData] = useState({
    period: {
      month,
      monthName: '',
      year,
      calendarKnown: false,
      workingDaysElapsed: null,
      totalWorkingDays: null,
      workingDaysRate: '—'
    },
    summary: {
      monthlyTargetAmount: null,
      mtdActualAmount: 0,
      overallAchievementRate: '—',
      overallAchievementRateNum: null,
      lastMonthActual: 0,
      mtdToLmaRate: '0%',
      totalMtdPlanCalls: 0,
      totalMtdActualCalls: 0,
      mtdCallComplianceRate: '0%',
      totalMtdEffectiveCalls: 0,
      mtdEffectiveCallRate: '0%',
      totalMtdSkuSold: 0,
      avgDailyRevenue: null
    },
    channelBreakdown: [],
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
        console.warn('[MtdReportView] Failed to fetch sales team:', err.message);
      }
    };
    fetchTeam();
  }, []);

  // Fetch MTD Data
  const loadData = useCallback(async () => {
    const revision = ++loadRevision.current;
    setIsLoading(true);
    setError('');
    try {
      const res = await reportsApi.getMtd({
        month,
        year,
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
  }, [month, year, salesmanId]);
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
      alert('Tidak ada data MTD untuk diekspor.');
      return;
    }
    const blob = new Blob(['\uFEFF' + mtdCsv(reportData)], {
      type: 'text/csv;charset=utf-8;'
    });
    downloadOperationalFile(blob,`MTD_PERFORMANCE_REPORT_${reportData.period.monthName}_${year}.csv`,'text/csv;charset=utf-8;');
  };
  const {
    period = {},
    summary = {},
    channelBreakdown = [],
    salesmen = []
  } = reportData;
  const filteredSalesmen = search ? salesmen.filter(s => s.salesmanName.toLowerCase().includes(search.toLowerCase())) : salesmen;
  return <div className="space-y-5">
      {error && <div className="app-error" role="alert"><p>Laporan belum berhasil diperbarui: {error}</p><button type="button" className="app-button" onClick={loadData} disabled={isLoading}>Coba lagi</button></div>}
      {isLoading && <p role="status">Memuat laporan…</p>}
      {/* 1. Top Summary KPI Cards */}
      {!isLoading && !error && <MtdMetrics period={period} summary={summary} />}
      {!isLoading && !error && <ReportBasisNote basis={reportData.basis} />}
      <ReportArchivePanel kind="MONTH" period={`${year}-${String(month).padStart(2,'0')}`}/>
      <div className="flex flex-wrap gap-2">{reportData.basis?.calendarMonths?.map(row=><ReportCalendarEditor key={row.month} month={row.month} onSaved={loadData}/>)}</div>

      {/* 2. Channel Contribution Cards */}
      {!isLoading && !error && channelBreakdown.length > 0 && <div className="bg-surface border border-border-glass rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <LuLayers className="text-primary text-base" />
            <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider m-0">
              Distribusi Penjualan per Saluran (Channel Contribution)
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {channelBreakdown.map(c => <div key={c.channelKey} className="p-3 bg-surface-container rounded-xl border border-border-glass space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-on-surface">{c.channelName}</span>
                  <span className="text-xs font-black text-primary px-2 py-0.5 rounded-md bg-primary/10">
                    {c.contributionRate}
                  </span>
                </div>
                <div className="flex items-baseline justify-between text-xs text-on-surface-variant font-mono">
                  <span>Nilai order disetujui: <strong>{reportMoney(c.mtdOmzet)}</strong></span>
                  <span>{c.mtdEc} EC ({c.mtdVisits} kunjungan; channel saat ini)</span>
                </div>
              </div>)}
          </div>
        </div>}

      {/* 3. Unified Workspace Card: Header + Filters + MTD Breakdown Table */}
      <MtdSalesTable MONTH_OPTIONS={MONTH_OPTIONS} exportToCsv={exportToCsv} filteredSalesmen={filteredSalesmen} isLoading={isLoading} loadData={loadData} month={month} reportData={reportData} salesTeam={salesOptions} salesmanId={salesmanId} search={search} setIsPdfModalOpen={setIsPdfModalOpen} setMonth={setMonth} setSalesmanId={setSalesmanId} setSearch={setSearch} setYear={setYear} summary={summary} year={year} />

      {/* PDF Modal */}
      {isPdfModalOpen && !isLoading && !error && <MtdReportPdfView reportData={reportData} salesmanName={salesmanName} onClose={() => setIsPdfModalOpen(false)} />}
    </div>;
};
