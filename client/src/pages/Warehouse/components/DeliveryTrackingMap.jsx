import React,{useEffect} from 'react';
import {MapContainer,TileLayer,CircleMarker,Popup,useMap} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
const stamp=value=>new Date(value).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'});
function Fit({points}){const map=useMap();useEffect(()=>{if(points.length)map.fitBounds(points,{padding:[30,30],maxZoom:14});},[map,points]);return null;}
export function DeliveryTrackingMap({routes}){
  const points=React.useMemo(()=>routes.flatMap(r=>[...(r.location?[[r.location.latitude,r.location.longitude]]:[]),...r.stops.flatMap(s=>(s.attendances||[]).map(a=>[a.latitude,a.longitude]))]),[routes]);
  if(!points.length)return <p className="p-4 border rounded-xl">Belum ada posisi GPS atau titik absensi. Posisi truk tidak diasumsikan dari alamat toko.</p>;
  return <section className="space-y-2"><p className="text-sm">Posisi truk menggunakan ponsel driver. Biru: GPS terkini · Jingga: posisi terakhir · Abu-abu: titik absensi. Ketuk titik untuk waktu dan sumbernya.</p>
    <MapContainer center={points[0]} zoom={11} style={{height:360,width:'100%',zIndex:0}} aria-label="Peta posisi truk dan absensi">
      <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/><Fit points={points}/>
      {routes.flatMap(r=>r.stops.flatMap(s=>(s.attendances||[]).map(a=><CircleMarker key={a.id} center={[a.latitude,a.longitude]} radius={5} pathOptions={{color:'#64748b'}}><Popup><strong>{r.code} · {s.outlet?.name}</strong><br/>Absensi {a.type} · {stamp(a.timestamp)}</Popup></CircleMarker>)))}
      {routes.map(r=>r.location&&<CircleMarker key={r.id} center={[r.location.latitude,r.location.longitude]} radius={11} pathOptions={{color:r.location.isLive?'#2563eb':'#b45309',fillOpacity:.8}}><Popup><strong>{r.vehicle?.code} · {r.driver?.name}</strong><br/>{r.location.isLive?'GPS terkini':r.location.source==='GPS'?'GPS terakhir':'Absensi terakhir'}<br/>{stamp(r.location.observedAt)}<br/>{r.location.accuracy!=null?`Akurasi ±${Math.round(r.location.accuracy)} m`:r.location.outletName}</Popup></CircleMarker>)}
    </MapContainer>
  </section>;
}
