import React, { useCallback, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useMapData } from '../../context/MapDataContext';
import { TAB_IDS } from '../../constants/navigation';
import { useClusterBuilder } from './hooks/useClusterBuilder';
import { useClusterMap } from './hooks/useClusterMap';
import { ClusterControlPanel } from './components/master/ClusterControlPanel';
import '../../styles/pages/CreateClusterPage.css';
import '../../styles/pages/PlanningWorkspace.css';

export function CreateClusterPage() {
  const {user,setActiveTab}=useApp();
  const {outlets,isLoading,error,refetchAll,invalidate}=useMapData();
  const back=useCallback(()=>setActiveTab(TAB_IDS.ROUTE_PLANNING),[setActiveTab]);
  const saved=useCallback(()=>{invalidate();window.dispatchEvent(new CustomEvent('operational-data-changed'));back();},[invalidate,back]);
  const builder=useClusterBuilder({user,onSaved:saved});
  const available=builder.availableOutlets??outlets;
  const mapOutlets=useMemo(()=>available.filter(outlet=>outlet.type===builder.draft.tradeType&&(outlet.cluster?.supervisorId===builder.draft.supervisorId||outlet.cluster?.name==='Belum Ditugaskan')),[available,builder.draft.tradeType,builder.draft.supervisorId]);
  useClusterMap({...builder,allOutlets:mapOutlets});
  return <div className="create-cluster-page">
    <div className="map-spacer"><p className="cluster-map-hint">{builder.step===2?'Klik marker untuk memilih outlet; klik area peta untuk menentukan pusat saran.':'Pratinjau wilayah cluster'}</p></div>
    <div className="control-panel-container"><ClusterControlPanel builder={builder} user={user} allOutlets={available} dataLoading={builder.teamLoading||isLoading} dataError={builder.teamError||error} onRetry={()=>{refetchAll();builder.loadTeam();}} onCancel={back}/></div>
  </div>;
}
