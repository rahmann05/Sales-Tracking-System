import React,{useCallback,useEffect,useRef,useState} from 'react';
import {useApp} from '../../context/AppContext';
import {useWorkspaceState} from '../../shared/hooks/useWorkspaceState';
import {outletsApi} from '../../services/api';
import {TAB_IDS} from '../../constants/navigation';
import {useOutletDirectory} from './useOutletDirectory';
import {OutletDirectory} from './OutletDirectory';
import {OutletProfile} from './OutletProfile';
import {OutletFormModal} from './OutletFormModal';
import {confirmWorkspaceNavigation} from '../../shared/utils/confirmWorkspaceNavigation';
import '../../styles/pages/OutletWorkspace.css';
export function OutletManagementPage() {
 const {user,setActiveTab}=useApp(),d=useOutletDirectory(),[selected,setSelected]=useWorkspaceState('outletId',''),[profile,setProfile]=useState(null),[profileError,setProfileError]=useState(''),[profileLoading,setProfileLoading]=useState(false),[editing,setEditing]=useState(null),[feedback,setFeedback]=useState('');
 const version=useRef(0),canManage=['ADMIN','SUPERVISOR'].includes(user.role)?user.permissions?.can_manage_outlets!==false:Boolean(user.permissions?.can_manage_outlets);
 const reloadProfile=useCallback(async()=>{if(!selected){setProfile(null);return;}const current=++version.current;setProfileLoading(true);setProfileError('');try{const r=await outletsApi.profile(selected);if(current===version.current)setProfile(r.data);}catch(e){if(current===version.current){setProfileError(e.message);setProfile(null);}}finally{if(current===version.current)setProfileLoading(false);}},[selected]);
 useEffect(()=>{reloadProfile();return()=>{version.current++;};},[reloadProfile]);
 const select=value=>{if(confirmWorkspaceNavigation())setSelected(value);};
 useEffect(()=>{if(profile?.id===selected)document.getElementById('outlet-profile')?.scrollIntoView({block:'start',behavior:'smooth'});},[selected,profile?.id]);
 const saved=async outlet=>{setEditing(null);setFeedback('Data outlet berhasil disimpan.');await d.load();if(outlet?.id)setSelected(outlet.id,{replace:true});await reloadProfile();};
 return <main className="workspace-page outlet-workspace"><header className="outlet-page-heading"><div><p className="outlet-eyebrow">Pelanggan / Data operasional</p><h1>Master outlet</h1><p>Temukan outlet, kelola identitas, dan lihat tanggung jawab wilayah serta rencana kunjungannya.</p></div><div className="app-actions"><button type="button" className="app-button" onClick={()=>setActiveTab(TAB_IDS.OUTLET_APPROVAL)}>Pengajuan outlet</button>{canManage&&<button type="button" className="app-button app-button-primary" onClick={()=>setEditing({create:true})}>Tambah outlet</button>}</div></header>
  {feedback&&<div className="outlet-notice" role="status">{feedback}<button type="button" onClick={()=>setFeedback('')} aria-label="Tutup pemberitahuan">×</button></div>}
  <div className={`outlet-master-layout ${selected?'has-detail':''}`}><OutletDirectory directory={d} selected={selected} onSelect={select}/>{selected&&<section id="outlet-profile" className="outlet-panel outlet-profile" aria-label="Profil outlet"><div className="outlet-list-heading"><button type="button" className="app-button" onClick={()=>select('')}>Kembali ke daftar</button><button type="button" className="app-button" onClick={()=>{if(confirmWorkspaceNavigation())reloadProfile();}} disabled={profileLoading}>Perbarui profil</button></div>{profileLoading?<p className="app-empty" role="status">Memuat profil…</p>:profileError?<p className="app-error" role="alert">{profileError}</p>:profile&&<OutletProfile onRefresh={reloadProfile} outlet={profile} canManage={canManage} onEdit={()=>setEditing(profile)} onSaved={saved}/>}</section>}</div>
  {editing&&<OutletFormModal outlet={editing.create?null:editing} clusters={d.clusters} clusterError={d.clusterError} onClose={()=>setEditing(null)} onSaved={saved}/>}
 </main>;
}
