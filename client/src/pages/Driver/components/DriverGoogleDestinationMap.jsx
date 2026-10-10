import React,{useEffect,useRef,useState} from 'react';
import {useFeaturePolicy} from '../../../shared/hooks/useFeaturePolicy';
import {loadGoogleMapsScript} from '../../../services/googleMapsLoader';
export function DriverGoogleDestinationMap({stops,selectedId,onSelect}){
 const {settings}=useFeaturePolicy('MAPS'),ref=useRef(null),[error,setError]=useState('');
 const key=settings.MAPS_BROWSER_API_KEY||import.meta.env.VITE_GOOGLE_MAPS_API_KEY||'';
 useEffect(()=>{let active=true,markers=[];if(!key)return;loadGoogleMapsScript(key).then(maps=>{if(!active||!ref.current)return;const map=new maps.Map(ref.current,{center:{lat:stops[0].outlet.latitude,lng:stops[0].outlet.longitude},zoom:13,mapTypeControl:false,streetViewControl:false}),bounds=new maps.LatLngBounds();markers=stops.map((s,i)=>{const position={lat:s.outlet.latitude,lng:s.outlet.longitude};bounds.extend(position);const marker=new maps.Marker({map,position,label:String(i+1),title:s.outlet.name});marker.addListener('click',()=>onSelect(s.id));return marker;});if(stops.length>1)map.fitBounds(bounds,40);const selected=stops.find(s=>s.id===selectedId);if(selected)map.panTo({lat:selected.outlet.latitude,lng:selected.outlet.longitude});}).catch(()=>{if(active)setError('Peta Google belum dapat dimuat. Gunakan tombol navigasi tujuan.');});return()=>{active=false;markers.forEach(m=>m.setMap(null));};},[key,stops,selectedId,onSelect]);
 if(!key||error)return <p role="status" className="app-notice">{error||'Tujuan memakai lokasi Google. Kunci peta browser belum tersedia; gunakan tombol navigasi Google Maps.'}</p>;
 return <div ref={ref} className="logistics-destination-map" style={{minHeight:280}} role="img" aria-label="Peta tujuan pengiriman Google"/>;
}
