import React, { useCallback, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useMapData } from '../../context/MapDataContext';
import { TAB_IDS } from '../../constants/navigation';
import { setWorkspaceValues } from '../../shared/utils/workspaceNavigation';
import { useClusterBuilder } from './hooks/useClusterBuilder';
import { useClusterMap } from './hooks/useClusterMap';
import { ClusterControlPanel } from './components/master/ClusterControlPanel';
import '../../styles/pages/CreateClusterPage.css';
import '../../styles/pages/PlanningWorkspace.css';

export function CreateClusterPage() {
  const { user, setActiveTab } = useApp();
  const { outlets, isLoading, error, refetchAll, invalidate } = useMapData();
  const routeTab = TAB_IDS.ROUTE_PLANNING || TAB_IDS.MASTER_CLUSTERS;
  const back = useCallback(() => setActiveTab(routeTab), [setActiveTab, routeTab]);
  const openTeam = useCallback(() => {
    if (typeof window !== 'undefined' && window.location?.href) {
      setWorkspaceValues({ rjpView: 'TEAM_ASSIGNMENT' }, { tab: routeTab });
    }
    setActiveTab(routeTab);
  }, [setActiveTab, routeTab]);
  const saved = useCallback(
    (outcome) => {
      invalidate();
      window.dispatchEvent(new CustomEvent('operational-data-changed'));
      if (typeof window !== 'undefined' && window.location?.href) {
        if (outcome?.openPlanner && outcome?.supervisorId) {
          setWorkspaceValues(
            {
              rjpView: 'SPV_ROLLING',
              clusterId: outcome.cluster?.id || '',
              plannerSpv: outcome.supervisorId,
              plannerSales: outcome.assignedSalesId || '',
              plannerCluster: outcome.cluster?.id || '',
            },
            { tab: routeTab }
          );
        } else {
          setWorkspaceValues(
            {
              rjpView: 'MASTER_CLUSTER',
              clusterId: outcome?.cluster?.id || '',
            },
            { tab: routeTab }
          );
        }
      }
      setActiveTab(routeTab);
    },
    [invalidate, setActiveTab, routeTab]
  );
  const builder = useClusterBuilder({ user, onSaved: saved });
  const available = builder.availableOutlets ?? outlets;
  const mapOutlets = useMemo(
    () =>
      available.filter(
        (outlet) =>
          outlet.type === builder.draft.tradeType &&
          (outlet.cluster?.supervisorId === builder.draft.supervisorId ||
            outlet.cluster?.name === 'Belum Ditugaskan')
      ),
    [available, builder.draft.tradeType, builder.draft.supervisorId]
  );
  useClusterMap({ ...builder, allOutlets: mapOutlets });
  return (
    <div className="create-cluster-page">
      <div className="map-spacer">
        <p className="cluster-map-hint">
          {builder.step === 2
            ? 'Klik marker untuk memilih outlet; klik area peta untuk menentukan pusat saran.'
            : 'Pratinjau wilayah & rute cluster'}
        </p>
      </div>
      <div className="control-panel-container">
        <ClusterControlPanel
          builder={builder}
          user={user}
          allOutlets={available}
          dataLoading={builder.teamLoading || isLoading}
          dataError={builder.teamError || error}
          onRetry={() => {
            refetchAll();
            builder.loadTeam();
          }}
          onOpenTeam={openTeam}
          onCancel={back}
        />
      </div>
    </div>
  );
}
