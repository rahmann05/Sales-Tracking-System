import {stopDestinationOutlet} from '../../../../../shared/driver-workspace.mjs';
import {outletOperationalPoint} from '../../../../../shared/outlet-location.mjs';
import {useFeaturePolicy} from '../../../shared/hooks/useFeaturePolicy';
import React from 'react';
import {MapContainer,TileLayer,CircleMarker,Popup} from 'react-leaflet';
import {DeliveryMapFit} from './DeliveryMapFit';
import 'leaflet/dist/leaflet.css';
const stamp=value=>new Date(value).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'});
const resolvePoint=raw=>{if(!raw)return null;const op=outletOperationalPoint(raw);if(op?.latitude!=null&&op?.longitude!=null&&Number.isFinite(Number(op.latitude))&&Number.isFinite(Number(op.longitude)))return {latitude:Number(op.latitude),longitude:Number(op.longitude)};if(raw.latitude!=null&&raw.longitude!=null&&Number.isFinite(Number(raw.latitude))&&Number.isFinite(Number(raw.longitude)))return {latitude:Number(raw.latitude),longitude:Number(raw.longitude)};return null;};
export function DeliveryTrackingMap({routes,issues=[],selectedId,onSelect}){
 const mapPolicy=useFeaturePolicy('MAPS');
 const selectedRoute=routes.find(item=>item.id===selectedId)||routes[0]||null;
 const gpsOffRoutes=routes.filter(r=>r.gpsFlag||(r.departedAt&&!r.returnedAt&&!r.closedAt&&!r.cancelledAt&&!r.location?.isLive));
 const routePoints=route=>[
  ...(resolvePoint(route?.location)?[[Number(route.location.latitude),Number(route.location.longitude)]]:[]),
  ...(route?.stops||[]).flatMap(stop=>{const pt=resolvePoint(stopDestinationOutlet(stop));return pt?[[pt.latitude,pt.longitude]]:[];}),
  ...(route?.stops||[]).flatMap(s=>(s.attendances||[]).flatMap(a=>{const pt=resolvePoint(a);return pt?[[pt.latitude,pt.longitude]]:[];}))
 ];
 const points=routes.flatMap(routePoints);
 const focusPoints=selectedRoute?routePoints(selectedRoute):[];
 if(!mapPolicy.canStart)return <p className="app-notice" role="status">{mapPolicy.reason} Status pengiriman dan bukti presensi tetap tersedia pada daftar.</p>;
 return <section className="space-y-2">
  <p className="text-sm">Hijau: titik toko tujuan pengiriman · Biru: titik armada (GPS aktif) · Jingga/Merah: posisi terakhir armada (GPS mati) · Abu-abu: titik absensi. Titik toko tidak pernah dianggap sebagai posisi armada.</p>
  {gpsOffRoutes.length>0&&<div role="alert" className="p-3 rounded-xl border border-red-500/40 bg-red-500/10 text-red-700 text-xs space-y-1">
   <strong className="block font-bold">FLAG ADMIN — GPS ARMADA MATI DI TENGAH PENGIRIMAN ({gpsOffRoutes.length} trip)</strong>
   {gpsOffRoutes.map(r=><p key={r.id}>• <strong>{r.vehicle?.code||r.code} ({r.code} · {r.driver?.name||'Supir'})</strong>: Armada tidak tersedia posisi langsung di peta karena di tengah pengiriman GPS-nya mati. {r.gpsFlag?.message||(r.location?`Posisi terakhir tercatat ${stamp(r.location.observedAt)} WIB.`:'Belum ada titik GPS armada sejak berangkat.')}</p>)}
  </div>}
  {selectedRoute&&!selectedRoute.departedAt&&<div role="status" className="p-3 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-800 text-xs">
   <strong>Keterangan Peta Armada ({selectedRoute.vehicle?.code||selectedRoute.code}):</strong> Titik armada memang belum tersedia di peta karena trip belum dikirim / belum berangkat ({selectedRoute.status}). Titik-titik toko tujuan pengiriman tetap ditampilkan di bawah.
  </div>}
  {selectedRoute&&selectedRoute.returnedAt&&<div role="status" className="p-3 rounded-xl border border-border-glass bg-surface-variant/40 text-xs">
   <strong>Keterangan Peta Armada ({selectedRoute.vehicle?.code||selectedRoute.code}):</strong> Armada sudah kembali ke gudang pada {stamp(selectedRoute.returnedAt)} WIB.
  </div>}
  {!points.length?<p className="p-4 border rounded-xl">Titik tujuan dan posisi kendaraan belum tersedia. Periksa koordinat outlet pada rencana trip.</p>:<MapContainer center={points[0]} zoom={11} style={{height:360,width:'100%',zIndex:0}} aria-label="Peta posisi truk dan absensi">
   <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/><DeliveryMapFit points={focusPoints.length?focusPoints:points}/>
   {routes.flatMap(r=>(r.stops||[]).map(s=>{const point=resolvePoint(stopDestinationOutlet(s));return point?<CircleMarker key={`target:${s.id}`} center={[point.latitude,point.longitude]} radius={r.id===selectedRoute?.id?9:7} eventHandlers={{click:()=>onSelect?.(r.id)}} pathOptions={{color:'#15803d',fillColor:'#22c55e',fillOpacity:.8}}><Popup><strong>{r.code} · Toko Tujuan #{s.sequence}: {s.outlet?.name}</strong><br/>Long, Lat: {point.longitude.toFixed(6)}, {point.latitude.toFixed(6)}<br/>Lat, Lng: {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}<br/>Muatan: {s.allocatedCartons??0} karton<br/><a href={`https://www.google.com/maps/search/?api=1&query=${point.latitude},${point.longitude}`} target="_blank" rel="noopener noreferrer">Buka Google Maps</a></Popup></CircleMarker>:null;}))}
   {routes.flatMap(r=>(r.stops||[]).flatMap(s=>(s.attendances||[]).map(a=>{const pt=resolvePoint(a);if(!pt)return null;const issue=issues.find(item=>item.stopId===s.id&&(item.history||[]).some(entry=>entry.action==='LOCATION_DISCREPANCY'&&entry.attendanceId===a.id));const evidence=issue?.history?.find(entry=>entry.action==='LOCATION_DISCREPANCY');return <CircleMarker key={a.id} center={[pt.latitude,pt.longitude]} radius={issue?8:5} pathOptions={{color:issue?'#dc2626':'#64748b',fillColor:issue?'#ef4444':'#94a3b8'}}><Popup><strong>{r.code} · {s.outlet?.name}</strong><br/>Absensi {a.type} · {stamp(a.timestamp)}{issue&&<><br/><strong>Periksa selisih lokasi: {Math.round(evidence.distanceMeters)} m</strong><br/>Titik toko dan GPS perlu dibandingkan di tindak lanjut trip.</>}</Popup></CircleMarker>;})))}
   {routes.map(r=>{const pt=resolvePoint(r.location);if(!pt)return null;const gpsDead=Boolean(r.gpsFlag||(r.departedAt&&!r.returnedAt&&!r.location?.isLive));return <CircleMarker key={r.id} center={[pt.latitude,pt.longitude]} radius={r.id===selectedRoute?.id?12:8} eventHandlers={{click:()=>onSelect?.(r.id)}} pathOptions={{weight:r.id===selectedRoute?.id?4:2,color:r.location.isLive?'#2563eb':gpsDead?'#dc2626':'#b45309',fillColor:r.location.isLive?'#3b82f6':gpsDead?'#ef4444':'#f59e0b',fillOpacity:.85}}><Popup><strong>Armada {r.vehicle?.code} · {r.driver?.name}</strong><br/>{r.location.isLive?'GPS armada terkini (aktif)':gpsDead?'FLAG ADMIN: GPS mati di tengah pengiriman (posisi terakhir)':r.location.source==='GPS'?'GPS terakhir':'Absensi terakhir'}<br/>Long, Lat: {pt.longitude.toFixed(6)}, {pt.latitude.toFixed(6)}<br/>Waktu: {stamp(r.location.observedAt)} WIB<br/>{r.location.accuracy!=null?`Akurasi ±${Math.round(r.location.accuracy)} m`:r.location.outletName}</Popup></CircleMarker>;})}
  </MapContainer>}
 </section>;
}

