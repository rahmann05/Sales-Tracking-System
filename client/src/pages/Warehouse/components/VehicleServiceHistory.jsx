import React,{useEffect,useState} from 'react';
import {vehiclesApi} from '../../../services/api';
import {serviceRecordLabel} from '../../../../../shared/reference-catalog.mjs';
import {googleMapsPointUrl} from '../../../../../shared/google-maps-point.mjs';

export function VehicleServiceHistory({vehicle}){
 const [rows,setRows]=useState([]),[error,setError]=useState(''),[loading,setLoading]=useState(true),[receipts,setReceipts]=useState({}),[receiptLoading,setReceiptLoading]=useState('');
 useEffect(()=>{let active=true;setLoading(true);setError('');vehiclesApi.getById(vehicle.id).then(res=>{if(active)setRows(res.data?.serviceRecords||[]);}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[vehicle.id,vehicle.updatedAt]);
 const toggleReceipt=async(row)=>{
  if(receipts[row.id]){setReceipts(prev=>{const next={...prev};delete next[row.id];return next;});return;}
  if(row.receiptPhotoUrl){setReceipts(prev=>({...prev,[row.id]:row.receiptPhotoUrl}));return;}
  setReceiptLoading(row.id);
  try{
   const res=await vehiclesApi.getServiceReceipt(vehicle.id,row.id);
   if(res.data?.receiptPhotoUrl)setReceipts(prev=>({...prev,[row.id]:res.data.receiptPhotoUrl}));
  }catch(e){setError(e.message);}finally{setReceiptLoading('');}
 };
 return <section className="admin-panel logistics-action-panel vehicle-service-history"><h2 className="font-semibold">Riwayat servis</h2><p className="admin-footnote">Menampilkan hingga 50 catatan terbaru berdasarkan tanggal servis.</p>{error&&<p className="app-error" role="alert">{error}</p>}{loading?<p className="admin-footnote">Memuat catatan servis…</p>:!rows.length?<p className="admin-footnote">Belum ada catatan servis. Kilometer komponen pada data lama belum tentu merupakan bukti servis.</p>:<ol className="divide-y divide-border-glass">{rows.map(row=>{
  const hasCoords=Number.isFinite(row.workshopLatitude)&&Number.isFinite(row.workshopLongitude);
  const mapsUrl=row.evidence?.mapsUrl||(hasCoords?googleMapsPointUrl(row.workshopLatitude,row.workshopLongitude):null);
  const sourceLabel=row.evidence?.source==='GOOGLE_MAPS'?'Input Admin · Titik Google Maps':row.evidence?.source==='DEVICE_GPS'?`Absen GPS · ${row.evidence?.actorName||row.evidence?.actorRole||'Petugas'}`:null;
  return <li key={row.id} className="py-4 space-y-1.5">
   <div className="flex flex-wrap items-center justify-between gap-2">
    <strong>{serviceRecordLabel(row)}</strong>
    {sourceLabel&&<span className="admin-status">{sourceLabel}</span>}
   </div>
   <p>{new Date(row.serviceDate).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})} WIB · {Number(row.odometerAtService||0).toLocaleString('id-ID')} km</p>
   <p className="admin-footnote">Bengkel: {row.workshopName||'Belum tercatat'} · Biaya tercatat: Rp {Number(row.cost||0).toLocaleString('id-ID')}</p>
   {hasCoords&&<p className="admin-footnote">Titik servis: {Number(row.workshopLatitude).toFixed(6)}, {Number(row.workshopLongitude).toFixed(6)}{mapsUrl&&<> · <a href={mapsUrl} target="_blank" rel="noreferrer" className="underline font-semibold">Buka Google Maps</a></>}</p>}
   {row.notes&&<p>{row.notes}</p>}
   <div className="flex flex-wrap items-center gap-3 pt-1">
    {(row.hasReceipt||row.receiptPhotoUrl)&&<button type="button" disabled={receiptLoading===row.id} onClick={()=>toggleReceipt(row)} className="admin-button text-xs py-1 px-2.5">{receiptLoading===row.id?'Memuat struk…':receipts[row.id]?'Sembunyikan struk':'Lihat foto struk'}</button>}
    {row.createdAt&&<small className="admin-footnote">Dicatat {new Date(row.createdAt).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})} WIB</small>}
   </div>
   {receipts[row.id]&&<img src={receipts[row.id]} alt={`Struk servis ${serviceRecordLabel(row)}`} className="mt-2 max-h-64 rounded-xl border border-border-glass object-contain bg-surface-variant p-1"/>}
  </li>;
 })}</ol>}</section>;
}

