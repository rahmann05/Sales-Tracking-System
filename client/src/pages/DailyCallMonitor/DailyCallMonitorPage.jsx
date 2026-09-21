import React, { useState } from 'react';
import { useDailyCallMonitor } from './hooks/useDailyCallMonitor';
import { DailyCallHeaderKpi } from './components/DailyCallHeaderKpi';
import { DailyCallFilterBar } from './components/DailyCallFilterBar';
import { DailyCallTable } from './components/DailyCallTable';
import { SuspiciousAttendanceTable } from './components/SuspiciousAttendanceTable';
import { SalesmanDailyTimelineView } from './components/SalesmanDailyTimelineView';
import { DailyCallDetailModal } from './components/DailyCallDetailModal';
import { DailyCallPdfView } from './components/DailyCallPdfView';
import { PageHeader } from '../../shared/components/common/PageHeader';
import { LuPhoneCall, LuCalendar, LuListOrdered, LuShieldAlert, LuUserCheck, LuRefreshCw, LuDownload, LuPrinter } from 'react-icons/lu';

/**
 * DailyCallMonitorPage Component
 * Single Responsibility: Orchestrator for Daily Call Visit Monitoring & Dedicated Anomaly/Suspicious Attendance Audit.
 */
export const DailyCallMonitorPage = ({ initialTableView = 'ALL_VISITS', showHeader = true }) => {
  const {
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
    refreshData,
    exportToCsv,
  } = useDailyCallMonitor();

  const [activeTableView, setActiveTableView] = useState(initialTableView);

  // Sync state if prop changes
  React.useEffect(() => {
    if (initialTableView) {
      setActiveTableView(initialTableView);
    }
  }, [initialTableView]);

  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const selectedSalesman = salesTeam.find((s) => s.id === salesmanId);
  const salesmanName = selectedSalesman?.name || '';

  const totalAnomalies = reportData?.summary?.totalAnomalies || 0;

  const formattedDateHeader = new Date(date).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* 1. Page Header Title Banner (Only rendered when standalone) */}
      {showHeader && (
        <PageHeader
          badge={
            <span className="px-3 py-1 bg-surface-container text-on-surface border border-border-glass text-xs font-black rounded-full uppercase tracking-wider flex items-center gap-1.5">
              <LuPhoneCall className="text-sm" /> CV. SINAR ANUGRAH • DISTRIBUTION MANAGEMENT
            </span>
          }
          title="Daily Call Report & Audit Absensi Salesman"
          subtitle={`Pemantauan real-time rute PJP, waktu tempuh antar-titik toko, extra call di luar PJP, dan audit absensi janggal per ${formattedDateHeader}`}
          actions={
            <span className="px-3.5 py-2 rounded-xl bg-surface border border-border-glass text-primary text-xs font-mono font-bold flex items-center gap-2 shadow-xs">
              <LuCalendar /> {date}
            </span>
          }
        />
      )}

      {/* 2. Top Summary KPI Cards (Clicking Anomalies switches to dedicated table) */}
      <DailyCallHeaderKpi
        summary={reportData?.summary}
        onSelectAnomalies={() => setActiveTableView('ANOMALIES_ONLY')}
      />

      {/* 3. Unified Data & Audit Workspace Card */}
      <div className="bg-surface border border-border-glass rounded-3xl shadow-xs overflow-hidden">
        {/* Workspace Card Header: View Switcher (Left) & Actions (Right) */}
        <div className="p-4 sm:p-5 border-b border-border-glass flex flex-col md:flex-row md:items-center justify-between gap-3 bg-surface-container-low/40">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {/* Tab 1: Master Table */}
            <button
              type="button"
              onClick={() => setActiveTableView('ALL_VISITS')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap border ${
                activeTableView === 'ALL_VISITS'
                  ? 'bg-primary text-on-primary border-primary shadow-xs'
                  : 'bg-surface text-on-surface-variant border-border-glass hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <LuListOrdered className="text-sm shrink-0" />
              <span>Tabel Master Daily Call</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  activeTableView === 'ALL_VISITS' ? 'bg-white/20 text-white' : 'bg-surface-container'
                }`}
              >
                {reportData?.rows?.length || 0}
              </span>
            </button>

            {/* Tab 2: Timeline per Salesman */}
            <button
              type="button"
              onClick={() => setActiveTableView('SALESMAN_TIMELINE')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap border ${
                activeTableView === 'SALESMAN_TIMELINE'
                  ? 'bg-primary text-on-primary border-primary shadow-xs'
                  : 'bg-surface text-on-surface-variant border-border-glass hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <LuUserCheck className="text-sm shrink-0" />
              <span>Timeline & Rute Per Sales</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  activeTableView === 'SALESMAN_TIMELINE' ? 'bg-white/20 text-white' : 'bg-surface-container'
                }`}
              >
                {reportData?.salesmanSummaries?.length || 0}
              </span>
            </button>

            {/* Tab 3: Dedicated Suspicious Table */}
            <button
              type="button"
              onClick={() => setActiveTableView('ANOMALIES_ONLY')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap border ${
                activeTableView === 'ANOMALIES_ONLY'
                  ? 'bg-primary text-on-primary border-primary shadow-xs'
                  : 'bg-surface text-on-surface-variant border-border-glass hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <LuShieldAlert className="text-sm shrink-0" />
              <span>Tabel Khusus Absensi Janggal</span>
              {totalAnomalies > 0 ? (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTableView === 'ANOMALIES_ONLY'
                      ? 'bg-white/20 text-white'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {totalAnomalies} Temuan
                </span>
              ) : (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    activeTableView === 'ANOMALIES_ONLY' ? 'bg-white/20 text-white' : 'bg-surface-container'
                  }`}
                >
                  0
                </span>
              )}
            </button>
          </div>

          {/* Quick Actions (Refresh, Excel, Cetak PDF) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={refreshData}
              disabled={isLoading}
              className="p-2.5 bg-surface hover:bg-surface-container text-on-surface border border-border-glass rounded-xl text-xs font-bold transition-all flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-50 shadow-xs"
              title="Refresh Data"
            >
              <LuRefreshCw className={isLoading ? 'animate-spin' : ''} />
            </button>

            <button
              type="button"
              onClick={exportToCsv}
              className="py-2 px-3 bg-surface hover:bg-surface-container text-on-surface border border-border-glass rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              title="Ekspor Laporan Format Excel ND6"
            >
              <LuDownload /> <span>Excel</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPdfModalOpen(true)}
              className="py-2 px-3 bg-primary hover:bg-primary/90 text-on-primary rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              title="Buka Dokumen Cetak / PDF Resmi"
            >
              <LuPrinter /> <span>Cetak PDF</span>
            </button>
          </div>
        </div>

        {/* Integrated Filter Controls */}
        <DailyCallFilterBar
          date={date}
          onChangeDate={setDate}
          salesmanId={salesmanId}
          onChangeSalesman={setSalesmanId}
          salesTeam={salesTeam}
          filterType={filterType}
          onSelectFilter={setFilterType}
          search={search}
          onChangeSearch={setSearch}
          embedded={true}
          hideActions={true}
          showStatusPills={activeTableView === 'ALL_VISITS'}
        />

        {/* Workspace Body */}
        <div>
          {activeTableView === 'ALL_VISITS' && (
            <DailyCallTable
              rows={reportData?.rows}
              isLoading={isLoading}
              onSelectRow={setSelectedRow}
            />
          )}

          {activeTableView === 'SALESMAN_TIMELINE' && (
            <div className="p-4 sm:p-6">
              <SalesmanDailyTimelineView
                salesmanSummaries={reportData?.salesmanSummaries}
                isLoading={isLoading}
                onSelectStop={setSelectedRow}
              />
            </div>
          )}

          {activeTableView === 'ANOMALIES_ONLY' && (
            <div className="p-4 sm:p-6">
              <SuspiciousAttendanceTable
                rows={reportData?.rows}
                isLoading={isLoading}
                onSelectRow={setSelectedRow}
              />
            </div>
          )}
        </div>
      </div>

      {/* 6. Detail Modal */}
      {selectedRow && (
        <DailyCallDetailModal
          row={selectedRow}
          onClose={() => setSelectedRow(null)}
        />
      )}

      {/* 7. Official Printable PDF Document View */}
      {isPdfModalOpen && (
        <DailyCallPdfView
          reportData={reportData}
          date={date}
          salesmanName={salesmanName}
          onClose={() => setIsPdfModalOpen(false)}
        />
      )}
    </div>
  );
};

