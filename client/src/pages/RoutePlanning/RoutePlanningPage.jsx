import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { OPS_MANAGER_ROLES, ROLES } from '../../constants/roles';
import { LuShieldCheck, LuUsers, LuNavigation, LuMap } from 'react-icons/lu';

// Ops Manager Components
import { RjpOpsHeader } from './components/ops/RjpOpsHeader';
import { RjpAllocationStats } from './components/ops/RjpAllocationStats';
import { MasterClusterTable } from './components/ops/MasterClusterTable';
import { CreateClusterModal } from './components/ops/CreateClusterModal';
import { SpreadsheetImportModal } from './components/ops/SpreadsheetImportModal';

// Supervisor Components
import { RjpSpvHeader } from './components/spv/RjpSpvHeader';
import { WeeklyRollingMatrixTable } from './components/spv/WeeklyRollingMatrixTable';
import { ReassignDayRouteModal } from './components/spv/ReassignDayRouteModal';
import { AutoRollingConfirmModal } from './components/spv/AutoRollingConfirmModal';

// Sales Components
import { SalesDailyRouteSummaryCard } from './components/sales/SalesDailyRouteSummaryCard';
import { SalesRollingScheduleView } from './components/sales/SalesRollingScheduleView';

// Map & Teams
import { RouteMapView } from './components/RouteMapView';
import { RjpTeamCard } from './components/RjpTeamCard';

// Hooks
import { useRjpManagement } from '../../hooks/useRjpManagement';
import { useSupervisorRollingMatrix } from '../../hooks/useSupervisorRollingMatrix';

import '../../styles/pages/RoutePlanning.css';

/**
 * Tab configuration per role.
 * Single Responsibility: Define which tabs each role can see.
 */
const ROLE_TAB_MAP = {
  OPS: [
    { id: 'OPS_MANAGER', label: 'Operational Manager (Master Region & Quota)', icon: LuShieldCheck },
    { id: 'SPV_ROLLING', label: 'Supervisor (Matriks Rolling)', icon: LuUsers },
    { id: 'SALES_VIEW', label: 'Pratinjau Sales (Rute Harian & TSP)', icon: LuNavigation },
    { id: 'MAP_DIRECTORY', label: 'Peta Spasial & Direktori Tim', icon: LuMap },
  ],
  SPV: [
    { id: 'SPV_ROLLING', label: 'Supervisor (Matriks Rolling Mingguan)', icon: LuUsers },
    { id: 'SALES_VIEW', label: 'Pratinjau Rute Sales Harian & TSP', icon: LuNavigation },
    { id: 'MAP_DIRECTORY', label: 'Peta Spasial & Direktori Tim', icon: LuMap },
  ],
  SALES: [
    { id: 'SALES_VIEW', label: 'Rute Kunjungan & Jadwal Rolling Saya', icon: LuNavigation },
    { id: 'MAP_DIRECTORY', label: 'Peta Spasial Rute', icon: LuMap },
  ],
};

/**
 * RoutePlanningPage Component (Master RJP Container)
 * Single Responsibility: Orchestrate Operational Manager, Supervisor Rolling Matrix,
 * and Sales Execution Views.
 */
export const RoutePlanningPage = () => {
  const { user, salesStops = [], rjpTeams = [] } = useApp();

  const isOpsOrAdmin = OPS_MANAGER_ROLES.includes(user?.role);
  const isSupervisor = user?.role === ROLES.SUPERVISOR;

  const allowedTabs = useMemo(() => {
    if (isOpsOrAdmin) return ROLE_TAB_MAP.OPS;
    if (isSupervisor) return ROLE_TAB_MAP.SPV;
    return ROLE_TAB_MAP.SALES;
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
    isCreateModalOpen,
    setIsCreateModalOpen,
    handleCreateCluster,
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

  return (
    <div className="page-container">
      {/* Role Navigation Tab Bar */}
      <div className="rjp-role-tab-bar">
        {allowedTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rjp-role-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            >
              <Icon className="text-base" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OPERATIONAL MANAGER */}
      {activeTab === 'OPS_MANAGER' && isOpsOrAdmin && (
        <div className="space-y-6">
          <RjpOpsHeader
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            onOpenImportModal={() => setIsImportModalOpen(true)}
          />
          <RjpAllocationStats stats={stats} />
          <MasterClusterTable clusters={masterClusters} />
        </div>
      )}

      {/* TAB 2: SUPERVISOR */}
      {activeTab === 'SPV_ROLLING' && (isSupervisor || isOpsOrAdmin) && (
        <div className="space-y-6">
          <RjpSpvHeader onOpenAutoRollingModal={() => setIsAutoRollingModalOpen(true)} />
          <WeeklyRollingMatrixTable
            matrixRows={matrixRows}
            onCellClick={(salesId, day, currentData) => openReassignModal(salesId, day, currentData)}
          />
        </div>
      )}

      {/* TAB 3: SALES FIELD */}
      {activeTab === 'SALES_VIEW' && (
        <div className="space-y-6">
          <SalesDailyRouteSummaryCard
            activeRoute={{ day: 'Senin', name: 'Klaster Cimahi Selatan (Cibeureum)' }}
            stops={salesStops}
          />
          <SalesRollingScheduleView
            userSchedule={matrixRows[0]?.schedule || {}}
            todayDay="Senin"
          />
        </div>
      )}

      {/* TAB 4: SPATIAL MAP & RJP TEAMS DIRECTORY */}
      {activeTab === 'MAP_DIRECTORY' && (
        <div className="space-y-6">
          <RouteMapView selectedRouteName="Klaster Cimahi Selatan & Leuwigajah" />
          <div>
            <h3 className="text-base font-extrabold text-on-surface mb-1">
              Direktori Tim RJP Lapangan ({rjpTeams.length} Tim Aktif)
            </h3>
            <p className="text-xs text-on-surface-variant mb-4">
              Daftar supervisor dan anggota sales yang bertugas di wilayah Bandung Barat & Cimahi
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rjpTeams.map((team) => (
                <RjpTeamCard key={team.id} team={team} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {isOpsOrAdmin && (
        <>
          <CreateClusterModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onSubmit={handleCreateCluster}
          />
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
