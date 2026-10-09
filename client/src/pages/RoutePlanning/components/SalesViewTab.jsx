import React, { useEffect, useState } from 'react';
import {useWorkspaceState} from '../../../shared/hooks/useWorkspaceState';
import { pjpApi, collectPages } from '../../../services/api';
import { useApp } from '../../../context/AppContext';
import {visitStatusLabel} from '../../Sales/salesPresentation';
import { wibDateKey } from '../../../../../shared/visit-metrics.mjs';
export function SalesViewTab({matrixRows=[],canSwitchSales=false}) {
  const {user} = useApp();
  const [salesId,setSalesId] = useState(user.role==='SALES'?user.id:'');
  const [date,setDate] = useWorkspaceState('pjpDate',wibDateKey());
  const [routes,setRoutes] = useState([]);
  const [error,setError] = useState('');
  const [loading,setLoading] = useState(false);
  const [revision,setRevision] = useState(0);
  const [people,setPeople]=useState([]),[dayStatus,setDayStatus]=useState(null);
  useEffect(()=>{if(!canSwitchSales)return;let live=true;pjpApi.getTemplates().then(r=>{if(live)setPeople(r.data.sales.map(s=>({salesId:s.id,salesName:s.name})));}).catch(e=>{if(live)setError(e.message);});return()=>{live=false;};},[canSwitchSales]);
  const choices=matrixRows.length?matrixRows:people;
  useEffect(()=>{if(!salesId && choices.length)setSalesId(choices[0].salesId);},[choices,salesId]);
  useEffect(()=>{if(!salesId)return;let live=true;setLoading(true);setError('');setRoutes([]);setDayStatus(null);Promise.all([collectPages(pjpApi.getAllPjps,{date,userId:salesId}),pjpApi.dayStatus({date,userId:salesId})]).then(([res,status])=>{if(live){setRoutes(res.data || []);setDayStatus(status.data);}}).catch(e=>{if(live)setError(e.message);}).finally(()=>{if(live)setLoading(false);});return()=>{live=false;};},[salesId,date,revision]);
  const stops = routes.flatMap(r=>r.stops || []);
  return <section className="workspace-section"><div className="workspace-heading"><div><h2>PJP harian</h2><p>Urutan outlet pada tanggal terpilih. Rencana yang sudah diterbitkan oleh Supervisor atau Admin.</p></div><button className="app-button" onClick={()=>setRevision(v=>v+1)} disabled={loading}>Muat ulang</button></div>
    <div className="app-filter-grid">{canSwitchSales && <label className="app-field">Sales<select value={salesId} onChange={e=>setSalesId(e.target.value)}><option value="">Pilih sales</option>{choices.map(s=><option key={s.salesId} value={s.salesId}>{s.salesName}</option>)}</select></label>}<label className="app-field">Tanggal PJP<input type="date" required value={date} onChange={e=>{if(e.target.value)setDate(e.target.value);}}/></label></div>
    {error && <p role="alert" className="app-error">{error}</p>}{loading ? <p role="status">Memuat PJP…</p> : !error&&<><p>{stops.length} toko • {stops.filter(s=>['VISITED','COMPLETED'].includes(s.status)).length} selesai</p>{!stops.length && <p className="app-empty">{dayStatus?.state==='NON_WORKING_DAY'?'Tanggal ini bukan hari kerja kunjungan sesuai pengaturan aplikasi.':dayStatus?.state==='NOT_DUE'?'Tidak ada kunjungan yang jatuh tempo pada tanggal ini dalam rencana terbit.':dayStatus?.state==='PUBLISHED'?'Ada jadwal terbit tetapi PJP belum tersedia. Hubungi Supervisor untuk pemeriksaan.':user.role==='SALES'?'Belum ada PJP diterbitkan pada tanggal ini. Periksa interval kunjungan dan hubungi Supervisor bila seharusnya ada penugasan.':'Belum ada PJP untuk pilihan ini. Periksa kalender dan penerbitan rencana melalui Planner.'}</p>}<ol className="workspace-route-list">{stops.map((s,i)=><li className="workspace-card" key={s.id}><span className="app-sequence">{i+1}</span><div><h3>{s.outlet?.name || 'Outlet'}</h3><p>{s.outlet?.address || 'Alamat belum tersedia'}</p><span className="app-status">{visitStatusLabel(s.status)}</span></div></li>)}</ol></>}
  </section>;
}
