import React, { useState } from 'react';
import { PageHeader } from '../../shared/components/common/PageHeader';
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
      <PageHeader
        badge={
          <span className="px-3 py-1 bg-surface-container text-on-surface border border-border-glass text-xs font-black rounded-full uppercase tracking-wider flex items-center gap-1.5">
            <LuFileSpreadsheet className="text-sm" /> ND6 DISTRIBUTION REPORTING SUITE
          </span>
        }
        title="Pusat Laporan Distribusi & Analitik Penjualan"
        subtitle="Analisis terpadu alur distribusi dari absensi harian real-time, rekap performa mingguan (WTD), hingga evaluasi pencapaian Month-to-Date (MTD) vs target penjualan."
        actions={
          <span className="px-3.5 py-2 rounded-xl bg-surface border border-border-glass text-primary text-xs font-mono font-bold flex items-center gap-2 shadow-xs">
            <LuLayers className="text-sm" /> Standar Distribusi ND6
          </span>
        }
      />

      {/* 2. ND6 Report Mode Navigation Tabs */}
      <ReportTabBar activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* 3. Tab Content */}
      {activeTab === 'DAILY' && (
        <div className="pt-1">
          <DailyCallMonitorPage initialTableView="ALL_VISITS" showHeader={false} />
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
