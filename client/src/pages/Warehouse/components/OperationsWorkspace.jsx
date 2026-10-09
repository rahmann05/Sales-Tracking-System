import {WarehouseOperationsView} from './WarehouseOperationsView';
import {useWorkspaceState} from '../../../shared/hooks/useWorkspaceState';
import React,{useCallback,useEffect,useRef,useState} from 'react';
import {deliveryApi} from '../../../services/api';
import {useApp} from '../../../context/AppContext';
import {TAB_IDS} from '../../../constants/navigation';
import {wibDateKey} from '../../../../../shared/visit-metrics.mjs';
import {routeLocation} from '../../../../../shared/delivery-operations.mjs';
import {OperationalIssues} from './OperationalIssues';
import {OrderFulfillmentPanel} from './OrderFulfillmentPanel';
import {InvoiceReconciliationPanel} from './InvoiceReconciliationPanel';
import {AttentionPanel} from '../../../shared/components/common/AttentionPanel';
import {TripMonitorWorkspace} from './TripMonitorWorkspace';
const stamp=v=>v?new Date(v).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'}):'Belum tercatat';
export function OperationsWorkspace({section='routes'}={}){
  const {setActiveTab,user}=useApp();const [data,setData]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(false),[tab,setTab]=useState('routes');const [date,setDate]=useWorkspaceState('deliveryHistoryDate',wibDateKey()),[filter,setFilter]=useWorkspaceState('deliveryScope','OPEN');const flight=useRef(0);
  const refresh=useCallback(async()=>{const id=++flight.current;setLoading(true);try{const r=await deliveryApi.getOperations({date});if(id===flight.current){setData(r.data);setError('');}}catch(e){if(id===flight.current)setError(e.message);}finally{if(id===flight.current)setLoading(false);}},[date]);
  useEffect(()=>{refresh();const timer=setInterval(refresh,30000);return()=>{clearInterval(timer);flight.current++;};},[refresh]);
  const [clock,setClock]=useState(Date.now());
  useEffect(()=>{const timer=setInterval(()=>setClock(Date.now()),15000);return()=>clearInterval(timer);},[]);
  const routes=React.useMemo(()=>(data?.routes||[]).map(r=>({...r,location:routeLocation(r,clock,r.locationPolicy||{enabled:false})})),[data,clock]),open=routes.filter(r=>!r.closedAt&&!r.cancelledAt),issues=data?.issues||[];
  const show=filter==='OPEN'?open:filter==='ATTENTION'?open.filter(r=>r.alerts.length||issues.some(i=>i.routeId===r.id)):routes;
  const canManage=user.permissions?.can_manage_delivery_routes!==false;
  if(user.role==='KEPALA_GUDANG')return <WarehouseOperationsView {...{section,data,error,loading,refresh,filter,setFilter,date,setDate,routes,open,issues,canManage,setActiveTab}}/>;
  return <div className="workspace-page delivery-operations-workspace space-y-5"><header className="admin-page-heading"><div><h1>Pusat kendali pengiriman</h1><p>Order, persiapan gudang, perjalanan dan tindak lanjut sampai tuntas.</p></div><button className="admin-button" disabled={loading} onClick={refresh}>{loading?'Memperbarui…':'Perbarui data'}</button></header>
    <p role="status" className="text-sm">{error?'Data gagal diperbarui — tampilan terakhir mungkin sudah lama.':data?'Pembaruan otomatis setiap 30 detik.':'Memuat antrean…'} Terakhir berhasil: {stamp(data?.generatedAt)}</p>{error&&<p role="alert" className="p-3 border border-red-500 rounded-xl text-red-600">{error}</p>}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[['Order terbuka',data?.orders.length||0],['Packing belum dialokasikan / draft',data?.packings.length||0],['Trip belum ditutup',open.length],['Tindak lanjut terlambat',issues.filter(i=>new Date(i.dueAt)<new Date()).length]].map(([label,value])=><div key={label} className="p-4 bg-surface border rounded-xl"><p className="text-sm">{label}</p><strong className="text-3xl">{value}</strong></div>)}</div>
    {user.role!=='ADMIN'&&<AttentionPanel/>}
    <nav aria-label="Pemantauan gudang" className="flex flex-wrap gap-2">{[['routes','Trip & lokasi'],['packing','Antrean packing'],['orders','Pemenuhan order'],['issues','Tindak lanjut'],['commercial','Rekonsiliasi faktur']].map(([id,label])=><button key={id} type="button" aria-pressed={tab===id} className={`min-h-11 px-4 rounded-xl border ${tab===id?'bg-primary text-on-primary':''}`} onClick={()=>setTab(id)}>{label}</button>)}</nav>
    {tab==='routes'&&<><div className="admin-toolbar admin-trip-filters"><label className="admin-select-label">Lingkup<select value={filter} onChange={e=>setFilter(e.target.value)}><option value="OPEN">Semua trip terbuka lintas tanggal</option><option value="ATTENTION">Perlu tindakan</option><option value="ALL">Terbuka + riwayat tanggal pilihan</option></select></label><label className="admin-select-label">Riwayat tanggal<input type="date" value={date} onChange={e=>{if(e.target.value)setDate(e.target.value);}}/></label>{canManage&&<button className="admin-button" onClick={()=>setActiveTab(TAB_IDS.DELIVERY_ROUTES)}>Buat / kelola rute</button>}</div>
      <TripMonitorWorkspace routes={show} people={data?.people||[]} issues={issues} canManage={canManage} onChanged={refresh}/></>}
    {tab==='packing'&&<section className="space-y-3"><p>Antrean mencakup seluruh tanggal. Draft masih menjadi tanggung jawab Admin; dokumen dilepas menjadi antrean gudang.</p><button className="min-h-11 border rounded-xl px-4" onClick={()=>setActiveTab(TAB_IDS.DELIVERY_PACKING_LIST)}>Buka dokumen packing</button>{data?.packings.map(p=><details key={p.id} className="border rounded-xl p-4"><summary className="cursor-pointer min-h-11"><strong>{p.code} · {p.outlet?.name}</strong><span className="block">{p.status} · Sisa {p.remainingCartons} karton · Menunggu sejak {stamp(p.releasedAt||p.createdAt)}</span></summary><OperationalIssues issues={issues.filter(i=>i.packingListId===p.id&&!i.routeId)} people={data.people} reference={{packingListId:p.id}} onChanged={refresh}/></details>)}</section>}
    {tab==='orders'&&data&&<OrderFulfillmentPanel orders={data.orders} onChanged={refresh} renderActions={o=><OperationalIssues issues={issues.filter(i=>i.orderId===o.id)} people={data.people} reference={{orderId:o.id}} onChanged={refresh}/>}/>}
    {tab==='issues'&&data&&<OperationalIssues issues={issues} people={data.people} onChanged={refresh}/>}
    {tab==='commercial'&&data&&<section className="space-y-3"><h2 className="font-bold">Faktur yang perlu diperiksa ({data.commercialQueue?.length||0})</h2><p>Antrean lintas tanggal mencakup dokumen yang belum terverifikasi atau memiliki selisih. Data lama tetap ditampilkan untuk ditinjau.</p>{data.commercialQueue?.map(p=><details className="border rounded-xl p-4" key={p.id}><summary className="min-h-11 cursor-pointer">{p.code} · {p.outlet?.name}</summary><InvoiceReconciliationPanel packing={p} admin={user.role==='ADMIN'} onChanged={refresh}/></details>)}</section>}
  </div>;
}
