import React, { useCallback, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useMapData } from '../../context/MapDataContext';
import { TAB_IDS } from '../../constants/navigation';
import { useClusterBuilder } from './hooks/useClusterBuilder';
import { useClusterMap } from './hooks/useClusterMap';
import { ClusterControlPanel } from './components/master/ClusterControlPanel';
import '../../styles/pages/CreateClusterPage.css';

export function CreateClusterPage() {
  const {user,setActiveTab}=useApp();
  const {outlets,isLoading,error,refetchAll,invalidate}=useMapData();
  const back=useCallback(()=>setActiveTab(TAB_IDS.ROUTE_PLANNING),[setActiveTab]);
  const saved=useCallback(()=>{invalidate();window.dispatchEvent(new CustomEvent('operational-data-changed'));back();},[invalidate,back]);
  const builder=useClusterBuilder({user,onSaved:saved});
  const mapOutlets=useMemo(()=>outlets.filter(outlet=>outlet.type===builder.draft.tradeType),[outlets,builder.draft.tradeType]);
  useClusterMap({...builder,allOutlets:mapOutlets});
  return <div className="create-cluster-page">
    <div className="map-spacer"><p className="cluster-map-hint">{builder.step===2?'Klik peta untuk memilih outlet terdekat, atau pilih lewat daftar.':'Pratinjau wilayah kluster'}</p></div>
    <div className="control-panel-container"><ClusterControlPanel builder={builder} user={user} allOutlets={outlets} dataLoading={isLoading} dataError={error} onRetry={refetchAll} onCancel={back}/></div>
  </div>;
}
