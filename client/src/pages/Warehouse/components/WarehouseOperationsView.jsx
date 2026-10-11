import {AttentionPanel} from '../../../shared/components/common/AttentionPanel';
import React from 'react';
import {LuRefreshCw,LuTruck} from 'react-icons/lu';
import {TripMonitorWorkspace} from './TripMonitorWorkspace';
import {TAB_IDS} from '../../../constants/navigation';
export function WarehouseOperationsView({section,data,error,loading,refresh,filter,setFilter,date,setDate,routes,open,issues,canManage,setActiveTab}){
 if(section==='issues')return <AttentionPanel/>;
 const show=filter==='OPEN'?open:filter==='ATTENTION'?open.filter(r=>r.alerts?.length||issues.some(i=>i.routeId===r.id)):routes;
 const routeAccess=canManage&&!error;
 const guarded=action=>{if(window.dispatchEvent(new CustomEvent('app:before-navigate',{cancelable:true})))action();};
 return <div className="workspace-page logistics-workspace"><header className="admin-page-heading"><div><p className="admin-eyebrow">Gudang / Pemantauan armada</p><h1>Pantau pengiriman</h1><p>Pantau seluruh trip terbuka lintas tanggal, posisi terakhir, dan hasil tiap tujuan.</p></div><button type="button" className="admin-button" disabled={loading} onClick={refresh}><LuRefreshCw/>{loading?'Memperbarui…':'Perbarui'}</button></header>
  <p role="status" className="admin-footnote">Pembaruan setiap 30 detik · Terakhir berhasil: {data?.generatedAt?new Date(data.generatedAt).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})+' WIB':'Belum tersedia'}</p>{error&&<p role="alert" className="admin-feedback error">{error} Data terakhir tetap ditampilkan. Perbarui sebelum melakukan tindakan.</p>}
  <div className="logistics-metrics">{[['Trip belum ditutup',data?open.length:'—'],['Trip perlu perhatian',data?open.filter(r=>r.alerts?.length||issues.some(i=>i.routeId===r.id)).length:'—'],['Masalah lewat tenggat',data?issues.filter(i=>i.dueAt&&new Date(i.dueAt)<new Date()).length:'—']].map(([label,value])=><div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
   <div className="admin-toolbar"><label className="admin-select-label">Lingkup trip<select value={filter} onChange={e=>guarded(()=>setFilter(e.target.value))}><option value="OPEN">Seluruh trip terbuka</option><option value="ATTENTION">Trip perlu perhatian</option><option value="ALL">Terbuka + riwayat tanggal pilihan</option></select></label>{filter==='ALL'&&<label className="admin-select-label">Tanggal riwayat WIB<input type="date" value={date} onChange={e=>{if(e.target.value)guarded(()=>setDate(e.target.value));}}/></label>}{canManage&&<button type="button" className="admin-button" onClick={()=>setActiveTab(TAB_IDS.DELIVERY_ROUTES)}><LuTruck/>Rencana trip</button>}</div><TripMonitorWorkspace routes={show} people={data?.people||[]} issues={issues} canManage={routeAccess} disabled={!!error} onChanged={refresh}/><p className="admin-footnote">Status GPS terkini mengikuti batas usia lokasi dan aturan berbagi GPS masing-masing Driver yang diatur Admin. Saat GPS tidak tersedia, posisi terakhir berasal dari titik absensi beserta waktunya. Selesai diproses mencakup penolakan; penerimaan penuh ditampilkan terpisah.</p>
 </div>;
}
