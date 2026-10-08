import React from 'react';
import {MapContainer,TileLayer,CircleMarker,Popup} from 'react-leaflet';
import {DeliveryMapFit} from './DeliveryMapFit';
import 'leaflet/dist/leaflet.css';
const stamp=value=>new Date(value).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'});
export function DeliveryTrackingMap({routes,selectedId,onSelect}){
  const points=React.useMemo(()=>routes.flatMap(r=>[...(r.location?[[r.location.latitude,r.location.longitude]]:[]),...r.stops.flatMap(s=>(s.attendances||[]).map(a=>[a.latitude,a.longitude]))]),[routes]);
  const focusPoints=React.useMemo(()=>{const route=routes.find(item=>item.id===selectedId);return route?[...(route.location?[[route.location.latitude,route.location.longitude]]:[]),...route.stops.flatMap(stop=>(stop.attendances||[]).map(attendance=>[attendance.latitude,attendance.longitude]))]:[];},[routes,selectedId]);
  if(!points.length)return <p className="p-4 border rounded-xl">Belum ada posisi GPS atau titik absensi. Posisi truk tidak diasumsikan dari alamat toko.</p>;
  return <section className="space-y-2"><p className="text-sm">Posisi truk menggunakan ponsel driver. Biru: GPS terkini · Jingga: posisi terakhir · Abu-abu: titik absensi. Ketuk titik untuk waktu dan sumbernya.</p>
    <MapContainer center={points[0]} zoom={11} style={{height:360,width:'100%',zIndex:0}} aria-label="Peta posisi truk dan absensi">
      <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/><DeliveryMapFit points={focusPoints.length?focusPoints:points}/>
      {routes.flatMap(r=>r.stops.flatMap(s=>(s.attendances||[]).map(a=><CircleMarker key={a.id} center={[a.latitude,a.longitude]} radius={5} pathOptions={{color:'#64748b'}}><Popup><strong>{r.code} · {s.outlet?.name}</strong><br/>Absensi {a.type} · {stamp(a.timestamp)}</Popup></CircleMarker>)))}
      {routes.map(r=>r.location&&<CircleMarker key={r.id} center={[r.location.latitude,r.location.longitude]} radius={r.id===selectedId?12:8} eventHandlers={{click:()=>onSelect?.(r.id)}} pathOptions={{weight:r.id===selectedId?4:2,color:r.location.isLive?'#2563eb':r.location.source==='GPS'?'#b45309':'#64748b',fillOpacity:.8}}><Popup><strong>{r.vehicle?.code} · {r.driver?.name}</strong><br/>{r.location.isLive?'GPS terkini':r.location.source==='GPS'?'GPS terakhir':'Absensi terakhir'}<br/>{stamp(r.location.observedAt)}<br/>{r.location.accuracy!=null?`Akurasi ±${Math.round(r.location.accuracy)} m`:r.location.outletName}</Popup></CircleMarker>)}
    </MapContainer>
  </section>;
}
