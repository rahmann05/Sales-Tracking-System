import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TAB_IDS } from '../../constants/navigation';
import { TeamAssignmentPanel } from '../RoutePlanning/components/TeamAssignmentPanel';
import { LiveSalesGpsTrackingTab } from './components/LiveSalesGpsTrackingTab';

export function TeamTrackingPage() {
  const {user,setActiveTab}=useApp();
  const [tab,setTab]=useState('members');
  return <div className="page-container workspace-page space-y-6">
    <header className="workspace-heading"><div><h1>{user.role==='SUPERVISOR'?'Tim sales saya':'Tim sales & penugasan'}</h1><p>Kelola anggota tim dan wilayah tugas, lalu pantau posisi sales di lapangan.</p></div><div className="app-actions"><button className="app-button" onClick={()=>setActiveTab(TAB_IDS.ROUTE_PLANNING)}>Wilayah & jadwal RJP</button>{user.role==='ADMIN'&&<button className="app-button" onClick={()=>setActiveTab(TAB_IDS.USER_MANAGEMENT)}>Kelola akun pengguna</button>}</div></header>
    <nav className="app-actions" aria-label="Tampilan tim"><button className={`app-button ${tab==='members'?'app-button-primary':''}`} aria-pressed={tab==='members'} onClick={()=>setTab('members')}>Anggota & penugasan</button><button className={`app-button ${tab==='tracking'?'app-button-primary':''}`} aria-pressed={tab==='tracking'} onClick={()=>setTab('tracking')}>Posisi sales</button></nav>
    {tab==='members'?<TeamAssignmentPanel onChanged={()=>window.dispatchEvent(new CustomEvent('operational-data-changed'))}/>:<LiveSalesGpsTrackingTab/>}
  </div>;
}
