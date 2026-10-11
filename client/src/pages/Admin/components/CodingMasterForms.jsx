import {MasterImportPanel} from '../../../shared/components/common/MasterImportPanel';
import {useDomainPermission} from '../../../shared/hooks/useDomainPermission';
import React,{useState,useRef} from 'react';
import {vehiclesApi,divisionsApi} from '../../../services/api';
import {useApp} from '../../../context/AppContext';
import {BusinessCodeInput} from '../../../shared/components/common/BusinessCodeInput';
import {nativeFileCaptureService} from '../../../services/nativeFileCaptureService';
import {evidenceImageError} from '../../../../../shared/evidence-image-policy.mjs';

export function CodingMasterForms({initialKind='DIVISION',fixedKind=false,onCreated=()=>{}}) {
  const {fetchDivisions,settings}=useApp();
  const canDivision=useDomainPermission('MANAGE_DIVISION'),canVehicle=useDomainPermission('MANAGE_VEHICLE');
  const [kind,setKind]=useState(initialKind),[form,setForm]=useState({}),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  const photoRef=useRef(null);
  const field=(key,value)=>setForm({...form,[key]:value});
  const fields=[['maxCartons','Kapasitas karton'],['maxWeightKg','Kapasitas berat (kg)'],['fuelKmPerLiter','Konsumsi BBM (km/liter)'],['fuelPricePerLiter','Harga BBM per liter (Rp)']];
  async function pickPhoto(e){
    const file=e.target.files?.[0];
    e.target.value='';
    if(!file)return;
    setMessage('');
    try{
      const maxKb=settings?.EVIDENCE_IMAGE_MAX_KB??2000;
      if(file.size>maxKb*1024)throw new Error(`Ukuran foto maksimal ${maxKb} KB.`);
      const dataUrl=await nativeFileCaptureService.readFileAsDataUrl(file);
      const err=evidenceImageError(dataUrl,settings||{});
      if(err)throw new Error(err);
      field('photoUrl',dataUrl);
    }catch(err){setMessage(err.message);}
  }
  async function save(e){
    e.preventDefault();if(busy||!(kind==='DIVISION'?canDivision:canVehicle))return;
    if(kind==='VEHICLE'&&!form.photoUrl){setMessage('Foto kendaraan wajib disertakan.');return;}
    setBusy(true);setMessage('');
    try {
      const result=kind==='DIVISION'?await divisionsApi.create({name:form.name,code:form.code}):await vehiclesApi.create({name:form.name,code:form.code,fuelType:form.fuelType,photoUrl:form.photoUrl,...Object.fromEntries(fields.map(([key])=>[key,Number(form[key])]))});
      setMessage(`${kind==='DIVISION'?'Divisi':'Kendaraan'} tersimpan: ${result.data?.code || result.data?.name}.`);setForm({});
      if(kind==='DIVISION')await fetchDivisions();onCreated();
    }catch(e){setMessage(e.message);}finally{setBusy(false);}
  }
  return <details className="p-5 rounded-2xl border border-border-glass space-y-3">
    <summary className="font-semibold cursor-pointer">{fixedKind?(kind==='VEHICLE'?'Tambah kendaraan':'Tambah divisi'):'Tambah master divisi / kendaraan'}</summary>
    {canVehicle&&<MasterImportPanel kind="vehicles"/>}
    <form onSubmit={save} className="space-y-3 pt-3">
      {!fixedKind&&<label className="app-field">Jenis master<select value={kind} disabled={busy} onChange={e=>{setKind(e.target.value);setForm({});setMessage('');}}><option value="DIVISION">Divisi</option><option value="VEHICLE">Kendaraan</option></select></label>}
      <BusinessCodeInput entity={kind} value={form.code || ''} onChange={value=>field('code',value)} optional={kind==='DIVISION'} disabled={busy}/>
      <label className="app-field">Nama<input required minLength={2} maxLength={150} value={form.name || ''} onChange={e=>field('name',e.target.value)} disabled={busy}/></label>
      {kind==='VEHICLE'&&<>
        <label className="app-field">Jenis BBM<input required minLength={2} value={form.fuelType || ''} onChange={e=>field('fuelType',e.target.value)} disabled={busy}/></label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{fields.map(([key,label])=><label key={key} className="app-field">{label}<input type="number" required min={1} step={key==='fuelKmPerLiter'?'0.1':'1'} value={form[key] || ''} onChange={e=>field(key,e.target.value)} disabled={busy}/></label>)}</div>
        <div className="rounded-xl border border-border-glass p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <strong className="block text-sm">Foto kendaraan (wajib)</strong>
              <small className="admin-footnote">Format JPG, PNG, atau WEBP.</small>
            </div>
            <input ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={pickPhoto} disabled={busy}/>
            <button type="button" disabled={busy} onClick={()=>photoRef.current?.click()} className="admin-button">{form.photoUrl?'Ubah foto':'Set foto'}</button>
          </div>
          {form.photoUrl&&<img src={form.photoUrl} alt="Pratinjau foto kendaraan" className="h-32 w-full object-cover rounded-xl border border-border-glass"/>}
        </div>
      </>}
      {message&&<p role="status" className="text-sm">{message}</p>}
      <button type="submit" disabled={busy||!(kind==='DIVISION'?canDivision:canVehicle)} className="btn btn-primary">{busy?'Menyimpan…':'Simpan master'}</button>
    </form>
  </details>;
}

