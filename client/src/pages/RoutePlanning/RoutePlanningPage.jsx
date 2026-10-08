import {useWorkspaceState} from '../../shared/hooks/useWorkspaceState';
import { ClusterOutletsModal } from './components/master/ClusterOutletsModal';
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ROLES } from '../../constants/roles';
import { RJP_ROLE_TAB_MAP } from '../../constants/routePlanning';
import { TAB_IDS } from '../../constants/navigation';

// Tab content components (child components per SRP)
import { RjpRoleTabBar } from './components/RjpRoleTabBar';
import { SalesViewTab } from './components/SalesViewTab';
import { RjpMasterHeader } from './components/master/RjpMasterHeader';
import { RjpAllocationStats } from './components/master/RjpAllocationStats';
import { MasterClusterTable } from './components/master/MasterClusterTable';
import { SpreadsheetImportModal } from './components/master/SpreadsheetImportModal';
import { EditClusterModal } from './components/master/EditClusterModal';

import { RjpSpvHeader } from './components/spv/RjpSpvHeader';
import { WeeklyRollingMatrixTable } from './components/spv/WeeklyRollingMatrixTable';
import { ReassignDayRouteModal } from './components/spv/ReassignDayRouteModal';
import { AutoRollingConfirmModal } from './components/spv/AutoRollingConfirmModal';

// Hooks
import { useRjpManagement } from './hooks/useRjpManagement';

import { useSupervisorRollingMatrix } from './hooks/useSupervisorRollingMatrix';


import '../../styles/pages/RoutePlanning.css';

/**
 * RoutePlanningPage Component (Master RJP Orchestrator)
 * Single Responsibility: Compose tab bar + tab contents + modals untuk
 * role Supervisor / Admin / Sales.
 */
export const RoutePlanningPage = () => {
  const { user, setActiveTab: setGlobalActiveTab } = useApp();

  const isSupervisorOrAdmin = [ROLES.SUPERVISOR, ROLES.ADMIN].includes(user?.role);

  const [outletCluster,setOutletCluster]=useState(null);
  const allowedTabs = useMemo(() => {
    if (isSupervisorOrAdmin) return RJP_ROLE_TAB_MAP.SPV;
    return RJP_ROLE_TAB_MAP.SALES;
  }, [isSupervisorOrAdmin]);

  const [activeTab, setActiveTab] = useWorkspaceState('rjpView',allowedTabs[0]?.id || 'SALES_VIEW');

  useEffect(() => {
    if (!allowedTabs.some((t) => t.id === activeTab)) {
      setActiveTab(allowedTabs[0]?.id || 'SALES_VIEW');
    }
  }, [allowedTabs, activeTab]);

  const {
    reload:reloadMaster, error:masterError, masterClusters, loading:masterLoading, deletingId,
    stats,
    isImportModalOpen,
    setIsImportModalOpen,
    isFormModalOpen,
    setIsFormModalOpen,
    editingCluster,
    setEditingCluster,
    handleUpdateCluster,
    handleDeleteCluster,
    handleImportSpreadsheet,
  } = useRjpManagement();

  const {
    reload:reloadTemplates, loading:scheduleLoading, weekMode, matrixRows, days: scheduleDays, weekType, setWeekType, error: scheduleError, busy: scheduleBusy,
    selectedCell,
    isReassignModalOpen,
    setIsReassignModalOpen,
    isAutoRollingModalOpen,
    setIsAutoRollingModalOpen,
    openReassignModal,
    handleSaveDayReassignment,
    handleExecuteAutoRolling,
  } = useSupervisorRollingMatrix();



  // Navigasi ke CreateClusterPage
  const navigateToCreateCluster = () => {
    if (setGlobalActiveTab) {
      setGlobalActiveTab(TAB_IDS.CREATE_CLUSTER);
    } else {
      // Fallback jika setActiveTab tidak tersedia di context
      window.dispatchEvent(new CustomEvent('navigate-to-tab', { detail: TAB_IDS.CREATE_CLUSTER }));
    }
  };

  return (
    <div className="page-container workspace-page">
      <header className="workspace-heading"><div><h1>Wilayah & jadwal RJP</h1><p>Atur kluster outlet, susun jadwal mingguan, lalu pantau PJP harian. Anggota sales dikelola pada menu Tim.</p></div></header>
      {masterError&&<p role="alert" className="app-error">{masterError} <button className="app-button" onClick={reloadMaster}>Coba lagi</button></p>}
      {isSupervisorOrAdmin&&<div className="app-actions"><button className="app-button" onClick={()=>setGlobalActiveTab(TAB_IDS.TEAM_TRACKING)}>Kelola tim sales</button></div>}
      <RjpRoleTabBar tabs={allowedTabs} activeTab={activeTab} onSelectTab={setActiveTab} />

      {activeTab === 'MASTER_CLUSTER' && isSupervisorOrAdmin && (
        <div className="space-y-6">
          <RjpMasterHeader
            onNavigateCreateCluster={navigateToCreateCluster}
            onOpenImportModal={() => setIsImportModalOpen(true)}
          />
          <RjpAllocationStats stats={stats} />
          <MasterClusterTable
            clusters={masterClusters} loading={masterLoading} deletingId={deletingId} onManageOutlets={setOutletCluster}
            onEdit={(c) => { setEditingCluster(c); setIsFormModalOpen(true); }}
            onDelete={handleDeleteCluster}
          />
        </div>
      )}

      {activeTab === 'SPV_ROLLING' && isSupervisorOrAdmin && (
        <div className="space-y-6">
          <label className="flex items-center gap-3">Siklus template <select value={weekType} onChange={e=>setWeekType(e.target.value)} disabled={scheduleBusy} className="p-2 border rounded-xl"><option value="ALL">Template umum (berlaku kedua siklus)</option><option value="WEEK_1">{weekMode==='MONTH_CYCLE'?'Siklus 1: tanggal 1–7, 15–21, 29–31':'Minggu ISO ganjil'}</option><option value="WEEK_2">{weekMode==='MONTH_CYCLE'?'Siklus 2: tanggal 8–14, 22–28':'Minggu ISO genap'}</option></select></label>
          {scheduleError && <p role="alert" className="text-red-600">{scheduleError}</p>}
          <RjpSpvHeader onOpenAutoRollingModal={() => setIsAutoRollingModalOpen(true)} />
          <button className="app-button" onClick={()=>reloadTemplates().catch(()=>{})} disabled={scheduleLoading}>Muat ulang jadwal</button>
          {scheduleLoading?<p role="status">Memuat template jadwal…</p>:<WeeklyRollingMatrixTable
            matrixRows={matrixRows} days={scheduleDays}
            onCellClick={(salesId, day, currentData) => openReassignModal(salesId, day, currentData)}
          />}
        </div>
      )}

      {activeTab === 'SALES_VIEW' && (
        <SalesViewTab
          matrixRows={matrixRows}
          canSwitchSales={isSupervisorOrAdmin}
        />
      )}

      {isSupervisorOrAdmin && (
        <>
          <SpreadsheetImportModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            onImportSuccess={handleImportSpreadsheet}
          />
          <ClusterOutletsModal cluster={outletCluster} onClose={()=>setOutletCluster(null)} onSaved={reloadMaster}/>
          <EditClusterModal
            isOpen={isFormModalOpen}
            cluster={editingCluster}
            onClose={() => {
              setIsFormModalOpen(false);
              setEditingCluster(null);
            }}
            onSave={handleUpdateCluster}
          />
          <ReassignDayRouteModal
            isOpen={isReassignModalOpen}
            onClose={() => setIsReassignModalOpen(false)}
            cellData={selectedCell}
            onSave={handleSaveDayReassignment}
          />
          <AutoRollingConfirmModal
            isOpen={isAutoRollingModalOpen}
            onClose={() => setIsAutoRollingModalOpen(false)}
            onConfirm={handleExecuteAutoRolling} busy={scheduleBusy} error={scheduleError}
          />
        </>
      )}
    </div>
  );
};
