import React from 'react';
import {SalesMapFocus} from './SalesMapFocus';
import {MapContainer,TileLayer,CircleMarker,Tooltip,Polyline} from 'react-leaflet';
import {locationPresentation,locationTime} from '../locationPresentation';
export function SalesPositionMap({rows,selectedId,onSelect,timeoutMinutes}){
  const positions=rows.filter(row=>locationPresentation(row,Date.now(),timeoutMinutes).hasPosition);
  const selected=positions.find(row=>row.salesId===selectedId);
  const trail=selected?.locationSource==='LIVE_GPS_PING'?(selected.breadcrumbs||[]).filter(p=>p.lat!=null&&p.lng!=null&&Number.isFinite(Number(p.lat))&&Number.isFinite(Number(p.lng))):[];
  return <div className="spv-map-panel"><MapContainer center={[-6.884984,107.489953]} zoom={11} style={{height:'100%',width:'100%'}}><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/><SalesMapFocus rows={positions} selectedId={selectedId}/>{positions.map(row=>{const state=locationPresentation(row,Date.now(),timeoutMinutes);return <CircleMarker key={row.salesId} center={[Number(row.latitude),Number(row.longitude)]} radius={row.salesId===selectedId?12:8} pathOptions={{color:state.tone==='live'?'#0869cf':state.tone==='stale'?'#a56b13':'#68788c',fillOpacity:.8}} eventHandlers={{click:()=>onSelect(row.salesId)}}><Tooltip>{row.salesName}<br/>{state.label}<br/>{locationTime(row.lastUpdated)}</Tooltip></CircleMarker>;})}{trail.length>1&&<Polyline positions={trail.map(p=>[Number(p.lat),Number(p.lng)])} pathOptions={{color:'#0869cf',dashArray:'5 7'}}/>}</MapContainer>{!positions.length&&<p className="spv-map-empty">Belum ada titik lokasi aktual untuk ditampilkan.</p>}</div>;
}
