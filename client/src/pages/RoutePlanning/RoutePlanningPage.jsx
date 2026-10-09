import React,{useState} from 'react';
import {useApp} from '../../context/AppContext';
import {useWorkspaceState} from '../../shared/hooks/useWorkspaceState';
import {useRjpManagement} from './hooks/useRjpManagement';
import {ClusterWorkspace} from './components/master/ClusterWorkspace';
import {ClusterOutletsModal} from './components/master/ClusterOutletsModal';
import {EditClusterModal} from './components/master/EditClusterModal';
import {SpreadsheetImportModal} from './components/master/SpreadsheetImportModal';
import {VisitPlanner} from './components/planner/VisitPlanner';
import {SalesViewTab} from './components/SalesViewTab';
import '../../styles/pages/PlanningWorkspace.css';
export function RoutePlanningPage(){
 const {user}=useApp(),m=useRjpManagement(),[view,setView]=useWorkspaceState('rjpView','MASTER_CLUSTER'),[outletCluster,setOutletCluster]=useState(null),[editing,setEditing]=useState(null);
 const canPlan=['ADMIN','SUPERVISOR'].includes(user.role)&&user.permissions?.can_manage_rjp!==false;
 const choose=id=>{if(window.dispatchEvent(new CustomEvent('app:before-navigate',{cancelable:true})))setView(id);};
 return <div className="workspace-page planning-workspace"><header className="admin-page-heading"><div><p className="admin-eyebrow">Perencanaan / Wilayah dan kunjungan</p><h1>Wilayah & PJP</h1><p>Kelola tanggung jawab outlet, susun tanggal kunjungan, lalu terbitkan rencana kerja Sales.</p></div></header><nav className="planning-steps" aria-label="Tahap perencanaan">{[['MASTER_CLUSTER','1','Wilayah & outlet'],['SPV_ROLLING','2','Planner kunjungan'],['SALES_VIEW','3','PJP diterbitkan']].map(([id,n,label])=><button type="button" key={id} aria-pressed={view===id} onClick={()=>choose(id)}><span>{n}</span>{label}</button>)}</nav>
  {view==='MASTER_CLUSTER'&&<ClusterWorkspace management={m} onOutlets={setOutletCluster} onEdit={setEditing}/>}
  {view==='SPV_ROLLING'&&(canPlan?<VisitPlanner/>:<p className="app-empty">Akun Anda memiliki akses baca. Penyusunan dan penerbitan memerlukan izin pengelolaan RJP.</p>)}
  {view==='SALES_VIEW'&&<SalesViewTab canSwitchSales/>}
  {user.permissions?.can_manage_clusters!==false&&<><ClusterOutletsModal cluster={outletCluster} onClose={()=>setOutletCluster(null)} onSaved={m.reload}/><EditClusterModal isOpen={!!editing} cluster={editing} onClose={()=>setEditing(null)} onSave={m.handleUpdateCluster}/><SpreadsheetImportModal isOpen={m.isImportModalOpen} onClose={()=>m.setIsImportModalOpen(false)} onImportSuccess={m.handleImportSpreadsheet}/></>}
 </div>;
}
