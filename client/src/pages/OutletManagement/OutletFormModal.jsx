import React,{useState} from 'react';
import {NativeDialog} from '../../shared/components/common/NativeDialog';
import {BusinessCodeInput} from '../../shared/components/common/BusinessCodeInput';
import {useUnsavedNavigation} from '../../shared/hooks/useUnsavedNavigation';
import {outletsApi} from '../../services/api';
import {subChannels} from './outletPresentation';
import {matchesOutletChannel} from '../../../../shared/outlet-trade.mjs';
export function OutletFormModal({outlet,clusters,onClose,onSaved,clusterError}) {
 const creating=!outlet,[form,setForm]=useState({requestId:crypto.randomUUID(),name:outlet?.name||'',outletCode:outlet?.outletCode||'',address:outlet?.address||'',ownerName:outlet?.ownerName||'',phone:outlet?.phone||'',channel:outlet?.channel||'GENERAL_TRADE',subChannel:outlet?.subChannel||'TOKO_RETAIL',clusterId:'',latitude:'',longitude:'',radiusMeters:outlet?.radiusMeters||50,taxType:outlet?.taxType||'NON_PKP',taxNumber:outlet?.taxNumber||'',taxName:outlet?.taxName||'',taxAddress:outlet?.taxAddress||'',reason:'',duplicateReason:''}),[dirty,setDirty]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[duplicates,setDuplicates]=useState(null);
 useUnsavedNavigation(dirty,busy);
 const update=(key,value)=>{setDirty(true);setForm(p=>({...p,[key]:value}));if(['name','address','latitude','longitude','clusterId'].includes(key))setDuplicates(null);};
 const close=()=>{if(!busy&&(!dirty||window.confirm('Perubahan belum disimpan. Tutup formulir?')))onClose();};
 const submit=async e=>{e.preventDefault();if(busy)return;setBusy(true);setError('');try {
  let response;
  if(creating){const fields=Object.fromEntries(Object.entries(form).filter(([key])=>key!=='reason'));const body={...fields,latitude:Number(form.latitude),longitude:Number(form.longitude),radiusMeters:Number(form.radiusMeters),duplicateReason:form.duplicateReason||undefined,locationEvidence:{source:'MANUAL'}};
   const matches=await outletsApi.duplicates(body);setDuplicates(matches.data);
   if(matches.data.length&&form.duplicateReason.trim().length<10){setError('Periksa kandidat outlet yang mirip dan jelaskan bila memang outlet berbeda.');return;}
   response=await outletsApi.create(body);
  }else {const fields=Object.fromEntries(Object.entries(form).filter(([key])=>!['requestId','clusterId','latitude','longitude','duplicateReason'].includes(key)));response=await outletsApi.update(outlet.id,{...fields,updatedAt:outlet.updatedAt,radiusMeters:Number(form.radiusMeters)});}
  setDirty(false);await onSaved(response.data);
 }catch(e){setError(e.message);}finally{setBusy(false);}};
 return <NativeDialog open title={creating?'Tambah master outlet':'Edit identitas outlet'} busy={busy} onClose={close} className="outlet-dialog"><form className="app-form" onSubmit={submit}>
  <p className="outlet-muted">{creating?'Masukkan data nyata dan pilih wilayah secara eksplisit. Pemeriksaan peta dapat dilakukan kemudian bila diperlukan.':'Perubahan identitas tercatat dalam riwayat. Perubahan titik dilakukan melalui Koreksi lokasi pada profil outlet.'}</p>
  {error&&<p className="app-error" role="alert">{error}</p>}
  <fieldset className="outlet-form-section"><legend>Identitas & kontak</legend>{creating&&<BusinessCodeInput entity="OUTLET" value={form.outletCode} onChange={v=>update('outletCode',v)} disabled={busy}/>}
   <label className="app-field">Nama outlet<input required minLength={2} value={form.name} onChange={e=>update('name',e.target.value)}/></label><label className="app-field">Alamat lengkap<textarea required minLength={5} value={form.address} onChange={e=>update('address',e.target.value)}/></label>
   <div className="outlet-form-grid">{[['ownerName','Nama pemilik'],['phone','Nomor telepon']].map(([key,label])=><label className="app-field" key={key}>{label}<input type={key==='phone'?'tel':'text'} value={form[key]} onChange={e=>update(key,e.target.value)}/></label>)}</div>
   <div className="outlet-form-grid"><label className="app-field">Channel<select value={form.channel} onChange={e=>{update('channel',e.target.value);update('subChannel',e.target.value==='MODERN_TRADE'?'CHAIN_MINIMARKET':'TOKO_RETAIL');}}><option value="GENERAL_TRADE">General Trade</option><option value="MODERN_TRADE">Modern Trade</option></select></label><label className="app-field">Jenis outlet<select value={form.subChannel} onChange={e=>update('subChannel',e.target.value)}>{Object.entries(subChannels).filter(([key])=>matchesOutletChannel(form.channel,key)).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label></div>
  </fieldset>
  {creating&&<fieldset className="outlet-form-section"><legend>Lokasi & wilayah</legend>{clusterError&&<p className="app-error">Wilayah gagal dimuat: {clusterError}. Tutup formulir lalu perbarui halaman.</p>}<label className="app-field">Wilayah<select required value={form.clusterId} onChange={e=>update('clusterId',e.target.value)}><option value="">Pilih wilayah</option>{clusters.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><div className="outlet-form-grid">{[['latitude','Latitude',-90,90],['longitude','Longitude',-180,180]].map(([key,label,min,max])=><label key={key} className="app-field">{label}<input type="number" step="any" required min={min} max={max} value={form[key]} onChange={e=>update(key,e.target.value)}/></label>)}</div><p className="outlet-muted">Koordinat harus berasal dari outlet yang dimaksud. Tidak ada titik bawaan.</p></fieldset>}
  <label className="app-field">Radius presensi (meter)<input type="number" required min="5" max="1000" step="1" value={form.radiusMeters} onChange={e=>update('radiusMeters',e.target.value)}/></label>
  <details className="outlet-disclosure"><summary>Identitas pajak / NIK · opsional</summary><div className="app-form"><label className="app-field">Status pajak<select value={form.taxType} onChange={e=>update('taxType',e.target.value)}><option value="NON_PKP">Non PKP</option><option value="PKP">PKP</option></select></label>{[['taxNumber',form.taxType==='PKP'?'NPWP':'NIK pemilik (16 digit)'],['taxName','Nama sesuai dokumen'],['taxAddress','Alamat sesuai dokumen']].map(([key,label])=><label key={key} className="app-field">{label}<input value={form[key]} maxLength={key==='taxNumber'?30:1000} onChange={e=>update(key,e.target.value)}/></label>)}</div></details>
  {duplicates?.length>0&&<section className="outlet-warning"><h3>Periksa kemungkinan outlet ganda</h3>{duplicates.map(o=><p key={o.id}><strong>{o.name}</strong> · {o.outletCode} · {o.distanceMeters} m<br/>{o.address}</p>)}<label className="app-field">Alasan tetap membuat outlet berbeda<textarea minLength={10} required value={form.duplicateReason} onChange={e=>update('duplicateReason',e.target.value)}/></label></section>}
  {!creating&&<label className="app-field">Alasan perubahan<textarea required minLength={10} maxLength={1000} value={form.reason} onChange={e=>update('reason',e.target.value)}/></label>}
  <footer className="outlet-form-footer"><button type="button" className="app-button" disabled={busy} onClick={close}>Batal</button><button type="submit" className="app-button app-button-primary" disabled={busy}>{busy?'Menyimpan…':duplicates?.length?'Simpan sebagai outlet berbeda':'Simpan outlet'}</button></footer>
 </form></NativeDialog>;
}
