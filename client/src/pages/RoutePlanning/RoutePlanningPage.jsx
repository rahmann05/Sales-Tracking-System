import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { OPS_MANAGER_ROLES, ROLES } from '../../constants/roles';
import { RJP_ROLE_TAB_MAP } from '../../constants/routePlanning';
import { TAB_IDS } from '../../constants/navigation';

// Tab content components (child components per SRP)
import { RjpRoleTabBar } from './components/RjpRoleTabBar';
import { SalesViewTab } from './components/SalesViewTab';
import { MapDirectoryTab } from './components/MapDirectoryTab';
import { RjpOpsHeader } from './components/ops/RjpOpsHeader';
import { RjpAllocationStats } from './components/ops/RjpAllocationStats';
import { MasterClusterTable } from './components/ops/MasterClusterTable';
import { SpreadsheetImportModal } from './components/ops/SpreadsheetImportModal';

import { RjpSpvHeader } from './components/spv/RjpSpvHeader';
import { WeeklyRollingMatrixTable } from './components/spv/WeeklyRollingMatrixTable';
import { ReassignDayRouteModal } from './components/spv/ReassignDayRouteModal';
import { AutoRollingConfirmModal } from './components/spv/AutoRollingConfirmModal';

// Hooks
import { useRjpManagement } from '../../hooks/useRjpManagement';

import { useSupervisorRollingMatrix } from '../../hooks/useSupervisorRollingMatrix';
import { useSalesRouteSelection } from './hooks/useSalesRouteSelection';

import '../../styles/pages/RoutePlanning.css';

/**
 * RoutePlanningPage Component (Master RJP Orchestrator)
 * Single Responsibility: Compose tab bar + tab contents + modals untuk
 * role Ops Manager / Supervisor / Sales. Logika seleksi didelegasikan ke hooks.
 */
export const RoutePlanningPage = () => {
  const { user, salesStops = [], rjpTeams = [], setActiveTab: setGlobalActiveTab } = useApp();

  const isOpsOrAdmin = OPS_MANAGER_ROLES.includes(user?.role);
  const isSupervisor = user?.role === ROLES.SUPERVISOR;

  const allowedTabs = useMemo(() => {
    if (isOpsOrAdmin) return RJP_ROLE_TAB_MAP.OPS;
    if (isSupervisor) return RJP_ROLE_TAB_MAP.SPV;
    return RJP_ROLE_TAB_MAP.SALES;
  }, [isOpsOrAdmin, isSupervisor]);

  const [activeTab, setActiveTab] = useState(allowedTabs[0]?.id || 'SALES_VIEW');

  useEffect(() => {
    if (!allowedTabs.some((t) => t.id === activeTab)) {
      setActiveTab(allowedTabs[0]?.id || 'SALES_VIEW');
    }
  }, [allowedTabs, activeTab]);

  const {
    masterClusters,
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
    matrixRows,
    selectedCell,
    isReassignModalOpen,
    setIsReassignModalOpen,
    isAutoRollingModalOpen,
    setIsAutoRollingModalOpen,
    openReassignModal,
    handleSaveDayReassignment,
    handleExecuteAutoRolling,
  } = useSupervisorRollingMatrix();

  const selection = useSalesRouteSelection({ user, matrixRows, salesStops });

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
    <div className="page-container">
      <RjpRoleTabBar tabs={allowedTabs} activeTab={activeTab} onSelectTab={setActiveTab} />

      {activeTab === 'OPS_MANAGER' && isOpsOrAdmin && (
        <div className="space-y-6">
          <RjpOpsHeader
            onNavigateCreateCluster={navigateToCreateCluster}
            onOpenImportModal={() => setIsImportModalOpen(true)}
          />
          <RjpAllocationStats stats={stats} />
          <MasterClusterTable
            clusters={masterClusters}
            onEdit={(c) => { setEditingCluster(c); setIsFormModalOpen(true); }}
            onDelete={handleDeleteCluster}
          />
        </div>
      )}

      {activeTab === 'SPV_ROLLING' && (isSupervisor || isOpsOrAdmin) && (
        <div className="space-y-6">
          <RjpSpvHeader onOpenAutoRollingModal={() => setIsAutoRollingModalOpen(true)} />
          <WeeklyRollingMatrixTable
            matrixRows={matrixRows}
            onCellClick={(salesId, day, currentData) => openReassignModal(salesId, day, currentData)}
          />
        </div>
      )}

      {activeTab === 'SALES_VIEW' && (
        <SalesViewTab
          currentSalesRow={selection.currentSalesRow}
          selectedDay={selection.selectedDay}
          onSelectDay={selection.setSelectedDay}
          dailyScheduleInfo={selection.dailyScheduleInfo}
          filteredDailyStops={selection.filteredDailyStops}
          matrixRows={matrixRows}
          onSelectSales={selection.setSelectedSalesPerson}
          canSwitchSales={isSupervisor || isOpsOrAdmin}
        />
      )}

      {activeTab === 'MAP_DIRECTORY' && <MapDirectoryTab rjpTeams={rjpTeams} />}

      {isOpsOrAdmin && (
        <>
          <SpreadsheetImportModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            onImportSuccess={handleImportSpreadsheet}
          />
        </>
      )}

      {(isSupervisor || isOpsOrAdmin) && (
        <>
          <ReassignDayRouteModal
            isOpen={isReassignModalOpen}
            onClose={() => setIsReassignModalOpen(false)}
            cellData={selectedCell}
            onSave={handleSaveDayReassignment}
          />
          <AutoRollingConfirmModal
            isOpen={isAutoRollingModalOpen}
            onClose={() => setIsAutoRollingModalOpen(false)}
            onConfirm={handleExecuteAutoRolling}
          />
        </>
      )}
    </div>
  );
};
