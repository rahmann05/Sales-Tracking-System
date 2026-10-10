import {useWorkspaceState} from '../../shared/hooks/useWorkspaceState';
import {OutletFieldForm} from './OutletFieldForm';
import React,{useCallback,useEffect,useState} from 'react';
import {useApp} from '../../context/AppContext';
import {outletValidationApi} from '../../services/api';
import {stamp} from '../OutletManagement/outletPresentation';
import '../../styles/pages/OutletValidation.css';
const labels={OPEN:'Perlu dikerjakan',SUBMITTED:'Menunggu pemeriksa',DONE:'Diterima',CANCELLED:'Dibatalkan'};
export function OutletFieldTasks(){
 const {user}=useApp(),[tasks,setTasks]=useState([]),[selected,setSelected]=useWorkspaceState('outletFieldTask',''),[status,setStatus]=useState(selected?'ALL':'OPEN'),[error,setError]=useState(''),[loading,setLoading]=useState(false);
 const load=useCallback(async()=>{if(!user?.permissions?.can_submit_outlet_field)return;setLoading(true);try{const r=await outletValidationApi.fieldTasks(status);setTasks(r.data);setError('');}catch(e){setError(e.message);}finally{setLoading(false);}},[status,user?.permissions?.can_submit_outlet_field]);
 useEffect(()=>{load();},[load]);
 if(!user?.permissions?.can_submit_outlet_field)return null;
 const t=tasks.find(t=>t.id===selected);
 return <section className="ov-workspace"><div className="ov-section"><div className="ov-section-heading"><div><h2>Pemeriksaan outlet</h2><p className="ov-muted">Tugas khusus dari SPV/Admin. Penugasan masuk PJP tanpa membuat bukti absen otomatis.</p></div><button type="button" className="app-button" disabled={loading} onClick={load}>Perbarui tugas</button></div><label className="app-field">Status tugas<select value={status} onChange={e=>{setStatus(e.target.value);setSelected('');}}><option value="ALL">Semua</option>{Object.entries(labels).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>{error&&<p role="alert" className="app-error">{error}</p>}{loading&&<p role="status">Memuat tugas…</p>}{!loading&&!tasks.length&&<p className="ov-muted">Tidak ada tugas sesuai status.</p>}<div className="ov-candidates">{tasks.map(t=><button type="button" key={t.id} className={`ov-candidate ${selected===t.id?'is-selected':''}`} onClick={()=>setSelected(t.id)}><strong>{t.review.outlet.name}</strong><span>{t.instructions}</span><small>{labels[t.status]} · tenggat {stamp(t.dueAt)}</small></button>)}</div><p className="ov-muted">Menampilkan maksimal 100 tugas terbaru sesuai filter.</p></div>{t&&<OutletFieldForm key={t.id} task={t} onSaved={async()=>{await load();setSelected('');}}/>}</section>;
}
