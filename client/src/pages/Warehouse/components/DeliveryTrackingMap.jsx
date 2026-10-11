import {validOutletPoint,stopDestinationOutlet} from '../../../../../shared/driver-workspace.mjs';
import {useFeaturePolicy} from '../../../shared/hooks/useFeaturePolicy';
import React from 'react';
import {MapContainer,TileLayer,CircleMarker,Popup} from 'react-leaflet';
import {DeliveryMapFit} from './DeliveryMapFit';
import 'leaflet/dist/leaflet.css';
const stamp=value=>new Date(value).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'});
export function DeliveryTrackingMap({routes,issues=[],selectedId,onSelect}){
 const mapPolicy=useFeaturePolicy('MAPS');
  const routePoints=route=>[...(validOutletPoint(route.location)?[[route.location.latitude,route.location.longitude]]:[]),...route.stops.flatMap(stop=>{const outlet=stopDestinationOutlet(stop);return validOutletPoint(outlet)?[[outlet.latitude,outlet.longitude]]:[];}),...route.stops.flatMap(s=>(s.attendances||[]).filter(validOutletPoint).map(a=>[a.latitude,a.longitude]))];
  const points=routes.flatMap(routePoints);
  const focusPoints=routePoints(routes.find(item=>item.id===selectedId)||{stops:[]});
  if(!mapPolicy.canStart)return <p className="app-notice" role="status">{mapPolicy.reason} Status pengiriman dan bukti presensi tetap tersedia pada daftar.</p>;
  if(!points.length)return <p className="p-4 border rounded-xl">Titik tujuan dan posisi kendaraan belum tersedia. Periksa koordinat outlet pada rencana trip.</p>;
  return <section className="space-y-2"><p className="text-sm">Hijau: toko tujuan · Biru: GPS kendaraan terkini · Jingga: posisi terakhir · Abu-abu: absensi · Merah: selisih titik perlu diperiksa. Titik toko tidak dianggap sebagai posisi kendaraan.</p>
    <MapContainer center={points[0]} zoom={11} style={{height:360,width:'100%',zIndex:0}} aria-label="Peta posisi truk dan absensi">
      <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/><DeliveryMapFit points={focusPoints.length?focusPoints:points}/>
      {routes.flatMap(r=>r.stops.map(s=>{const point=stopDestinationOutlet(s);return validOutletPoint(point)?<CircleMarker key={`target:${s.id}`} center={[point.latitude,point.longitude]} radius={r.id===selectedId?9:7} eventHandlers={{click:()=>onSelect?.(r.id)}} pathOptions={{color:'#15803d',fillColor:'#22c55e',fillOpacity:.75}}><Popup><strong>{r.code} · Tujuan {s.sequence}: {s.outlet?.name}</strong><br/>{point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}<br/><a href={`https://www.google.com/maps/search/?api=1&query=${point.latitude},${point.longitude}`} target="_blank" rel="noopener noreferrer">Buka Google Maps</a></Popup></CircleMarker>:null;}))}
      {routes.flatMap(r=>r.stops.flatMap(s=>(s.attendances||[]).filter(validOutletPoint).map(a=>{const issue=issues.find(item=>item.stopId===s.id&&(item.history||[]).some(entry=>entry.action==='LOCATION_DISCREPANCY'&&entry.attendanceId===a.id));const evidence=issue?.history?.find(entry=>entry.action==='LOCATION_DISCREPANCY');return <CircleMarker key={a.id} center={[a.latitude,a.longitude]} radius={issue?8:5} pathOptions={{color:issue?'#dc2626':'#64748b',fillColor:issue?'#ef4444':'#94a3b8'}}><Popup><strong>{r.code} · {s.outlet?.name}</strong><br/>Absensi {a.type} · {stamp(a.timestamp)}{issue&&<><br/><strong>Periksa selisih lokasi: {Math.round(evidence.distanceMeters)} m</strong><br/>Titik toko dan GPS perlu dibandingkan di tindak lanjut trip.</>}</Popup></CircleMarker>;})))}
      {routes.map(r=>validOutletPoint(r.location)&&<CircleMarker key={r.id} center={[r.location.latitude,r.location.longitude]} radius={r.id===selectedId?12:8} eventHandlers={{click:()=>onSelect?.(r.id)}} pathOptions={{weight:r.id===selectedId?4:2,color:r.location.isLive?'#2563eb':r.location.source==='GPS'?'#b45309':'#64748b',fillOpacity:.8}}><Popup><strong>{r.vehicle?.code} · {r.driver?.name}</strong><br/>{r.location.isLive?'GPS terkini':r.location.source==='GPS'?'GPS terakhir':'Absensi terakhir'}<br/>{stamp(r.location.observedAt)}<br/>{r.location.accuracy!=null?`Akurasi ±${Math.round(r.location.accuracy)} m`:r.location.outletName}</Popup></CircleMarker>)}
    </MapContainer>
  </section>;
}
