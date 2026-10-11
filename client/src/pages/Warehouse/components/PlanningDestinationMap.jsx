import React from 'react';
import {MapContainer,TileLayer,CircleMarker,Popup} from 'react-leaflet';
import {DeliveryMapFit} from './DeliveryMapFit';
import {useFeaturePolicy} from '../../../shared/hooks/useFeaturePolicy';
import 'leaflet/dist/leaflet.css';
export function PlanningDestinationMap({entries,departure,returnPoint}){
 const policy=useFeaturePolicy('MAPS');
 const points=[{...departure,name:`Berangkat: ${departure?.name}`},...entries.map((entry,index)=>({...entry.point,name:`${index+1}. ${entry.outletName}`})),{...returnPoint,name:`Kembali: ${returnPoint?.name}`}].filter(point=>Number.isFinite(point.latitude)&&Number.isFinite(point.longitude));
 if(!policy.canStart)return <p role="status">{policy.reason}</p>;
 if(!points.length)return null;
 return <section className="space-y-2"><h3 className="font-semibold">Titik perjalanan</h3><p className="admin-footnote">Peta menunjukkan lokasi. Jarak mengikuti rute jalan dan dihitung saat rencana disimpan; tidak menggunakan garis lurus.</p><MapContainer center={[points[0].latitude,points[0].longitude]} zoom={12} style={{height:300,width:'100%',zIndex:0}}><TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/><DeliveryMapFit points={points.map(point=>[point.latitude,point.longitude])}/>{points.map((point,index)=><CircleMarker key={`${index}:${point.latitude}`} center={[point.latitude,point.longitude]} radius={8} pathOptions={{color:index===0||index===points.length-1?'#87530b':'#0066cc',fillOpacity:.8}}><Popup>{point.name}<br/><a href={`https://www.google.com/maps/search/?api=1&query=${point.latitude},${point.longitude}`} target="_blank" rel="noopener noreferrer">Buka Google Maps</a></Popup></CircleMarker>)}</MapContainer></section>;
}
