import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { reportsApi } from '../../../services/api';
import { mtdCsv, weeklyCsv } from '../../../../../shared/report-semantics.mjs';
import { targetPeriodError } from '../../../../../shared/sales-targets.mjs';
import { MtdReportPdfView } from './MtdReportPdfView';
import { WeeklyReportPdfView } from './WeeklyReportPdfView';

const timestamp=value=>new Date(value).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'});
function download(content,type,name){const url=URL.createObjectURL(new Blob([content],{type}));const link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function ReportArchivePanel({kind,period}){
  const {user}=useApp();const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const [items,setItems]=useState([]),[cursor,setCursor]=useState(null),[reason,setReason]=useState(''),[selected,setSelected]=useState(null),[print,setPrint]=useState(false);
  const pending=useRef(null),revision=useRef(0);
  const allowed=user?.role==='ADMIN'&&user.permissions?.can_view_reports!==false;
  useEffect(()=>{
    const version=++revision.current;pending.current=null;setSelected(null);setPrint(false);setReason('');setError('');
    if(!open||!allowed||targetPeriodError(kind,period))return;
    setBusy(true);setItems([]);setCursor(null);
    reportsApi.listArchives({kind,period}).then(res=>{if(version===revision.current){setItems(res.data.items);setCursor(res.data.nextCursor);}})
      .catch(err=>{if(version===revision.current)setError(err.message);}).finally(()=>{if(version===revision.current)setBusy(false);});
    return()=>{revision.current++;};
  },[open,allowed,kind,period]);
  if(!allowed||targetPeriodError(kind,period))return null;
  const save=async event=>{
    event.preventDefault();if(!pending.current&&reason.trim().length<5){setError('Alasan harus berisi setidaknya 5 karakter selain spasi.');return;}
    const version=revision.current;setBusy(true);setError('');
    const payload=pending.current||{kind,period,reason:reason.trim(),requestId:crypto.randomUUID()};pending.current=payload;
    try{const res=await reportsApi.createArchive(payload);if(version!==revision.current)return;
      pending.current=null;setSelected(res.data);setReason('');const list=await reportsApi.listArchives({kind,period});
      if(version===revision.current){setItems(list.data.items);setCursor(list.data.nextCursor);}
    }catch(err){if(version===revision.current)setError(`${err.message} Jika koneksi terputus, coba lagi untuk mengambil arsip dari permintaan yang sama.`);}
    finally{if(version===revision.current)setBusy(false);}
  };
  const view=async id=>{const version=revision.current;setBusy(true);setError('');setSelected(null);setPrint(false);
    try{const res=await reportsApi.getArchive(id);if(version===revision.current)setSelected(res.data);}
    catch(err){if(version===revision.current)setError(err.message);}finally{if(version===revision.current)setBusy(false);}};
  const more=async()=>{const version=revision.current;setBusy(true);setError('');
    try{const res=await reportsApi.listArchives({kind,period,cursor});if(version===revision.current){setItems(rows=>[...rows,...res.data.items]);setCursor(res.data.nextCursor);}}
    catch(err){if(version===revision.current)setError(err.message);}finally{if(version===revision.current)setBusy(false);}};
  const file=selected?`arsip-${selected.kind}-${selected.period}-${selected.id}`:'';
  return <>
    <button type="button" className="app-button text-xs" onClick={()=>setOpen(true)}>Arsip perusahaan {period}</button>
    {open&&<div className="fixed inset-0 z-50 bg-black/60 p-4 flex items-center justify-center" role="dialog" aria-modal="true" aria-label={`Arsip laporan ${period}`}>
      <div className="bg-surface rounded-xl p-5 w-full max-w-3xl max-h-[90vh] overflow-y-auto space-y-3">
        <h3 className="font-bold">Arsip laporan perusahaan · {period}</h3>
        <p className="text-sm">Arsip mengambil laporan terbaru seluruh sales dari server, tanpa filter sales atau pencarian di layar. Isinya tidak dapat ditimpa. Ini bukan penutupan transaksi; periode berjalan tetap dapat berubah.</p>
        {error&&<p role="alert" className="app-error">{error}</p>}
        {busy&&<p role="status">Memproses arsip…</p>}
        <form onSubmit={save} className="space-y-2">
          <label className="block">Alasan penyimpanan / koreksi arsip sebelumnya<textarea required minLength={5} maxLength={1000} className="app-input w-full" value={reason} disabled={busy||!!pending.current} onChange={event=>setReason(event.target.value)}/></label>
          <button className="app-button" type="submit" disabled={busy}>{pending.current?'Coba lagi permintaan arsip':'Simpan arsip baru seluruh perusahaan'}</button>
        </form>
        <p className="text-xs">Koreksi disimpan sebagai arsip baru dengan alasan; arsip sebelumnya tetap tersedia.</p>
        <ul className="space-y-2">{items.map(item=><li key={item.id} className="border-b py-2 text-sm"><button type="button" className="app-button" disabled={busy} onClick={()=>view(item.id)}>Buka</button> {timestamp(item.createdAt)} WIB · {item.createdByName||'Admin'} · {item.reason}</li>)}</ul>
        {!items.length&&!busy&&<p>Belum ada arsip yang dimuat untuk periode ini.</p>}
        {cursor&&<button type="button" className="app-button" disabled={busy} onClick={more}>Muat arsip lebih lama</button>}
        {selected&&<section className="border rounded p-3 space-y-2">
          <h4 className="font-bold">Arsip tersimpan {selected.id}</h4>
          <p className="text-xs">{timestamp(selected.createdAt)} WIB · {selected.createdByName||'Admin'} · {selected.reason}</p>
          <p>Sales: {selected.report.salesmen?.length||0} · Nilai order: Rp {Number(selected.report.summary?.mtdActualAmount??selected.report.summary?.totalOrderAmount??0).toLocaleString('id-ID')}</p>
          <p className="text-xs break-all">SHA-256 isi laporan: {selected.digest}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="app-button" onClick={()=>download(JSON.stringify(selected,null,2),'application/json',`${file}.json`)}>Unduh arsip lengkap JSON</button>
            <button type="button" className="app-button" onClick={()=>download('\uFEFF'+(kind==='MONTH'?mtdCsv(selected.report):weeklyCsv(selected.report)),'text/csv;charset=utf-8',`${file}.csv`)}>Unduh CSV arsip</button>
            <button type="button" className="app-button" onClick={()=>setPrint(value=>!value)}>{print?'Tutup pratinjau':'Pratinjau / cetak arsip'}</button>
          </div>
          {print&&(kind==='MONTH'?<MtdReportPdfView reportData={selected.report} salesmanName="Seluruh perusahaan · arsip" onClose={()=>setPrint(false)}/>:<WeeklyReportPdfView reportData={selected.report} salesmanName="Seluruh perusahaan · arsip" onClose={()=>setPrint(false)}/>)}
        </section>}
        <button type="button" className="app-button" disabled={busy} onClick={()=>setOpen(false)}>Tutup</button>
      </div>
    </div>}
  </>;
}
