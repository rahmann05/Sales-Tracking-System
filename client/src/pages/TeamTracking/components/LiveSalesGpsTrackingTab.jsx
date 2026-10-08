import React,{useCallback,useEffect,useRef,useState} from 'react';
import {LuRefreshCw} from 'react-icons/lu';
import {usersApi} from '../../../services/api';
import {useApp} from '../../../context/AppContext';
import {useWorkspaceState} from '../../../shared/hooks/useWorkspaceState';
import {SalesPositionMap} from './SalesPositionMap';
import {locationPresentation,locationTime} from '../locationPresentation';
export function LiveSalesGpsTrackingTab({onSelectSalesId}){
  const {settings}=useApp();
  const [rows,setRows]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(true),[updated,setUpdated]=useState(null),[now,setNow]=useState(Date.now());
  const [search,setSearch]=useWorkspaceState('gpsSearch',''),[filter,setFilter]=useWorkspaceState('gpsFilter','all'),[selectedId,setSelectedId]=useWorkspaceState('gpsSales','');
  const pending=useRef(false),mounted=useRef(false);
  const timeoutMinutes=Number(settings?.LIVE_TRACKING_PING_TIMEOUT_MINUTES)||15;
  const load=useCallback(async()=>{
    if(pending.current)return;pending.current=true;setLoading(true);
    try{const response=await usersApi.getLiveLocations();const data=response.data??response;if(!Array.isArray(data))throw new Error('Respons lokasi belum dapat dibaca.');if(mounted.current){setRows(data);setError('');setUpdated(Date.now());}}
    catch(e){if(mounted.current)setError(e.message);}finally{pending.current=false;if(mounted.current)setLoading(false);}
  },[]);
  useEffect(()=>{mounted.current=true;load();const refresh=()=>{setNow(Date.now());if(!document.hidden)load();};const timer=setInterval(refresh,20000);document.addEventListener('visibilitychange',refresh);window.addEventListener('focus',refresh);return()=>{mounted.current=false;clearInterval(timer);document.removeEventListener('visibilitychange',refresh);window.removeEventListener('focus',refresh);};},[load]);
  const visible=(rows||[]).filter(row=>{
    const state=locationPresentation(row,now,timeoutMinutes);
    return `${row.salesName} ${row.clusterName||''}`.toLocaleLowerCase('id-ID').includes(search.trim().toLocaleLowerCase('id-ID'))&&(filter==='all'||filter==='missing'&&!state.hasPosition||filter==='live'&&state.tone==='live'||filter==='visit'&&row.activityStatus==='IN_VISIT');
  });
  const selected=visible.find(row=>row.salesId===selectedId);
  const choose=id=>{setSelectedId(id);onSelectSalesId?.(id);};
  return <section className="spv-live-workspace" aria-label="Posisi terkini sales">
    <div className="spv-toolbar"><label className="spv-search">Cari sales<input type="search" value={search} onChange={e=>setSearch(e.target.value,{replace:true})} placeholder="Nama sales atau wilayah…"/></label><label>Kondisi<select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">Seluruh tim</option><option value="live">GPS terkini</option><option value="visit">Dalam kunjungan</option><option value="missing">Lokasi belum tersedia</option></select></label><button type="button" className="app-button" disabled={loading} onClick={load}><LuRefreshCw/>{loading?'Memperbarui…':'Perbarui posisi'}</button></div>
    <p className="spv-note" role="status">Posisi terkini • Pembaruan setiap 20 detik saat halaman aktif. Terakhir berhasil: {locationTime(updated)}.{error?' Pembaruan gagal; data terakhir mungkin sudah lama.':''}</p>
    {error&&<p role="alert" className="app-error">{error}</p>}
    {rows===null?<p className="spv-panel" role="status">{loading?'Memuat posisi tim…':'Data posisi belum tersedia. Gunakan Perbarui posisi untuk mencoba kembali.'}</p>:<div className="spv-live-layout"><section className="spv-panel spv-sales-list" aria-label="Sales dalam cakupan akses"><div className="spv-detail-heading"><h2>Tim sales</h2><span>{visible.length} sales</span></div>{visible.map(row=>{const state=locationPresentation(row,now,timeoutMinutes);return <button type="button" key={row.salesId} className="spv-sales-row" aria-pressed={selectedId===row.salesId} onClick={()=>choose(row.salesId)}><span className="spv-sales-row-heading"><strong>{row.salesName}</strong><span className={`spv-location-badge ${state.tone}`}>{state.label}</span></span><span>{row.clusterName||'Wilayah belum ditetapkan'}</span><span>{row.activityDescription||'Aktivitas belum tersedia'}</span><span className="spv-sales-row-footer"><span>PJP {row.pjpProgress?.completedStops??'—'} / {row.pjpProgress?.totalStops??'—'}</span><span>{locationTime(row.lastUpdated)}</span></span></button>;})}{!visible.length&&<p className="spv-note spv-empty">Tidak ada sales sesuai filter.</p>}</section><div className="spv-position-content"><SalesPositionMap rows={visible} selectedId={selectedId} onSelect={choose} timeoutMinutes={timeoutMinutes}/>{selected&&<section className="spv-panel spv-position-detail"><div className="spv-detail-heading"><h2>{selected.salesName}</h2><button type="button" className="app-button" onClick={()=>setSelectedId('')}>Tutup detail</button></div><p>{selected.activityDescription}</p><dl><div><dt>Sumber lokasi</dt><dd>{locationPresentation(selected,now,timeoutMinutes).label}</dd></div><div><dt>Waktu rekam titik</dt><dd>{locationTime(selected.lastUpdated)}</dd></div><div><dt>Tujuan PJP berikutnya</dt><dd>{selected.pjpProgress?.nextStopName||'Belum tersedia'}</dd></div></dl></section>}<p className="spv-note">Titik absensi menunjukkan lokasi saat absen. Garis putus-putus menghubungkan rekaman GPS dan bukan kepastian jalur jalan yang ditempuh.</p></div></div>}
  </section>;
}
