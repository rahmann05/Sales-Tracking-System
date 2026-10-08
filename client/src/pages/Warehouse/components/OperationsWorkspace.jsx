import React,{useCallback,useEffect,useRef,useState,lazy,Suspense} from 'react';
import {deliveryApi} from '../../../services/api';
import {useApp} from '../../../context/AppContext';
import {TAB_IDS} from '../../../constants/navigation';
import {wibDateKey} from '../../../../../shared/visit-metrics.mjs';
import {routeLocation} from '../../../../../shared/delivery-operations.mjs';
import {RouteOperationsActions} from './RouteOperationsActions';
import {OperationalIssues} from './OperationalIssues';
import {OrderFulfillmentPanel} from './OrderFulfillmentPanel';
import {ReturnReceiptAction} from './ReturnReceiptAction';
import {PreparationTasks} from './PreparationTasks';
import {InvoiceReconciliationPanel} from './InvoiceReconciliationPanel';
import {AttentionPanel} from '../../../shared/components/common/AttentionPanel';
const TrackingMap=lazy(()=>import('./DeliveryTrackingMap').then(m=>({default:m.DeliveryTrackingMap})));
const stamp=v=>v?new Date(v).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'}):'Belum tercatat';
export function OperationsWorkspace(){
  const {setActiveTab,user}=useApp();const [data,setData]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(false),[date,setDate]=useState(wibDateKey()),[tab,setTab]=useState('routes'),[filter,setFilter]=useState('OPEN');const flight=useRef(0);
  const refresh=useCallback(async()=>{const id=++flight.current;setLoading(true);try{const r=await deliveryApi.getOperations({date});if(id===flight.current){setData(r.data);setError('');}}catch(e){if(id===flight.current)setError(e.message);}finally{if(id===flight.current)setLoading(false);}},[date]);
  useEffect(()=>{refresh();const timer=setInterval(refresh,30000);return()=>{clearInterval(timer);flight.current++;};},[refresh]);
  const [clock,setClock]=useState(Date.now());
  useEffect(()=>{const timer=setInterval(()=>setClock(Date.now()),15000);return()=>clearInterval(timer);},[]);
  const routes=React.useMemo(()=>(data?.routes||[]).map(r=>({...r,location:routeLocation(r,clock)})),[data,clock]),open=routes.filter(r=>!r.closedAt&&!r.cancelledAt),issues=data?.issues||[];
  const show=filter==='OPEN'?open:filter==='ATTENTION'?open.filter(r=>r.alerts.length||issues.some(i=>i.routeId===r.id)):routes;
  const canManage=user.role==='ADMIN'||user.permissions?.can_manage_delivery_routes!==false;
  return <main className="p-4 md:p-6 max-w-7xl mx-auto space-y-5 pb-24"><header className="flex flex-wrap justify-between gap-3"><div><h1 className="text-2xl font-bold">Pusat kendali pengiriman</h1><p>Order, persiapan gudang, perjalanan dan tindak lanjut sampai tuntas.</p></div><button className="min-h-11 border rounded-xl px-4" disabled={loading} onClick={refresh}>{loading?'Memperbarui…':'Perbarui data'}</button></header>
    <p role="status" className="text-sm">{error?'Data gagal diperbarui — tampilan terakhir mungkin sudah lama.':data?'Pembaruan otomatis setiap 30 detik.':'Memuat antrean…'} Terakhir berhasil: {stamp(data?.generatedAt)}</p>{error&&<p role="alert" className="p-3 border border-red-500 rounded-xl text-red-600">{error}</p>}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[['Order terbuka',data?.orders.length||0],['Packing belum dialokasikan / draft',data?.packings.length||0],['Trip belum ditutup',open.length],['Tindak lanjut terlambat',issues.filter(i=>new Date(i.dueAt)<new Date()).length]].map(([label,value])=><div key={label} className="p-4 bg-surface border rounded-xl"><p className="text-sm">{label}</p><strong className="text-3xl">{value}</strong></div>)}</div>
    <AttentionPanel/>
    <nav aria-label="Pemantauan gudang" className="flex flex-wrap gap-2">{[['routes','Trip & lokasi'],['packing','Antrean packing'],['orders','Pemenuhan order'],['issues','Tindak lanjut'],['commercial','Rekonsiliasi faktur']].map(([id,label])=><button key={id} type="button" aria-pressed={tab===id} className={`min-h-11 px-4 rounded-xl border ${tab===id?'bg-primary text-on-primary':''}`} onClick={()=>setTab(id)}>{label}</button>)}</nav>
    {tab==='routes'&&<><div className="flex flex-wrap gap-3"><label>Lingkup<select className="form-input ml-2" value={filter} onChange={e=>setFilter(e.target.value)}><option value="OPEN">Semua trip terbuka lintas tanggal</option><option value="ATTENTION">Perlu tindakan</option><option value="ALL">Terbuka + riwayat tanggal pilihan</option></select></label><label>Riwayat tanggal<input className="form-input ml-2" type="date" value={date} onChange={e=>{if(e.target.value)setDate(e.target.value);}}/></label>{canManage&&<button className="min-h-11 px-4 border rounded-xl" onClick={()=>setActiveTab(TAB_IDS.DELIVERY_ROUTES)}>Buat / kelola rute</button>}</div>
      <Suspense fallback={<p>Memuat peta…</p>}><TrackingMap routes={show}/></Suspense>
      {show.map(r=><details key={r.id} className="bg-surface border rounded-xl p-4"><summary className="cursor-pointer min-h-11"><strong>{r.code} · {r.vehicle?.code} · {r.driver?.name}</strong><span className="block text-sm">{r.cancelledAt?'Dibatalkan':r.closedAt?'Trip ditutup':r.returnedAt?'Kembali gudang, menunggu penutupan':r.status} · Stop diproses {r.progress.resolved}/{r.progress.total} ({r.progress.completionPercent}%) · Diterima penuh {r.progress.delivered}/{r.progress.total}</span>{r.alerts.length>0&&<span className="block text-amber-700 dark:text-amber-300">{r.alerts.join(' · ')}</span>}<span className="block text-sm">{r.location?`${r.location.isLive?'GPS terkini':r.location.source==='GPS'?'GPS terakhir':'Absensi terakhir'} · ${stamp(r.location.observedAt)}`:'Belum ada posisi truk'}</span></summary>
        <div className="space-y-4 pt-4"><p className="text-sm">Rencana {stamp(r.plannedStartAt)} → {stamp(r.plannedEndAt)}<br/>Berangkat {stamp(r.departedAt)} · Kembali {stamp(r.returnedAt)}<br/>Jarak rencana {r.totalDistanceKm??'—'} km · Aktual {r.actualDistanceKm??'—'} km · BBM aktual {r.actualFuelLiters??'—'} liter</p>
          {canManage&&<RouteOperationsActions route={r} onChanged={refresh}/>}
          <PreparationTasks route={r} people={data.people} canManage={canManage} onChanged={refresh}/>
          {r.stops.map(s=><section className="border rounded-xl p-3 space-y-2" key={s.id}><h3 className="font-bold">{s.sequence}. {s.outlet?.name} · {s.status}</h3><p>{s.allocatedCartons} karton · Ditolak {s.rejectedCartons||0} · {s.rejectReason||''}</p><p className="text-sm">Tiba {stamp(s.arrivedAt)} · Selesai {stamp(s.completedAt)}</p>{s.photoUrl&&<details><summary className="cursor-pointer min-h-11">Lihat bukti pengiriman</summary><img className="max-h-72 rounded-xl" src={s.photoUrl} alt={`Bukti pengiriman ${s.outlet?.name}`}/></details>}<ReturnReceiptAction stop={s} onReceived={refresh}/></section>)}
          <OperationalIssues issues={issues.filter(i=>i.routeId===r.id)} people={data.people} reference={r.closedAt||r.cancelledAt?null:{routeId:r.id}} onChanged={refresh}/>
          <details><summary className="cursor-pointer min-h-11">Riwayat tindakan ({r.history.length})</summary>{r.history.map((h,i)=><p key={i} className="text-sm py-1">{stamp(h.at)} · {h.actorName||h.actorId} · {h.action} · {h.detail?.note}</p>)}</details>
        </div></details>)}{!show.length&&<p>Tidak ada trip dalam lingkup ini.</p>}</>}
    {tab==='packing'&&<section className="space-y-3"><p>Antrean mencakup seluruh tanggal. Draft masih menjadi tanggung jawab Admin; dokumen dilepas menjadi antrean gudang.</p><button className="min-h-11 border rounded-xl px-4" onClick={()=>setActiveTab(TAB_IDS.DELIVERY_PACKING_LIST)}>Buka dokumen packing</button>{data?.packings.map(p=><details key={p.id} className="border rounded-xl p-4"><summary className="cursor-pointer min-h-11"><strong>{p.code} · {p.outlet?.name}</strong><span className="block">{p.status} · Sisa {p.remainingCartons} karton · Menunggu sejak {stamp(p.releasedAt||p.createdAt)}</span></summary><OperationalIssues issues={issues.filter(i=>i.packingListId===p.id&&!i.routeId)} people={data.people} reference={{packingListId:p.id}} onChanged={refresh}/></details>)}</section>}
    {tab==='orders'&&data&&<OrderFulfillmentPanel orders={data.orders} onChanged={refresh} renderActions={o=><OperationalIssues issues={issues.filter(i=>i.orderId===o.id)} people={data.people} reference={{orderId:o.id}} onChanged={refresh}/>}/>}
    {tab==='issues'&&data&&<OperationalIssues issues={issues} people={data.people} onChanged={refresh}/>}
    {tab==='commercial'&&data&&<section className="space-y-3"><h2 className="font-bold">Faktur yang perlu diperiksa ({data.commercialQueue?.length||0})</h2><p>Antrean lintas tanggal mencakup dokumen yang belum terverifikasi atau memiliki selisih. Data lama tetap ditampilkan untuk ditinjau.</p>{data.commercialQueue?.map(p=><details className="border rounded-xl p-4" key={p.id}><summary className="min-h-11 cursor-pointer">{p.code} · {p.outlet?.name}</summary><InvoiceReconciliationPanel packing={p} admin={user.role==='ADMIN'} onChanged={refresh}/></details>)}</section>}
  </main>;
}
