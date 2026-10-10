import React,{useEffect,useRef,useState} from 'react';
import {useFeaturePolicy} from '../../../shared/hooks/useFeaturePolicy';
import {loadGoogleMapsScript} from '../../../services/googleMapsLoader';
import {knownPoint} from '../../../../../shared/outlet-validation.mjs';
import {outletComparisonPoints,mountOutletComparisonMap} from './outletComparisonMap';
export function GoogleOutletMap({outlet,candidate,recommended=candidate,fieldPoints=[],approved=false}){
 const policy=useFeaturePolicy('MAPS'),ref=useRef(null),controls=useRef(null),[error,setError]=useState(''),[loading,setLoading]=useState(true),[retry,setRetry]=useState(0);
 const key=policy.settings.MAPS_BROWSER_API_KEY||import.meta.env.VITE_GOOGLE_MAPS_API_KEY||'';
 const mapId=policy.settings.MAPS_MAP_ID||'DEMO_MAP_ID';
 const pointSignature=JSON.stringify(outletComparisonPoints({previous:outlet?.nativeLocation||outlet,recommended,candidate,fieldPoints}));
 const points=JSON.parse(pointSignature);
 useEffect(()=>{
  let active=true,controller;
  const currentPoints=JSON.parse(pointSignature);
  if(!policy.canStart||!key||!currentPoints.length)return;
  const onAuthFailure=()=>{if(active){setError('Google menolak kunci browser. Periksa Maps JavaScript API, billing, dan pembatasan domain pada konfigurasi kunci.');setLoading(false);}};
  window.addEventListener('google-maps-auth-failure',onAuthFailure);
  setError('');setLoading(true);loadGoogleMapsScript(key).then(async maps=>{
   if(!active||!ref.current)return;
   controller=await mountOutletComparisonMap(maps,ref.current,currentPoints,{mapId,isActive:()=>active});
   if(!active){controller.destroy();return;}controls.current=controller;setLoading(false);
  }).catch(()=>{if(active){setError('Peta Google belum dapat dimuat. Periksa koneksi serta kunci browser/Maps JavaScript API, lalu coba lagi.');setLoading(false);}});
  return()=>{active=false;controller?.destroy();controls.current=null;window.removeEventListener('google-maps-auth-failure',onAuthFailure);};
 },[pointSignature,key,mapId,policy.canStart,retry]);
 if(!policy.canStart)return <p className="ov-muted">{policy.reason}</p>;
 if(!key)return <p className="ov-notice">Peta perbandingan memerlukan kunci browser di Parameter → Integrasi &amp; keamanan → Integrasi Peta. Aktifkan Maps JavaScript API untuk kunci tersebut. Koordinat dan tautan Google Maps tetap tersedia.</p>;
 if(!points.length)return <p className="ov-notice">Belum ada titik yang dapat dipetakan. Jalankan pemeriksaan Google untuk mencari kandidat.</p>;
 return <div className="ov-map-comparison"><div className="ov-map-tools"><button type="button" className="app-button" disabled={loading||!!error} onClick={()=>controls.current?.fit()}>Tampilkan semua titik</button>{points.filter(p=>p.kind!=='field').map(p=><button type="button" className="app-button" key={p.key} disabled={loading||!!error} onClick={()=>controls.current?.focus(p.key)}>Fokus {p.label}</button>)}</div><div ref={ref} className="ov-google-map" role="region" aria-label="Peta perbandingan titik master sebelumnya, rekomendasi Google dan bukti lapangan" aria-busy={loading}/>{loading&&<p role="status">Memuat peta perbandingan…</p>}<p className="ov-map-legend"><span>M: titik sebelumnya</span><span>G: {approved?'lokasi Google disetujui':'rekomendasi Google terkuat'}</span><span>P: kandidat lain yang ditinjau</span><span>L: GPS lapangan</span></p>{!knownPoint(outlet?.nativeLocation||outlet)&&<p className="ov-muted">Koordinat sebelumnya kosong; tidak ada penanda M.</p>}<p className="ov-muted">Penanda pada koordinat yang sama digabung. Garis penghubung menunjukkan perbedaan titik, bukan rute jalan.</p>{error&&<div role="status"><p className="app-error">{error}</p><button type="button" className="app-button" onClick={()=>setRetry(n=>n+1)}>Coba muat peta lagi</button></div>}</div>;
}
