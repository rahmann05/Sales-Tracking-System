import React,{lazy,Suspense} from 'react';
import {LuRefreshCw,LuNavigation} from 'react-icons/lu';
import {useDriverTrips} from '../useDriverTrips';
import {useWorkspaceState} from '../../../shared/hooks/useWorkspaceState';
import {orderedStops,nextDeliveryStop,deliveryNavigationUrl,validOutletPoint} from '../../../../../shared/driver-workspace.mjs';
import {deliveryRouteLabel,deliveryStopLabel} from '../../Warehouse/deliveryLabels';
const DestinationMap=lazy(()=>import('./DriverDestinationMap').then(m=>({default:m.DriverDestinationMap})));
export function DriverRouteMap(){
 const {routes,activeRoute:trip,selectTrip,loading,error,refresh}=useDriverTrips();
 const [selectedId,selectStop]=useWorkspaceState('driverMapStop','');
 const stops=React.useMemo(()=>orderedStops(trip),[trip]),selected=stops.find(s=>s.id===selectedId),target=selected||nextDeliveryStop(stops)||stops[0],navigation=deliveryNavigationUrl(target?.outlet);
 return <div className="workspace-page logistics-workspace"><header className="admin-page-heading"><div><p className="admin-eyebrow">Driver / Tujuan pengiriman</p><h1>Peta tujuan</h1><p>Pilih trip dan tujuan, lalu buka navigasi dari ponsel.</p></div><button type="button" className="admin-button" disabled={loading} onClick={refresh}><LuRefreshCw/>Perbarui</button></header>
  {error&&<p role="alert" className="admin-feedback error">{error} Peta menampilkan data terakhir yang berhasil dimuat.</p>}
  {trip?<><div className="admin-toolbar"><label className="admin-select-label">Trip pengiriman<select value={trip.id} onChange={e=>{selectTrip(e.target.value);selectStop('');}}>{routes.map(r=><option key={r.id} value={r.id}>{r.code} · {deliveryRouteLabel(r)}</option>)}</select></label><p className="admin-footnote">Tanggal trip {new Date(trip.date).toLocaleDateString('id-ID',{timeZone:'Asia/Jakarta'})} · {stops.length} tujuan</p>{navigation&&<a className="admin-button primary" href={navigation} target="_blank" rel="noopener noreferrer"><LuNavigation/>Navigasi ke {target?.outlet?.name}</a>}</div>
   <div className="logistics-map-layout"><section className="admin-panel logistics-stop-list"><div className="admin-panel-heading"><h2>Tujuan trip</h2><button type="button" className="admin-button" onClick={()=>selectStop('')}>Lihat semua</button></div><ol>{stops.map((stop,index)=><li key={stop.id}><button type="button" aria-pressed={selectedId===stop.id} onClick={()=>selectStop(stop.id)}><span className="logistics-sequence">{index+1}</span><span><strong>{stop.outlet?.name||'Outlet'}</strong><small>{stop.outlet?.address}</small><small>{deliveryStopLabel(stop.status)}{!validOutletPoint(stop.outlet)?' · Koordinat belum tersedia':''}</small></span></button></li>)}</ol></section><section className="admin-panel logistics-map-panel" aria-label="Peta lokasi tujuan"><Suspense fallback={<p className="admin-empty">Memuat peta…</p>}><DestinationMap stops={stops} selectedId={selectedId} onSelect={selectStop}/></Suspense></section></div><p className="admin-footnote">Nomor pada peta mengikuti urutan trip. Titik adalah lokasi outlet, bukan posisi langsung truk. Navigasi jalan dibuka melalui Google Maps.</p>
  </>:<p className="admin-empty">{loading?'Memuat trip…':'Belum ada trip terbuka yang ditugaskan.'}</p>}
 </div>;
}
