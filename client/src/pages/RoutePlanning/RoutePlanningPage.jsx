import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { OPS_MANAGER_ROLES, ROLES } from '../../constants/roles';
import { RJP_ROLE_TAB_MAP } from '../../constants/routePlanning';

// Tab content components (child components per SRP)
import { RjpRoleTabBar } from './components/RjpRoleTabBar';
import { SalesViewTab } from './components/SalesViewTab';
import { MapDirectoryTab } from './components/MapDirectoryTab';
import { RjpOpsHeader } from './components/ops/RjpOpsHeader';
import { RjpAllocationStats } from './components/ops/RjpAllocationStats';
import { MasterClusterTable } from './components/ops/MasterClusterTable';
import { ClusterFormModal } from './components/ops/ClusterFormModal';
import { SpreadsheetImportModal } from './components/ops/SpreadsheetImportModal';
import { VehiclesHeader } from './components/ops/VehiclesHeader';
import { VehicleSpecsTable } from './components/ops/VehicleSpecsTable';
import { VehicleFormModal } from './components/ops/VehicleFormModal';
import { RjpSpvHeader } from './components/spv/RjpSpvHeader';
import { WeeklyRollingMatrixTable } from './components/spv/WeeklyRollingMatrixTable';
import { ReassignDayRouteModal } from './components/spv/ReassignDayRouteModal';
import { AutoRollingConfirmModal } from './components/spv/AutoRollingConfirmModal';

// Hooks
import { useRjpManagement } from '../../hooks/useRjpManagement';
import { useVehicleManagement } from '../../hooks/useVehicleManagement';
import { useSupervisorRollingMatrix } from '../../hooks/useSupervisorRollingMatrix';
import { useSalesRouteSelection } from './hooks/useSalesRouteSelection';

import '../../styles/pages/RoutePlanning.css';

/**
 * RoutePlanningPage Component (Master RJP Orchestrator)
 * Single Responsibility: Compose tab bar + tab contents + modals untuk
 * role Ops Manager / Supervisor / Sales. Logika seleksi didelegasikan ke hooks.
 */
export const RoutePlanningPage = () => {
  const { user, salesStops = [], rjpTeams = [] } = useApp();

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
    isCreateModalOpen: _isCreateModalOpen,
    setIsCreateModalOpen: _setIsCreateModalOpen,
    isFormModalOpen,
    setIsFormModalOpen,
    editingCluster,
    setEditingCluster,
    handleCreateCluster,
    handleUpdateCluster,
    handleDeleteCluster,
    handleImportSpreadsheet,
  } = useRjpManagement();

  const {
    vehicles,
    isFormModalOpen: isVehicleFormOpen,
    setIsFormModalOpen: setIsVehicleFormOpen,
    editingVehicle,
    setEditingVehicle,
    handleCreateVehicle,
    handleUpdateVehicle,
    handleDeleteVehicle,
  } = useVehicleManagement();

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

  return (
    <div className="page-container">
      <RjpRoleTabBar tabs={allowedTabs} activeTab={activeTab} onSelectTab={setActiveTab} />

      {activeTab === 'OPS_MANAGER' && isOpsOrAdmin && (
        <div className="space-y-6">
          <RjpOpsHeader
            onOpenCreateModal={() => setIsFormModalOpen(true)}
            onOpenImportModal={() => setIsImportModalOpen(true)}
          />
          <RjpAllocationStats stats={stats} />
          <MasterClusterTable 
            clusters={masterClusters} 
            onEdit={(c) => { setEditingCluster(c); setIsFormModalOpen(true); }}
            onDelete={handleDeleteCluster}
          />
          <hr className="my-8 border-gray-200" />
          <VehiclesHeader onOpenCreateModal={() => setIsVehicleFormOpen(true)} />
          <VehicleSpecsTable
            vehicles={vehicles}
            onEdit={(v) => { setEditingVehicle(v); setIsVehicleFormOpen(true); }}
            onDelete={handleDeleteVehicle}
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
          <ClusterFormModal
            isOpen={isFormModalOpen}
            onClose={() => { setIsFormModalOpen(false); setEditingCluster(null); }}
            onSubmit={(data) => {
              if (data.id) handleUpdateCluster(data.id, data);
              else handleCreateCluster(data);
            }}
            cluster={editingCluster}
          />
          <SpreadsheetImportModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            onImportSuccess={handleImportSpreadsheet}
          />
          <VehicleFormModal
            isOpen={isVehicleFormOpen}
            onClose={() => { setIsVehicleFormOpen(false); setEditingVehicle(null); }}
            onSubmit={(data) => {
              if (data.id) handleUpdateVehicle(data.id, data);
              else handleCreateVehicle(data);
            }}
            vehicle={editingVehicle}
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
