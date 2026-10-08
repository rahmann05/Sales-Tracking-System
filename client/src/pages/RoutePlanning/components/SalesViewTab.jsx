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
  useEffect(()=>{if(!salesId && matrixRows.length)setSalesId(matrixRows[0].salesId);},[matrixRows,salesId]);
  useEffect(()=>{if(!salesId)return;let live=true;setLoading(true);setError('');setRoutes([]);collectPages(pjpApi.getAllPjps,{date,userId:salesId}).then(res=>{if(live)setRoutes(res.data || []);}).catch(e=>{if(live)setError(e.message);}).finally(()=>{if(live)setLoading(false);});return()=>{live=false;};},[salesId,date,revision]);
  const stops = routes.flatMap(r=>r.stops || []);
  return <section className="workspace-section"><div className="workspace-heading"><div><h2>PJP harian</h2><p>Urutan outlet pada tanggal terpilih. Jadwal kunjungan ditetapkan oleh Supervisor.</p></div><button className="app-button" onClick={()=>setRevision(v=>v+1)} disabled={loading}>Muat ulang</button></div>
    <div className="app-filter-grid">{canSwitchSales && <label className="app-field">Sales<select value={salesId} onChange={e=>setSalesId(e.target.value)}><option value="">Pilih sales</option>{matrixRows.map(s=><option key={s.salesId} value={s.salesId}>{s.salesName}</option>)}</select></label>}<label className="app-field">Tanggal PJP<input type="date" required value={date} onChange={e=>{if(e.target.value)setDate(e.target.value);}}/></label></div>
    {error && <p role="alert" className="app-error">{error}</p>}{loading ? <p role="status">Memuat PJP…</p> : !error&&<><p>{stops.length} toko • {stops.filter(s=>['VISITED','COMPLETED'].includes(s.status)).length} selesai</p>{!stops.length && <p className="app-empty">{user.role==='SALES'?'Belum ada outlet yang ditugaskan pada tanggal ini. Hubungi Supervisor jika jadwal perlu diperiksa.':'Belum ada PJP untuk pilihan ini. Periksa tim, wilayah, hari kerja, dan template jadwal.'}</p>}<ol className="workspace-route-list">{stops.map((s,i)=><li className="workspace-card" key={s.id}><span className="app-sequence">{i+1}</span><div><h3>{s.outlet?.name || 'Outlet'}</h3><p>{s.outlet?.address || 'Alamat belum tersedia'}</p><span className="app-status">{visitStatusLabel(s.status)}</span></div></li>)}</ol></>}
  </section>;
}
