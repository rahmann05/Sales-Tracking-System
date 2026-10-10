import React,{useEffect,useRef,useState} from 'react';
import {useFeaturePolicy} from '../../../shared/hooks/useFeaturePolicy';
import {loadGoogleMapsScript} from '../../../services/googleMapsLoader';
import {knownPoint} from '../../../../../shared/outlet-validation.mjs';
export function GoogleOutletMap({outlet,candidate,fieldPoints=[]}){
 const policy=useFeaturePolicy('MAPS'),ref=useRef(null),[error,setError]=useState('');
 const key=policy.settings.MAPS_BROWSER_API_KEY||import.meta.env.VITE_GOOGLE_MAPS_API_KEY||'';
 useEffect(()=>{
  let active=true,markers=[];
  if(!policy.canStart||!key||!knownPoint(candidate))return;
  setError('');loadGoogleMapsScript(key).then(maps=>{
   if(!active||!ref.current)return;
   const map=new maps.Map(ref.current,{center:{lat:candidate.latitude,lng:candidate.longitude},zoom:15,streetViewControl:false,mapTypeControl:false}),bounds=new maps.LatLngBounds();
   const points=[{...outlet,label:'M',title:'Master internal'}, {...candidate,label:'G',title:'Kandidat Google'},...fieldPoints.filter(knownPoint).map(p=>({...p,label:'L',title:'Bukti lapangan'}))].filter(knownPoint);
   markers=points.map(p=>{const position={lat:p.latitude,lng:p.longitude};bounds.extend(position);return new maps.Marker({map,position,label:p.label,title:p.title});});
   if(points.length>1)map.fitBounds(bounds,45);
  }).catch(()=>{if(active)setError('Peta Google belum dapat dimuat. Gunakan tautan kandidat di bawah.');});
  return()=>{active=false;markers.forEach(m=>m.setMap(null));};
 },[outlet,candidate,fieldPoints,key,policy.canStart]);
 if(!policy.canStart)return <p className="ov-muted">{policy.reason}</p>;
 if(!key)return <p className="ov-muted">Pratinjau memerlukan kunci Google Maps browser. Kandidat tetap dapat dibuka melalui tautan Google Maps.</p>;
 return <><div ref={ref} className="ov-google-map" role="img" aria-label="Perbandingan titik master, kandidat Google dan bukti lapangan"/><p className="ov-muted">M: master internal · G: kandidat Google · L: bukti lapangan. Titik yang belum tersedia tidak ditampilkan.</p>{error&&<p role="status" className="ov-muted">{error}</p>}</>;
}
