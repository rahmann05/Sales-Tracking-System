import { useWorkspaceState } from '../../shared/hooks/useWorkspaceState';
import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
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
  const { settings } = useApp();
  const [activeTab, setActiveTab] = useWorkspaceState(
    'reportView',
    settings.REPORT_DEFAULT_VIEW || 'DAILY'
  );
  useEffect(() => {
    if (
      (activeTab === 'WEEKLY' && !settings.REPORT_WEEKLY_ENABLED) ||
      (activeTab === 'MTD' && !settings.REPORT_MTD_ENABLED)
    ) {
      setActiveTab('DAILY', { replace: true });
    }
  }, [activeTab, settings.REPORT_WEEKLY_ENABLED, settings.REPORT_MTD_ENABLED, setActiveTab]);

  return (
    <div className="workspace-page reports-workspace space-y-5">
      {/* 1. Suite Header Banner */}
      <PageHeader
        badge={
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant">
            <LuFileSpreadsheet className="text-sm text-primary" /> Laporan
          </span>
        }
        title="Laporan operasional"
        subtitle="Pantau kunjungan harian, hasil mingguan, dan pencapaian bulanan tim sales."
      />

      {/* 2. ND6 Report Mode Navigation Tabs */}
      <ReportTabBar activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* 3. Tab Content */}
      {activeTab === 'DAILY' && (
        <DailyCallMonitorPage initialTableView="ALL_VISITS" showHeader={false} />
      )}

      {activeTab === 'WEEKLY' && <WeeklyReportView />}

      {activeTab === 'MTD' && <MtdReportView />}
    </div>
  );
};
