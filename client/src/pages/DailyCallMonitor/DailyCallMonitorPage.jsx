import React, { useState } from 'react';
import { useDailyCallMonitor } from './hooks/useDailyCallMonitor';
import { DailyCallHeaderKpi } from './components/DailyCallHeaderKpi';
import { DailyCallFilterBar } from './components/DailyCallFilterBar';
import { DailyCallTable } from './components/DailyCallTable';
import { SuspiciousAttendanceTable } from './components/SuspiciousAttendanceTable';
import { SalesmanDailyTimelineView } from './components/SalesmanDailyTimelineView';
import { DailyCallDetailModal } from './components/DailyCallDetailModal';
import { DailyCallPdfView } from './components/DailyCallPdfView';
import { LuPhoneCall, LuCalendar, LuListOrdered, LuShieldAlert, LuUserCheck } from 'react-icons/lu';

/**
 * DailyCallMonitorPage Component
 * Single Responsibility: Orchestrator for Daily Call Visit Monitoring & Dedicated Anomaly/Suspicious Attendance Audit.
 */
export const DailyCallMonitorPage = ({ initialTableView = 'ALL_VISITS' }) => {
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
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto pb-24">
      {/* 1. Page Header Title Banner */}
      <div className="bg-surface border border-border-glass rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary mb-1">
            <LuPhoneCall className="text-sm" />
            <span className="tracking-wider uppercase">CV. SINAR ANUGRAH • DISTRIBUTION MANAGEMENT</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-on-surface tracking-tight m-0">
            Daily Call Report & Audit Absensi Salesman
          </h2>
          <p className="text-xs text-on-surface-variant m-0 mt-0.5">
            Pemantauan real-time rute PJP, waktu tempuh antar-titik toko, extra call di luar PJP, dan audit absensi janggal per {formattedDateHeader}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20 text-xs font-mono font-bold flex items-center gap-1.5">
            <LuCalendar /> {date}
          </span>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards (Clicking Anomalies switches to dedicated table) */}
      <DailyCallHeaderKpi
        summary={reportData?.summary}
        onSelectAnomalies={() => setActiveTableView('ANOMALIES_ONLY')}
      />

      {/* 3. Filter Controls & Search */}
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
        onRefresh={refreshData}
        onExport={exportToCsv}
        onOpenPdf={() => setIsPdfModalOpen(true)}
        isLoading={isLoading}
      />

      {/* 4. Dedicated Table Switcher Tabs (Master vs Timeline per Sales vs Anomaly Table) */}
      <div className="flex items-center justify-between gap-3 border-b border-border-glass pb-1 overflow-x-auto">
        <div className="flex items-center gap-2 flex-nowrap">
          {/* Tab 1: Master Table */}
          <button
            type="button"
            onClick={() => setActiveTableView('ALL_VISITS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap border ${
              activeTableView === 'ALL_VISITS'
                ? 'bg-primary text-on-primary border-primary shadow-sm'
                : 'bg-surface text-on-surface-variant border-border-glass hover:bg-surface-container'
            }`}
          >
            <LuListOrdered className="text-sm" />
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
                ? 'bg-primary text-on-primary border-primary shadow-sm'
                : 'bg-surface text-on-surface-variant border-border-glass hover:bg-surface-container'
            }`}
          >
            <LuUserCheck className="text-sm" />
            <span>👤 Timeline & Rute Per Sales</span>
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
                ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                : 'bg-surface text-rose-600 border-rose-500/30 hover:bg-rose-500/10'
            }`}
          >
            <LuShieldAlert className="text-sm" />
            <span>🚨 Tabel Khusus Absensi Janggal</span>
            {totalAnomalies > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
                {totalAnomalies} Temuan
              </span>
            )}
          </button>
        </div>

        <span className="text-[11px] text-on-surface-variant font-semibold hidden md:inline-block whitespace-nowrap">
          Mode: {activeTableView === 'ALL_VISITS' ? 'Master Kunjungan' : activeTableView === 'SALESMAN_TIMELINE' ? 'Audit Rute Kronologis' : 'Audit Anomali'}
        </span>
      </div>

      {/* 5. Main View Rendering */}
      {activeTableView === 'ALL_VISITS' && (
        <DailyCallTable
          rows={reportData?.rows}
          isLoading={isLoading}
          onSelectRow={setSelectedRow}
        />
      )}

      {activeTableView === 'SALESMAN_TIMELINE' && (
        <SalesmanDailyTimelineView
          salesmanSummaries={reportData?.salesmanSummaries}
          isLoading={isLoading}
          onSelectStop={setSelectedRow}
        />
      )}

      {activeTableView === 'ANOMALIES_ONLY' && (
        <SuspiciousAttendanceTable
          rows={reportData?.rows}
          isLoading={isLoading}
          onSelectRow={setSelectedRow}
        />
      )}

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

