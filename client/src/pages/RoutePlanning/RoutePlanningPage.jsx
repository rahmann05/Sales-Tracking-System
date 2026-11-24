import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useWorkspaceState } from '../../shared/hooks/useWorkspaceState';
import { setWorkspaceValues } from '../../shared/utils/workspaceNavigation';
import { useRjpManagement } from './hooks/useRjpManagement';
import { ClusterWorkspace } from './components/master/ClusterWorkspace';
import { ClusterOutletsModal } from './components/master/ClusterOutletsModal';
import { EditClusterModal } from './components/master/EditClusterModal';
import { SpreadsheetImportModal } from './components/master/SpreadsheetImportModal';
import { VisitPlanner } from './components/planner/VisitPlanner';
import { SalesViewTab } from './components/SalesViewTab';
import { TeamAssignmentPanel } from './components/TeamAssignmentPanel';
import '../../styles/pages/PlanningWorkspace.css';

export function RoutePlanningPage() {
  const { user } = useApp(),
    m = useRjpManagement(),
    [view, setView] = useWorkspaceState('rjpView', 'MASTER_CLUSTER'),
    [outletCluster, setOutletCluster] = useState(null),
    [editing, setEditing] = useState(null);
  const canPlan =
    ['ADMIN', 'SUPERVISOR'].includes(user.role) && user.permissions?.can_manage_rjp !== false;
  const canViewTeam =
    ['ADMIN', 'SUPERVISOR'].includes(user.role) && user.permissions?.can_view_team !== false;
  const choose = (id) => {
    if (window.dispatchEvent(new CustomEvent('app:before-navigate', { cancelable: true })))
      setView(id);
  };
  const openPlannerForCluster = (cluster) => {
    if (!cluster?.supervisorId) return;
    if (!window.dispatchEvent(new CustomEvent('app:before-navigate', { cancelable: true }))) return;
    setWorkspaceValues({
      rjpView: 'SPV_ROLLING',
      clusterId: cluster.id || '',
      plannerSpv: cluster.supervisorId,
      plannerSales: cluster.assignedSalesId || '',
      plannerCluster: cluster.id || '',
    });
  };
  const navSteps = [
    ['MASTER_CLUSTER', '1', 'Wilayah & outlet'],
    ['SPV_ROLLING', '2', 'Planner kunjungan'],
    ['SALES_VIEW', '3', 'PJP diterbitkan'],
    ...(canViewTeam ? [['TEAM_ASSIGNMENT', 'Tim', 'Tim & Sales']] : []),
  ];
  return (
    <div className="workspace-page planning-workspace">
      <header className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">Perencanaan / Wilayah, tim, dan kunjungan</p>
          <h1>Wilayah & PJP</h1>
          <p>
            Kelola tim Sales, kelompokkan outlet ke wilayah cluster, lalu susun dan terbitkan
            rencana kunjungan dalam satu alur terhubung.
          </p>
        </div>
      </header>
      <nav className="planning-steps" aria-label="Tahap perencanaan">
        {navSteps.map(([id, n, label]) => (
          <button type="button" key={id} aria-pressed={view === id} onClick={() => choose(id)}>
            <span>{n}</span>
            {label}
          </button>
        ))}
      </nav>
      {view === 'MASTER_CLUSTER' && (
        <ClusterWorkspace
          management={m}
          onOutlets={setOutletCluster}
          onEdit={setEditing}
          onOpenPlanner={canPlan ? openPlannerForCluster : undefined}
          onOpenTeam={canViewTeam ? () => choose('TEAM_ASSIGNMENT') : undefined}
        />
      )}
      {view === 'SPV_ROLLING' &&
        (canPlan ? (
          <VisitPlanner />
        ) : (
          <p className="app-empty">
            Akun Anda memiliki akses baca. Penyusunan dan penerbitan memerlukan izin pengelolaan
            RJP.
          </p>
        ))}
      {view === 'SALES_VIEW' && <SalesViewTab canSwitchSales />}
      {view === 'TEAM_ASSIGNMENT' && canViewTeam && (
        <section className="admin-panel planner-panel-body">
          <div className="planner-intro">
            <div>
              <h2>Tim &amp; penugasan Sales</h2>
              <p>
                Tetapkan Sales ke tim Supervisor sebelum menugaskan cluster wilayah dan jadwal PJP.
              </p>
            </div>
          </div>
          <TeamAssignmentPanel onChanged={m.reload} />
        </section>
      )}
      {user.permissions?.can_manage_clusters !== false && (
        <>
          <ClusterOutletsModal
            cluster={outletCluster}
            onClose={() => setOutletCluster(null)}
            onSaved={m.reload}
          />
          <EditClusterModal
            isOpen={!!editing}
            cluster={editing}
            onClose={() => setEditing(null)}
            onSave={m.handleUpdateCluster}
          />
          <SpreadsheetImportModal
            isOpen={m.isImportModalOpen}
            onClose={() => m.setIsImportModalOpen(false)}
            onImportSuccess={m.handleImportSpreadsheet}
          />
        </>
      )}
    </div>
  );
}
