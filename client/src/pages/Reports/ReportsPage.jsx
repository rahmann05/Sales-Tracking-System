import React, { useState } from 'react';
import { ReportTabBar } from './components/ReportTabBar';
import { DailyCallMonitorPage } from '../DailyCallMonitor/DailyCallMonitorPage';
import { WeeklyReportView } from './components/WeeklyReportView';
import { MtdReportView } from './components/MtdReportView';
import { LuFileSpreadsheet, LuLayers } from 'react-icons/lu';

/**
 * ReportsPage Component
 * Single Responsibility: Unified ND6 Distribution Reporting Suite orchestrator
 * (1. Daily Call Real-Time, 2. Weekly Performance WTD, 3. Month-to-Date MTD vs Target).
 */
export const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState('DAILY');

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-24">
      {/* 1. Suite Header Banner */}
      <div className="bg-surface border border-border-glass rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary mb-1">
            <LuFileSpreadsheet className="text-sm" />
            <span className="tracking-wider uppercase">CV. SINAR ANUGRAH • ND6 DISTRIBUTION MANAGEMENT</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-on-surface tracking-tight m-0">
            Pusat Laporan Distribusi (ND6 Reporting Suite)
          </h2>
          <p className="text-xs text-on-surface-variant m-0 mt-0.5">
            Analisis terpadu alur distribusi dari absensi harian real-time, rekap performa mingguan, hingga evaluasi Month-to-Date (MTD) vs target.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20 text-xs font-mono font-bold flex items-center gap-1.5">
            <LuLayers /> Standar Distribusi ND6
          </span>
        </div>
      </div>

      {/* 2. ND6 Report Mode Navigation Tabs */}
      <ReportTabBar activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* 3. Tab Content */}
      {activeTab === 'DAILY' && (
        <div className="pt-1">
          <DailyCallMonitorPage initialTableView="ALL_VISITS" />
        </div>
      )}

      {activeTab === 'ANOMALIES' && (
        <div className="pt-1">
          <DailyCallMonitorPage initialTableView="ANOMALIES_ONLY" />
        </div>
      )}

      {activeTab === 'WEEKLY' && (
        <div className="pt-1">
          <WeeklyReportView />
        </div>
      )}

      {activeTab === 'MTD' && (
        <div className="pt-1">
          <MtdReportView />
        </div>
      )}
    </div>
  );
};
