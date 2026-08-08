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
 * Tab configuration per role with mobile-optimized short labels.
 * Single Responsibility: Define which tabs each role can see.
 */
const ROLE_TAB_MAP = {
  OPS: [
    { id: 'OPS_MANAGER', shortLabel: 'Master Ops', label: 'Operational Manager (Master Region & Quota)', icon: LuShieldCheck },
    { id: 'SPV_ROLLING', shortLabel: 'Supervisor', label: 'Supervisor (Matriks Rolling)', icon: LuUsers },
    { id: 'SALES_VIEW', shortLabel: 'Pratinjau Sales', label: 'Pratinjau Sales (Rute Harian & TSP)', icon: LuNavigation },
    { id: 'MAP_DIRECTORY', shortLabel: 'Peta & Tim', label: 'Peta Spasial & Direktori Tim', icon: LuMap },
  ],
  SPV: [
    { id: 'SPV_ROLLING', shortLabel: 'Matriks Rolling', label: 'Supervisor (Matriks Rolling Mingguan)', icon: LuUsers },
    { id: 'SALES_VIEW', shortLabel: 'Pratinjau Sales', label: 'Pratinjau Rute Sales Harian & TSP', icon: LuNavigation },
    { id: 'MAP_DIRECTORY', shortLabel: 'Peta & Tim', label: 'Peta Spasial & Direktori Tim', icon: LuMap },
  ],
  SALES: [
    { id: 'SALES_VIEW', shortLabel: 'Rute Saya', label: 'Rute Kunjungan & Jadwal Rolling Saya', icon: LuNavigation },
    { id: 'MAP_DIRECTORY', shortLabel: 'Peta Spasial', label: 'Peta Spasial Rute', icon: LuMap },
  ],
};

/**
 * RoutePlanningPage Component (Master RJP Container)
 * Single Responsibility: Orchestrate Operational Manager, Supervisor Rolling Matrix,
 * and Sales Execution Views tailored to logged-in user.
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

  // Active Sales Rep & Day selection state for Tab 3 (Sales View)
  const [selectedSalesPerson, setSelectedSalesPerson] = useState(null);
  const [selectedDay, setSelectedDay] = useState('Senin');

  // Compute the current active sales row based on logged-in user or explicit selection
  const currentSalesRow = useMemo(() => {
    if (selectedSalesPerson) {
      const found = matrixRows.find(
        (r) => r.salesId === selectedSalesPerson.salesId || r.salesName === selectedSalesPerson.salesName
      );
      if (found) return found;
    }
    // Match by logged-in user name
    const userMatch = matrixRows.find(
      (r) => r.salesName?.toLowerCase() === user?.name?.toLowerCase() || r.salesId === user?.id
    );
    return userMatch || matrixRows[0];
  }, [matrixRows, selectedSalesPerson, user]);

  // Current day's cluster information
  const dailyScheduleInfo = useMemo(() => {
    return currentSalesRow?.schedule?.[selectedDay] || {
      clusterName: 'Klaster Cimahi Tengah (RJP-CIMAHI-01)',
      outletsCount: 10,
      subDistrict: 'Cimahi',
    };
  }, [currentSalesRow, selectedDay]);

  // Daily stops filtered strictly for the active sales rep and active day (10 outlets per plan)
  const filteredDailyStops = useMemo(() => {
    const matched = salesStops.filter((stop) => {
      const matchSales = !stop.assignedSalesName || stop.assignedSalesName === currentSalesRow?.salesName;
      const matchDay = !stop.dayOfWeek || stop.dayOfWeek === selectedDay;
      return matchSales && matchDay;
    });
    if (matched.length > 0) return matched;

    // Fallback to day matching
    const byDay = salesStops.filter((s) => s.dayOfWeek === selectedDay);
    if (byDay.length > 0) return byDay;

    return salesStops.slice(0, 10);
  }, [salesStops, currentSalesRow, selectedDay]);

  return (
    <div className="page-container">
      {/* Mobile Optimized Role Navigation Tab Bar */}
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
              <Icon className="text-base shrink-0" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="inline sm:hidden">{tab.shortLabel}</span>
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
            salesPerson={currentSalesRow}
            supervisorName={currentSalesRow?.spvName || 'Ahmad Subagja'}
            activeRoute={{ day: selectedDay, name: dailyScheduleInfo.clusterName }}
            stops={filteredDailyStops}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            salesList={matrixRows}
            onSelectSales={setSelectedSalesPerson}
            canSwitchSales={isSupervisor || isOpsOrAdmin}
          />
          <SalesRollingScheduleView
            userSchedule={currentSalesRow?.schedule || {}}
            todayDay={selectedDay}
            onSelectDay={setSelectedDay}
            salesName={currentSalesRow?.salesName}
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
            <div className="flex flex-col gap-3.5">
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
