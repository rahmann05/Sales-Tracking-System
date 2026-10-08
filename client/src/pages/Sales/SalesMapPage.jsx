import React,{useEffect,useMemo} from 'react';
import {useApp} from '../../context/AppContext';
import {useMap} from '../../context/MapContext';
import {useWorkspaceState} from '../../shared/hooks/useWorkspaceState';
import {TAB_IDS} from '../../constants/navigation';
import {visitStatusLabel} from './salesPresentation';
export function SalesMapPage(){
  const {salesStops,syncStatus,setActiveTab}=useApp();
  const {setMapMode,setMarkers,clearMarkers,clearPolylines,clearPolygons,panTo,fitBounds,isMapReady,useFallback}=useMap();
  const [query,setQuery]=useWorkspaceState('salesMapSearch',''),[selectedId,setSelectedId]=useWorkspaceState('salesMapOutlet','');
  const stops=useMemo(()=>[...salesStops].sort((a,b)=>a.sequence-b.sequence),[salesStops]);
  const valid=useMemo(()=>stops.filter(s=>s.latitude!=null&&s.longitude!=null&&Number.isFinite(Number(s.latitude))&&Number.isFinite(Number(s.longitude))&&Math.abs(Number(s.latitude))<=90&&Math.abs(Number(s.longitude))<=180),[stops]);
  const selected=valid.find(s=>s.id===selectedId),filtered=stops.filter(s=>`${s.outletName} ${s.outletCode} ${s.address}`.toLowerCase().includes(query.trim().toLowerCase()));
  useEffect(()=>{setMapMode('dashboard');return()=>{setMapMode('hidden');clearMarkers();clearPolylines();clearPolygons();};},[setMapMode,clearMarkers,clearPolylines,clearPolygons]);
  useEffect(()=>{setMarkers(valid.map(s=>({id:s.id,lat:Number(s.latitude),lng:Number(s.longitude),title:`${s.sequence}. ${s.outletName}`,label:String(s.sequence),onClick:()=>setSelectedId(s.id)})));},[valid,setMarkers,setSelectedId,isMapReady]);
  useEffect(()=>{if(selected)panTo(Number(selected.latitude),Number(selected.longitude),16);else if(valid.length)fitBounds(valid.map(s=>({lat:Number(s.latitude),lng:Number(s.longitude)})));},[selected,valid,isMapReady,panTo,fitBounds]);
  return <div className="sales-map-workspace">
    <header className="sales-panel sales-map-heading"><div><p className="admin-eyebrow">Sales / Wilayah kunjungan</p><h1>Peta outlet</h1><p className="sales-note">Titik outlet dari PJP hari ini. Posisi outlet bukan lokasi langsung Sales.</p></div><button className="app-button" onClick={()=>setActiveTab(TAB_IDS.SALES_VISITS)}>Buka kunjungan</button></header>
    <section className="sales-panel sales-map-list" aria-label="Outlet pada peta"><div className="sales-toolbar"><label>Cari outlet<input type="search" value={query} onChange={e=>setQuery(e.target.value,{replace:true})} placeholder="Nama, kode, atau alamat…"/></label></div>
      {!syncStatus?.lastSuccessAt&&!syncStatus?.error&&<p role="status" className="sales-empty">Memuat outlet…</p>}{syncStatus?.error&&<p role="alert" className="app-error">Data belum diperbarui: {syncStatus.error}</p>}
      <div className="sales-map-rows">{filtered.map(s=><button className="sales-map-row" key={s.id} aria-pressed={s.id===selectedId} disabled={!valid.some(v=>v.id===s.id)} onClick={()=>setSelectedId(s.id)}><strong>{s.sequence}. {s.outletName}</strong><span>{s.address||'Alamat belum tersedia'}</span><small>{visitStatusLabel(s.status)}{!valid.some(v=>v.id===s.id)?' · Koordinat belum tersedia':''}</small></button>)}{syncStatus?.lastSuccessAt&&!filtered.length&&<p className="sales-empty">Tidak ada outlet untuk ditampilkan.</p>}</div>
      <p className="sales-map-caption">{valid.length} dari {stops.length} outlet memiliki koordinat.{useFallback?' Peta alternatif OpenStreetMap aktif.':''}</p>
    </section>
    {selected&&<section className="sales-panel sales-map-selection"><strong>{selected.outletName}</strong><p className="sales-note">{selected.address}</p><a className="app-button" href={`https://www.google.com/maps/search/?api=1&query=${selected.latitude},${selected.longitude}`} target="_blank" rel="noopener noreferrer">Buka petunjuk lokasi</a></section>}
  </div>;
}
