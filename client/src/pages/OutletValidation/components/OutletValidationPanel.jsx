import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { outletsApi, outletValidationApi, collectPages } from '../../../services/api';
import { Input } from '../../../shared/components/common/Input';
import { OutletValidationDetail } from './OutletValidationDetail';
const LABELS = {UNVALIDATED:'Belum diperiksa',INCOMPLETE:'Data belum lengkap',VALID:'Sesuai peta',LIKELY_VALID:'Cenderung sesuai',WARNING:'Perlu tinjauan',SUSPECT:'Perlu koreksi'};
export function OutletValidationPanel() {
  const [outlets,setOutlets] = useState([]);
  const [loading,setLoading] = useState(false);
  const [busy,setBusy] = useState('');
  const [error,setError] = useState('');
  const [search,setSearch] = useState('');
  const [status,setStatus] = useState('ALL');
  const [selected,setSelected] = useState(null);
  const [page,setPage] = useState(1);
  const load = useCallback(async()=>{setLoading(true);setError('');try{const res=await collectPages(outletsApi.getAll);setOutlets(res.data || []);}catch(e){setError(e.message);}finally{setLoading(false);}},[]);
  useEffect(()=>{load();},[load]);
  const filtered = useMemo(()=>outlets.filter(o=>(status==='ALL' || (o.validationStatus || 'UNVALIDATED')===status) && `${o.name} ${o.outletCode} ${o.address}`.toLowerCase().includes(search.toLowerCase())),[outlets,search,status]);
  const pages = Math.max(1,Math.ceil(filtered.length/20));
  const currentPage = Math.min(page,pages);
  const validate = async id=>{setBusy(id);setError('');try{await outletValidationApi.validateSingle(id);await load();}catch(e){setError(e.message);}finally{setBusy('');}};
  const row = selected && outlets.find(o=>o.id===selected);
  return <section className="workspace-section">
    <p className="app-notice">Perbandingan peta membantu menemukan ketidaksesuaian nama, alamat, dan GPS. Hasilnya bukan bukti kunjungan fisik. Koreksi koordinat harus didukung pengecekan lapangan.</p>
    <div className="app-filter-grid"><Input label="Cari outlet" type="search" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Nama, kode, atau alamat"/><label className="app-field">Status pemeriksaan<select value={status} onChange={e=>{setStatus(e.target.value);setPage(1);}}><option value="ALL">Semua status</option>{Object.entries(LABELS).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label><button className="app-button" disabled={loading || Boolean(busy)} onClick={load}>Muat ulang</button></div>
    {error && <p className="app-error" role="alert">{error}</p>}
    {loading ? <p role="status">Memuat outlet…</p> : <><p>{filtered.length} outlet ditemukan</p><div className="workspace-card-grid">{filtered.slice((currentPage-1)*20,currentPage*20).map(o=><article className="workspace-card" key={o.id}><div className="workspace-heading"><h3>{o.name}</h3><span className="app-status">{LABELS[o.validationStatus] || LABELS.UNVALIDATED}</span></div><p>{o.outletCode || 'Tanpa kode'} • {o.cluster?.name || 'Belum ditugaskan'}</p><p>{o.address || 'Alamat belum tersedia'}</p><p>GPS: {o.latitude}, {o.longitude}</p>{o.validationConfidence != null && <p>Skor pembanding: {o.validationConfidence}%</p>}<div className="app-actions"><button className="app-button" onClick={()=>setSelected(o.id)}>Detail & koreksi</button><button className="app-button app-button-primary" disabled={Boolean(busy)} onClick={()=>validate(o.id)}>{busy===o.id?'Memeriksa…':o.validatedAt?'Periksa ulang':'Periksa peta'}</button></div></article>)}</div>{!filtered.length && <p className="app-empty">Tidak ada outlet sesuai filter.</p>}<nav className="app-actions" aria-label="Halaman outlet"><button className="app-button" onClick={()=>setPage(currentPage-1)} disabled={currentPage===1}>Sebelumnya</button><span aria-live="polite">{currentPage} / {pages}</span><button className="app-button" onClick={()=>setPage(currentPage+1)} disabled={currentPage>=pages}>Berikutnya</button></nav></>}
    <OutletValidationDetail outlet={row} onClose={()=>setSelected(null)} onSaved={load}/>
  </section>;
}
