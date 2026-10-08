import React,{useState,lazy,Suspense} from 'react';
import {LuSearch,LuMapPin} from 'react-icons/lu';
import {TripOperationsDetail} from './TripOperationsDetail';
import {deliveryRouteLabel} from '../deliveryLabels';
const TrackingMap=lazy(()=>import('./DeliveryTrackingMap').then(module=>({default:module.DeliveryTrackingMap})));
const stamp=value=>value?new Date(value).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'}):'Belum tercatat';
export function TripMonitorWorkspace({routes,people,issues,canManage,disabled=false,onChanged}){
  const [selectedId,setSelectedId]=useState(null),[search,setSearch]=useState('');
  const select=id=>{if(window.dispatchEvent(new CustomEvent('app:before-navigate',{cancelable:true})))setSelectedId(id);};
  const query=search.trim().toLocaleLowerCase('id-ID');
  const visible=routes.filter(route=>`${route.code} ${route.vehicle?.code||''} ${route.driver?.name||''} ${route.stops.map(stop=>stop.outlet?.name||'').join(' ')}`.toLocaleLowerCase('id-ID').includes(query));
  const selected=visible.find(route=>route.id===selectedId)||visible[0];
  return <div className="admin-trip-workspace">
    <div className="admin-monitor-layout"><section className="admin-panel admin-trip-list" aria-label="Daftar trip"><div className="admin-panel-heading"><h2>Trip pengiriman</h2><span>{visible.length} trip</span></div><label className="admin-search"><LuSearch aria-hidden="true"/><input type="search" aria-label="Cari trip pengiriman" placeholder="Cari trip, truk, atau driver…" value={search} onChange={event=>{if(window.dispatchEvent(new CustomEvent('app:before-navigate',{cancelable:true})))setSearch(event.target.value);}}/></label><div className="admin-trip-list-scroll">{visible.map(route=><button key={route.id} type="button" className="admin-trip-item" aria-pressed={selected?.id===route.id} onClick={()=>select(route.id)}><span className="admin-trip-item-heading"><strong>{route.vehicle?.code||route.code}</strong><span className="admin-status">{deliveryRouteLabel(route)}</span></span><span>{route.code} · {route.driver?.name||'Driver belum ditetapkan'}</span><span className="admin-trip-progress"><span style={{width:`${Math.min(100,Math.max(0,route.progress.completionPercent))}%`}}/></span><span>{route.progress.resolved}/{route.progress.total} stop diproses · {route.progress.delivered} diterima penuh</span><span className={`admin-location-label ${route.location?.isLive?'live':''}`}><LuMapPin/>{route.location?route.location.isLive?'GPS terkini':route.location.source==='GPS'?'GPS terakhir':'Absensi terakhir':'Belum ada posisi'}</span>{route.alerts.length>0&&<span className="admin-trip-alert">{route.alerts.join(' · ')}</span>}</button>)}{!visible.length&&<p className="admin-empty">Tidak ada trip dalam pilihan ini.</p>}</div></section>
      <section className="admin-panel admin-trip-map"><div className="admin-panel-heading"><div><h2>Lokasi armada</h2><p>{selected?`${selected.vehicle?.code||selected.code} · ${selected.location?stamp(selected.location.observedAt):'Belum ada lokasi; peta menampilkan armada lain yang memiliki posisi.'}`:'Pilih lingkup atau cari trip'}</p></div>{selected?.location?.isLive&&<span className="admin-status admin-status-approved">GPS terkini</span>}</div><Suspense fallback={<p className="admin-empty">Memuat peta…</p>}><TrackingMap routes={visible} selectedId={selected?.id} onSelect={select}/></Suspense></section>
    </div>
    {selected&&<fieldset disabled={disabled}><TripOperationsDetail key={selected.id} route={selected} people={people} issues={issues} canManage={canManage} onChanged={onChanged}/></fieldset>}
  </div>;
}
