import {useWorkspaceState} from '../../shared/hooks/useWorkspaceState';
import React from 'react';
import { PageHeader } from '../../shared/components/common/PageHeader';
import { ReportTabBar } from './components/ReportTabBar';
import { DailyCallMonitorPage } from '../DailyCallMonitor/DailyCallMonitorPage';
import { WeeklyReportView } from './components/WeeklyReportView';
import { MtdReportView } from './components/MtdReportView';
import { LuFileSpreadsheet } from 'react-icons/lu';

/**
 * ReportsPage Component
 * Single Responsibility: Unified ND6 Distribution Reporting Suite orchestrator
 * (1. Daily Call Real-Time, 2. Weekly Performance WTD, 3. Month-to-Date MTD vs Target).
 */
export const ReportsPage = () => {
  const [activeTab, setActiveTab] = useWorkspaceState('reportView','DAILY');

  return (
    <div className="workspace-page reports-workspace space-y-6">
      {/* 1. Suite Header Banner */}
      <PageHeader
        badge={
          <span className="px-3 py-1 bg-surface-container text-on-surface border border-border-glass text-xs font-black rounded-full uppercase tracking-wider flex items-center gap-1.5">
            <LuFileSpreadsheet className="text-sm" /> Laporan
          </span>
        }
        title="Laporan operasional"
        subtitle="Pantau kunjungan harian, hasil mingguan, dan pencapaian bulanan tim sales."

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
