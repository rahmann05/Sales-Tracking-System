import React,{useCallback,useEffect,useRef,useState} from 'react';
import {request} from '../../../services/httpClient';
import {useApp} from '../../../context/AppContext';
export function AttentionEscalations(){
  const {user}=useApp();const allowed=user?.role==='ADMIN';
  const [data,setData]=useState(null),[page,setPage]=useState(1),[unread,setUnread]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const revision=useRef(0);
  const scope=`${user?.id}:${page}:${unread}`;
  const load=useCallback(async()=>{if(!allowed)return;const version=++revision.current;setBusy(true);
    try{const res=await request(`/attention/escalations?page=${page}&unread=${unread}`);if(version===revision.current){setData({...res.data,scope});setError('');}}
    catch(err){if(version===revision.current)setError(err.message);}finally{if(version===revision.current)setBusy(false);}
  },[allowed,page,unread,scope]);
  useEffect(()=>{setData(null);if(!allowed)return;load();const timer=setInterval(load,60000);window.addEventListener('focus',load);
    return()=>{revision.current++;clearInterval(timer);window.removeEventListener('focus',load);};
  },[allowed,load]);
  if(!allowed)return null;
  const read=async id=>{setBusy(true);setError('');try{await request(`/notifications/${id}/read`,{method:'PATCH'});window.dispatchEvent(new Event('notifications:changed'));await load();}catch(err){setError(err.message);}finally{setBusy(false);}};
  const current=data?.scope===scope;
  return <section className="border rounded-xl p-3 space-y-3" aria-label="Eskalasi SLA untuk Admin">
    <h3 className="font-semibold">Eskalasi SLA · {current?data.unreadCount:'—'} belum dibaca</h3>
    <p className="text-xs">Pemberitahuan berdasarkan status saat pemindaian. Membaca notifikasi tidak menyelesaikan pekerjaan; periksa antrean untuk status terbaru. Diperbarui setiap menit saat panel terbuka.</p>
    <div className="flex flex-wrap gap-2"><label>Tampilkan<select className="form-input block" value={unread?'UNREAD':'ALL'} onChange={event=>{setUnread(event.target.value==='UNREAD');setPage(1);}}><option value="UNREAD">Belum dibaca</option><option value="ALL">Semua riwayat</option></select></label><button type="button" className="btn btn-secondary min-h-11" disabled={busy} onClick={load}>Perbarui eskalasi</button></div>
    {busy&&<p role="status">Memuat eskalasi…</p>}{error&&<p role="alert" className="text-red-600">{error}</p>}
    {current&&!error&&data.items.map(item=><article key={item.id} className="border-t pt-2 space-y-2"><strong>{item.title}</strong><p className="text-sm">{item.message}</p><p className="text-xs">{new Date(item.createdAt).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})} WIB</p>{!item.isRead&&<button type="button" className="btn btn-secondary min-h-11" disabled={busy} onClick={()=>read(item.id)}>Tandai dibaca</button>}</article>)}
    {current&&!busy&&!error&&!data.items.length&&<p>Tidak ada eskalasi sesuai filter.</p>}
    <nav className="flex items-center gap-2" aria-label="Halaman eskalasi"><button type="button" className="btn btn-secondary min-h-11" disabled={busy||page===1} onClick={()=>setPage(value=>value-1)}>Sebelumnya</button><span>Halaman {page} · {current?data.total:'—'} pemberitahuan</span><button type="button" className="btn btn-secondary min-h-11" disabled={busy||!current||page*data.limit>=data.total} onClick={()=>setPage(value=>value+1)}>Berikutnya</button></nav>
  </section>;
}
