import React, { useEffect, useState } from 'react';
import { teamsApi } from '../../../../services/api';
import { useApp } from '../../../../context/AppContext';
import { NativeDialog } from '../../../../shared/components/common/NativeDialog';
export function EditClusterModal({isOpen,cluster,onClose,onSave}) {
  const {user} = useApp();
  const [form,setForm] = useState({name:'',region:'',colorHex:'#3B82F6',supervisorId:'',assignedSalesId:''});
  const [source,setSource] = useState({sales:[],supervisors:[]});
  const [error,setError] = useState('');
  const [busy,setBusy] = useState(false);
  const [teamLoaded,setTeamLoaded]=useState(false);
  const [revision,setRevision]=useState(0);
  const [loading,setLoading] = useState(false);
  useEffect(()=>{if(!isOpen || !cluster) return;setForm({name:cluster.name || '',region:cluster.region || '',colorHex:cluster.colorHex || '#3B82F6',supervisorId:user.role==='SUPERVISOR'?user.id:cluster.supervisorId || '',assignedSalesId:cluster.assignedSalesId || ''});setError('');setLoading(true);setTeamLoaded(false);let live=true;teamsApi.getAll().then(r=>{if(live){setSource(r.data);setTeamLoaded(true);}}).catch(e=>{if(live)setError(e.message);}).finally(()=>{if(live)setLoading(false);});return()=>{live=false;};},[isOpen,cluster,user.id,user.role,revision]);
  const field = (key,value)=>setForm(prev=>({...prev,[key]:value,...(key==='supervisorId'?{assignedSalesId:''}:{})}));
  const save = async e=>{e.preventDefault();setBusy(true);setError('');try{await onSave(cluster.id,{...form,name:form.name.trim(),region:form.region.trim(),supervisorId:form.supervisorId || null,assignedSalesId:form.assignedSalesId || null});onClose();}catch(err){setError(err.message);}finally{setBusy(false);}};
  return <NativeDialog open={isOpen && Boolean(cluster)} title="Edit kluster dan penanggung jawab" onClose={onClose} busy={busy}><form className="app-form" onSubmit={save}>
    <p>Pilih supervisor, lalu sales dari timnya. Wilayah boleh belum memiliki sales. Perubahan berlaku untuk perencanaan berikutnya.</p>
    {error && <div role="alert" className="app-error">{error}{!teamLoaded&&<button type="button" className="app-button" onClick={()=>setRevision(value=>value+1)}>Muat ulang tim</button>}</div>}
    <label className="app-field">Nama wilayah<input required maxLength={150} value={form.name} onChange={e=>field('name',e.target.value)}/></label>
    <label className="app-field">Region<input required maxLength={100} value={form.region} onChange={e=>field('region',e.target.value)}/></label>
    {user.role==='ADMIN'&&<label className="app-field">Supervisor<select value={form.supervisorId} onChange={e=>field('supervisorId',e.target.value)} disabled={loading || user.role==='SUPERVISOR'}><option value="">Belum ditugaskan</option>{source.supervisors.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>}
    {user.role==='SUPERVISOR'&&<p>Penanggung jawab: <strong>{user.name}</strong></p>}
    <label className="app-field">Sales bertugas<select value={form.assignedSalesId} onChange={e=>field('assignedSalesId',e.target.value)} disabled={loading || !form.supervisorId}><option value="">Belum ditugaskan</option>{source.sales.filter(s=>s.supervisorId===form.supervisorId).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
    <label className="app-field">Warna pada peta<input type="color" value={form.colorHex} onChange={e=>field('colorHex',e.target.value)}/></label>
    <div className="app-actions"><button type="button" className="app-button" onClick={onClose} disabled={busy}>Batal</button><button className="app-button app-button-primary" disabled={busy || loading || !teamLoaded}>{busy?'Menyimpan…':'Simpan wilayah'}</button></div>
  </form></NativeDialog>;
}
