import React from 'react';
import {useApp} from '../../../context/AppContext';
import {TAB_IDS} from '../../../constants/navigation';
export function PjpCodeGeneration(){
 const {setActiveTab}=useApp();
 return <section className="p-5 rounded-2xl border border-border-glass space-y-3"><h3 className="font-semibold">Penerbitan dan penomoran PJP</h3><p className="text-sm">Nomor PJP ditetapkan saat rencana kunjungan diterbitkan melalui Planner. Periksa tanggal, outlet, dan penugasan Sales sebelum penerbitan.</p><button type="button" className="app-button app-button-primary" onClick={()=>{const url=new URL(window.location.href);url.searchParams.set('rjpView','SPV_ROLLING');window.history.replaceState(null,'',url);window.dispatchEvent(new Event('workspace-state-changed'));setActiveTab(TAB_IDS.ROUTE_PLANNING);}}>Buka Planner kunjungan</button></section>;
}
