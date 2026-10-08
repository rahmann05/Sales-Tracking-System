import React,{useState,useEffect,useCallback,useRef} from 'react';
import {wibDateKey} from '../../../../../shared/visit-metrics.mjs';
import {staffAttendanceApi} from '../../../services/api';
import {FollowUpActions} from './FollowUpActions';
const labels={OPEN:'Terbuka',SUBMITTED:'Menunggu pemeriksaan',DONE:'Selesai diperiksa'};
export const FollowUpPanel=()=>{
 const [loading,setLoading]=useState(true),[data,setData]=useState(null),[error,setError]=useState('');
 const [status,setStatus]=useState('OPEN'),[page,setPage]=useState(1);const flight=useRef(0);
 const reload=useCallback(async()=>{const seq=++flight.current;setLoading(true);try{const res=await staffAttendanceApi.getFollowUps({status,page});if(seq===flight.current){setData({rows:res.data,scope:`${status}:${page}`});setError('');}}catch(e){if(seq===flight.current)setError(e.message);}finally{if(seq===flight.current)setLoading(false);}},[status,page]);
 useEffect(()=>{reload();const tick=setInterval(reload,60000);return()=>{flight.current++;clearInterval(tick);};},[reload]);
 const rows=data?.scope===`${status}:${page}`?data.rows:[];
 return <section className="followup-panel space-y-3"><h3>Tindak lanjut kunjungan</h3><p className="text-xs">Kirim hasil dan bukti/referensi, lalu tunggu pemeriksaan SPV atau Admin. Pemeriksaan bukan verifikasi pelunasan.</p>
  <label>Status <select value={status} onChange={e=>{setStatus(e.target.value);setPage(1);}}>{Object.entries(labels).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
  {error&&<p role="alert" className="text-red-600">{error}</p>}{loading&&<p role="status">Memuat tugas audit / kunjungan…</p>}
  {!loading&&!error&&!rows.length&&<p>Tidak ada tugas sesuai filter.</p>}
  {rows.map(r=><article key={r.id} className="workspace-card space-y-3"><p className="font-medium">{r.outletName} · {r.followUp.status==='DONE'&&!r.followUp.review?'Selesai (riwayat lama)':labels[r.followUp.status]}</p><p className="text-sm">PIC: {r.followUp.ownerName||(r.followUp.sourceKind?r.user?.name:null)||r.followUp.ownerId} · Tenggat {r.followUp.dueDate}{r.followUp.status==='OPEN'&&r.followUp.dueDate<wibDateKey()?' · Terlambat':''}</p><FollowUpActions id={r.id} followUp={r.followUp} onChanged={reload}/></article>)}
  <nav aria-label="Halaman tindak lanjut" className="flex gap-3 items-center"><button disabled={page===1||loading} onClick={()=>setPage(page-1)} className="btn btn-secondary">Sebelumnya</button><span>Halaman {page}</span><button disabled={rows.length<50||loading} onClick={()=>setPage(page+1)} className="btn btn-secondary">Berikutnya</button></nav>
 </section>;
};
