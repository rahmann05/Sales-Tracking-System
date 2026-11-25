import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TAB_IDS } from '../../constants/navigation';
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

const FLOW_HINT = {
  MASTER_CLUSTER: {
    text: 'Langkah 1 dari 3 · Buat atau atur cluster: kelompok outlet per Sales dan wilayah. Cluster inilah yang menjadi sumber outlet pada jadwal kunjungan.',
    actions: [
      ['Lanjut ke jadwal kunjungan', ({ choose, canPlan }) => canPlan && choose('SPV_ROLLING')],
    ],
  },
  SPV_ROLLING: {
    text: 'Langkah 2 dari 3 · Pilih Sales dan outlet dari cluster, tentukan tanggal acuan, lalu terbitkan PJP. Belum ada cluster yang sesuai? Buat dulu di langkah 1.',
    actions: [
      ['Buat cluster dari peta', ({ setActiveTab }) => setActiveTab(TAB_IDS.CREATE_CLUSTER)],
      ['Kembali ke cluster', ({ choose }) => choose('MASTER_CLUSTER')],
    ],
  },
  SALES_VIEW: {
    text: 'Langkah 3 dari 3 · PJP yang sudah diterbitkan dan terlihat oleh Sales. Perlu mengubah jadwal? Kembali ke langkah 2.',
    actions: [['Kembali ke jadwal kunjungan', ({ choose }) => choose('SPV_ROLLING')]],
  },
};

export function RoutePlanningPage() {
  const { user, setActiveTab } = useApp(),
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
    ['MASTER_CLUSTER', '1', 'Cluster'],
    ['SPV_ROLLING', '2', 'Jadwal kunjungan'],
    ['SALES_VIEW', '3', 'PJP terbit'],
    ...(canViewTeam ? [['TEAM_ASSIGNMENT', 'Tim', 'Tim & Sales']] : []),
  ];
  return (
    <div className="workspace-page planning-workspace">
      <header className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">Perencanaan / Cluster, tim, dan kunjungan</p>
          <h1>Cluster & PJP</h1>
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
      {/* One guided flow: Cluster -> Jadwal kunjungan -> PJP terbit, each step says what comes next. */}
      {FLOW_HINT[view] && (
        <div className="admin-feedback planning-flow-hint">
          <span>{FLOW_HINT[view].text}</span>
          <span className="app-actions">
            {FLOW_HINT[view].actions
              .filter(([label]) => canPlan || !label.startsWith('Lanjut'))
              .map(([label, run]) => (
                <button
                  type="button"
                  className="app-button"
                  key={label}
                  onClick={() => run({ choose, setActiveTab, canPlan })}
                >
                  {label}
                </button>
              ))}
          </span>
        </div>
      )}
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
            PJP.
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
