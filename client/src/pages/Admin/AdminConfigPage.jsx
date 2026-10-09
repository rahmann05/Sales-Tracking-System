import React,{useState,useEffect} from 'react';
import {LuArrowLeft,LuChevronRight,LuSearch,LuSettings,LuRefreshCw} from 'react-icons/lu';
import {useApp} from '../../context/AppContext';
import {TAB_IDS} from '../../constants/navigation';
import {CONFIG_DEFINITIONS} from '../../../../shared/config.mjs';
import {POLICY_ROLES,policyGlobalOnly} from '../../../../shared/operational-policy.mjs';
import {categories,stringify,tools} from './AdminConfigNavigation';
import {ParameterGroup} from './ConfigParameterGroup';
import {usePolicyEditor} from './usePolicyEditor';
import {PolicyPublishPanel} from './PolicyPublishPanel';
import {PolicyVersionHistory} from './PolicyVersionHistory';
import {PolicySimulator} from './PolicySimulator';
import {SystemAuditPanel} from './SystemAuditPanel';
import {ProcessPolicyMigration} from './ProcessPolicyMigration';
import {PolicyLibrary} from './PolicyLibrary';
import {PolicyTransfer} from './PolicyTransfer';
import {NotificationDeliveryPanel} from './NotificationDeliveryPanel';
import {PolicyConfigurationScope} from './PolicyConfigurationScope';
import {configApi} from '../../services/api';
import {parameterRoles} from '../../../../shared/policy-guidance.mjs';
import '../../styles/pages/AdminConfig.css';
const roleLabels={ADMIN:'Admin',SUPERVISOR:'Supervisor',SALES:'Sales',KEPALA_GUDANG:'Kepala gudang',SUPIR:'Driver'};
export const AdminConfigPage=()=>{
 const {setActiveTab,refreshSettings}=useApp(),editor=usePolicyEditor(refreshSettings);
 const [teams,setTeams]=useState([]),[roleFilter,setRoleFilter]=useState('ALL');
 useEffect(()=>{let active=true;configApi.policyOptions().then(res=>{if(active)setTeams(res.data.supervisors);}).catch(()=>{});return()=>{active=false;};},[]);
 const [category,setCategory]=useState(''),[groupKey,setGroupKey]=useState(''),[search,setSearch]=useState(''),[view,setView]=useState('edit');
 const {data,values,busy,dirty,error,message,errors}=editor;
 const selected=categories.find(c=>c.key===category);
 const query=search.trim().toLowerCase();
 const filtered=CONFIG_DEFINITIONS.map(g=>({...g,params:g.params.filter(p=>roleFilter==='ALL'||parameterRoles(p.key).includes(roleFilter))}));
 const groups=query?filtered.map(g=>({...g,params:g.params.filter(p=>`${g.groupLabel} ${p.label} ${p.description} ${p.key}`.toLowerCase().includes(query))})).filter(g=>g.params.length):filtered.filter(g=>g.groupKey===groupKey&&g.params.length);
 const changeCount=data?Object.keys(data.profile.draft).length:0;
 const open=c=>{setCategory(c.key);setGroupKey(c.groups[0]);setSearch('');setView('edit');};
 return <div className="config-page policy-workspace">
 <header className="config-heading"><div><span className="policy-eyebrow">PUSAT PENGATURAN</span><h1>Aturan operasional</h1><p>Sesuaikan cara kerja tiap proses, dari kunjungan hingga pengiriman.</p></div><button className="config-button" onClick={()=>setActiveTab(TAB_IDS.ROLE_WORKSPACE)}><LuArrowLeft/> Menu admin</button></header>
 <section className="policy-profile"><div><LuSettings/><label htmlFor="policy-scope">Profil aturan<select id="policy-scope" className="config-input" value={editor.scope} disabled={busy} onChange={e=>editor.changeScope(e.target.value)}><option value="GLOBAL">Seluruh perusahaan</option>{POLICY_ROLES.map(role=><option key={role} value={`ROLE:${role}`}>Role: {roleLabels[role]}</option>)}{teams.map(p=><option key={p.id} value={`TEAM:${p.id}`}>Tim: {p.name}</option>)}</select></label></div><p>{editor.scope==='GLOBAL'?'Aturan dasar untuk semua pengguna.':'Hanya nilai yang diubah menjadi aturan khusus profil ini. Nilai lainnya mengikuti profil di atasnya.'}<br/><span>Urutan: perusahaan → role → tim.</span></p></section>
 {data&&<div className="policy-version-status"><span>Revisi profil {data.profile.revision}</span><span>{data.effective.versions.length?data.effective.versions.map(v=>`${v.scope} · v${v.revision}`).join(' / '):'Mengikuti aturan perusahaan sebelumnya'}</span>{editor.scope.startsWith('TEAM:')&&<span>Nilai efektif ditampilkan sebagai Sales dalam tim. Periksa role lain melalui simulasi.</span>}</div>}
 <div className="policy-toolbar"><label className="policy-search"><LuSearch/><input type="search" placeholder="Cari aturan, mis. checkout, persetujuan, GPS…" aria-label="Cari seluruh pengaturan" value={search} onChange={e=>{setSearch(e.target.value);setView('edit');}}/></label><label className="policy-role-filter">Terdampak role<select className="config-input" value={roleFilter} onChange={e=>setRoleFilter(e.target.value)}><option value="ALL">Semua role</option>{POLICY_ROLES.map(r=><option key={r} value={r}>{roleLabels[r]}</option>)}</select></label><nav aria-label="Tahap pengaturan"><button className="config-button" aria-pressed={view==='edit'} onClick={()=>setView('edit')}>Pengaturan</button><button className="config-button" aria-pressed={view==='review'} onClick={()=>setView('review')}>Tinjau draf ({changeCount})</button><button className="config-button" aria-pressed={view==='history'} onClick={()=>setView('history')}>Riwayat</button></nav></div>
 {error&&<div role="alert" className="policy-error">{error}</div>}{message&&<div role="status" className="policy-success">{message}</div>}
 {!data?<section className="policy-panel policy-panel-body" role="status"><p>{busy?'Memuat aturan efektif…':'Pengaturan gagal dimuat.'}</p><button className="config-button" disabled={busy} onClick={editor.load}><LuRefreshCw/> Coba lagi</button></section>:view==='review'?<><PolicyPublishPanel editor={editor}/><PolicySimulator key={`${editor.scope}:${data.profile.revision}`} editor={editor}/></>:view==='history'?<><PolicyVersionHistory editor={editor}/><PolicyTransfer editor={editor}/><PolicyLibrary editor={editor}/><SystemAuditPanel/><ProcessPolicyMigration/>{changeCount>0&&<button className="config-button" disabled={busy||dirty} onClick={editor.clearDraft}>Batalkan seluruh draf tersimpan</button>}</>:<>
 {!query&&!selected?<><div className="policy-intro"><h2>Pilih proses yang ingin diatur</h2><p>Setiap kelompok memuat aturan alur, persyaratan bukti, serta batas operasional.</p></div><div className="policy-category-grid">{categories.map(c=>{const Icon=c.icon;const count=CONFIG_DEFINITIONS.filter(g=>c.groups.includes(g.groupKey)).reduce((sum,g)=>sum+g.params.length,0);return <button key={c.key} className="policy-category" onClick={()=>open(c)}><span className="policy-category-icon"><Icon/></span><div><h3>{c.label}</h3><p>{c.description}</p><small>{count} aturan</small></div><LuChevronRight/></button>;})}</div><section className="policy-tools"><h2>Pengaturan dengan editor khusus</h2><p>Target, kalender laporan, master, dan penugasan dikelola di halaman proses terkait.</p><div>{tools.map(t=><button className="config-button" key={t.key} onClick={()=>setActiveTab(t.tab)}>{t.label}<LuChevronRight/></button>)}</div></section><PolicyConfigurationScope/></>:<>
 <div className="policy-breadcrumb"><button onClick={()=>{setCategory('');setGroupKey('');setSearch('');}}>Semua proses</button><LuChevronRight/><strong>{query?'Hasil pencarian':selected?.label}</strong></div>
 {!query&&<nav className="policy-group-tabs" aria-label="Kelompok aturan">{selected?.groups.map(key=><button key={key} aria-pressed={groupKey===key} onClick={()=>setGroupKey(key)}>{CONFIG_DEFINITIONS.find(g=>g.groupKey===key)?.groupLabel.replace('Pengkodean: ','')}</button>)}</nav>}
 {query&&<p className="policy-note">{groups.reduce((sum,g)=>sum+g.params.length,0)} aturan ditemukan. Pencarian mencakup seluruh proses.</p>}
 {!groups.length&&<section className="policy-panel policy-panel-body">Tidak ada aturan yang cocok. Coba kata lain.</section>}
 {groups.map(g=><ParameterGroup key={g.groupKey} group={g} values={values} savedValues={Object.fromEntries(Object.entries(data.effective.values).map(([k,v])=>[k,stringify(v)]))} sources={data.effective.sources} scope={editor.scope} onInherit={editor.inherit} change={editor.change} errors={errors} disabled={busy} search={Boolean(query)} onReset={()=>g.params.filter(p=>editor.scope==='GLOBAL'||!policyGlobalOnly(p.key)).forEach(p=>editor.change(p.key,stringify(p.defaultValue)))}/>)}
 {groups.some(g=>g.groupKey==='REPORTING_POLICY')&&<NotificationDeliveryPanel/>}
 </>}
 </>}
 {data&&(dirty||changeCount>0||view==='history')&&<footer className="policy-draft-bar"><div><strong>{dirty?'Ada perubahan lokal':changeCount?`${changeCount} aturan dalam draf`:'Aturan sudah dimuat'}</strong><span>Draf tidak mengubah proses sampai diterbitkan.</span></div><label className="policy-field">Alasan perubahan<input className="config-input" value={editor.reason} disabled={busy} onChange={e=>editor.setReason(e.target.value)} placeholder="Contoh: presensi masuk saja untuk Sales"/></label><div><button className="config-button" disabled={busy||!dirty} onClick={editor.discard}>Batalkan lokal</button><button className="config-button config-button-primary" disabled={busy||(!dirty&&!changeCount)||editor.reason.trim().length<5} onClick={editor.save}>{busy?'Memproses…':'Simpan draf'}</button></div></footer>}
 </div>;
};
