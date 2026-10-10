import React,{useState,useRef} from 'react';
import {GuardedDialog} from '../../../../shared/components/common/GuardedDialog';
import {clustersApi} from '../../../../services/api';
import {parseSpreadsheetCsv,readSpreadsheetRecords,spreadsheetFields,generateCsvTemplateContent} from '../../../../services/spreadsheetImportService';
import {SpreadsheetPreviewTable} from './SpreadsheetPreviewTable';

const actions={UPSERT:'Tambah baru dan perbarui',CREATE_ONLY:'Hanya tambah baru',UPDATE_ONLY:'Hanya perbarui',SKIP:'Lewati'};
const labels={ClusterCode:'Kode cluster (opsional)',ClusterName:'Nama cluster',OutletCode:'Kode outlet',CustomerName:'Nama outlet',Address:'Alamat',Area:'Wilayah',Lat:'Latitude',Lng:'Longitude',Frequency:'Interval F1/F2/F4 (opsional)'};
export function SpreadsheetImportModal({isOpen,onClose,onImportSuccess}){
 const [text,setText]=useState(''),[rows,setRows]=useState([]),[headers,setHeaders]=useState([]),[mapping,setMapping]=useState({}),[mode,setMode]=useState('UPSERT');
 const [error,setError]=useState(''),[busy,setBusy]=useState(false),[review,setReview]=useState(null),[name,setName]=useState('');
 const flight=useRef(false),readVersion=useRef(0);
 const close=()=>{readVersion.current++;setText('');setRows([]);setHeaders([]);setMapping({});setMode('UPSERT');setError('');setReview(null);setName('');onClose();};
 const read=async e=>{
  const file=e.target.files?.[0];if(!file)return;
  const version=++readVersion.current;setBusy(true);setReview(null);setRows([]);setText('');setHeaders([]);setError('');
  try{
   if(file.size>3*1024*1024)throw new Error('CSV maksimal 3 MB.');
   const content=await file.text();if(version!==readVersion.current)return;
   const parsed=readSpreadsheetRecords(content);
   if(!parsed.records?.length)throw new Error('CSV tidak berisi data');
   if(parsed.records.length>1000)throw new Error('Maksimal 1.000 baris per impor.');
   setHeaders(parsed.headers);setMapping(Object.fromEntries(spreadsheetFields.map(f=>[f,parsed.headers.includes(f)?f:''])));setText(content);setName(file.name);
  }catch(err){if(version===readVersion.current)setError(err.message);}finally{if(version===readVersion.current)setBusy(false);}
 };
 const invalidate=()=>{setReview(null);setRows([]);setError('');};
 const download=()=>{const url=URL.createObjectURL(new Blob([generateCsvTemplateContent()],{type:'text/csv;charset=utf-8'})),link=document.createElement('a');link.href=url;link.download='Template_Wilayah_Outlet.csv';link.click();URL.revokeObjectURL(url);};
 const submit=async()=>{
  if(flight.current)return;flight.current=true;setBusy(true);setError('');
  try{
   if(!review){const parsed=parseSpreadsheetCsv(text,mapping).map(r=>({...r,importAction:mode}));setRows(parsed);setReview((await clustersApi.previewImport(parsed)).data);return;}
   await onImportSuccess(rows,review.token);close();
  }catch(e){setReview(null);setError(e.message);}finally{flight.current=false;setBusy(false);}
 };
 return <GuardedDialog className="planning-dialog" open={isOpen} title="Impor wilayah dan outlet" onClose={close} busy={busy} dirty={!!text} closeDescription="File dan pratinjau yang belum diterapkan akan dilepas. Data operasional belum berubah.">
  <div className="app-form">
   <p>Unggah CSV, cocokkan kolom, lalu tinjau perubahan sebelum menerapkannya. Jadwal kunjungan tetap diterbitkan melalui Planner.</p>
   <button type="button" className="app-button" onClick={download} disabled={busy}>Unduh template CSV</button>
   <label className="app-field">File CSV<input type="file" accept=".csv,text/csv" disabled={busy} onChange={read}/></label>
   {text&&<section className="app-form"><h3>Pemetaan kolom · {name}</h3><p>Pilih kolom sumber untuk setiap field. Gunakan kode cluster bila nama cluster tidak unik. F1/F2/F4 berarti interval setiap 1/2/4 minggu.</p>
    {spreadsheetFields.map(f=><label key={f} className="app-field">{labels[f]}<select value={mapping[f]||''} disabled={busy} onChange={e=>{setMapping(m=>({...m,[f]:e.target.value}));invalidate();}}><option value="">Pilih kolom / tidak digunakan</option>{headers.map(h=><option key={h} value={h}>{h}</option>)}</select></label>)}
    <label className="app-field">Perlakuan kode outlet<select value={mode} disabled={busy} onChange={e=>{setMode(e.target.value);invalidate();}}>{Object.entries(actions).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
    <p>Kode outlet menjadi identitas pencocokan. Kode duplikat ditolak; baris di luar akses Anda tidak boleh diimpor. Interval kosong mempertahankan nilai lama.</p>
   </section>}
   {error&&<p role="alert" className="app-error">{error}</p>}
   {rows.length>0&&<SpreadsheetPreviewTable previewRows={rows.slice(0,30)}/>}
   {rows.length>30&&<p>Pratinjau data menampilkan 30 baris pertama; semua baris diperiksa oleh server.</p>}
   {review&&<section className="cluster-impact"><h3>Perubahan yang akan diterapkan</h3>
    <p>{review.summary.created} outlet baru · {review.summary.updated} diperbarui · {review.summary.skipped} dilewati · {review.summary.moved} pindah wilayah · {review.summary.coordinatesChanged} perubahan koordinat</p>
    <ul>{review.changes.map(c=><li key={c.outletCode}><strong>{c.name} · {c.outletCode}</strong><span>{c.action==='SKIP'?`Lewati: ${c.skipReason}`:`${c.action==='CREATE'?'Tambah':'Perbarui'} · ${c.from} → ${c.to}${c.coordinatesChanged?' · koordinat berubah':''}`}</span></li>)}</ul>
    <p>{review.impact.templateReferences} referensi template · {review.impact.draftPlans.length} draft perlu ditinjau · {review.impact.publishedPjps} PJP terbit terdampak</p>
    {!!review.impact.draftPlans.length&&<ul>{review.impact.draftPlans.map(p=><li key={p.id}>{p.name} · revisi {p.revision}</li>)}</ul>}
    <p>Rute referensi cluster yang diubah akan dibersihkan. PJP yang sudah terbit tetap tersimpan. Baris dilewati tidak mengubah outlet atau rute.</p>
   </section>}
   <button type="button" className="app-button app-button-primary" disabled={busy||!text||(!!review&&!review.summary.created&&!review.summary.updated)} onClick={submit}>{busy?'Memproses…':review?'Terapkan perubahan impor':'Periksa perubahan di server'}</button>
  </div>
 </GuardedDialog>;
}
