import React,{useState} from 'react';
import {vehiclesApi,divisionsApi} from '../../../services/api';
import {useApp} from '../../../context/AppContext';
import {BusinessCodeInput} from '../../../shared/components/common/BusinessCodeInput';

export function CodingMasterForms() {
  const {fetchDivisions}=useApp();
  const [kind,setKind]=useState('DIVISION'),[form,setForm]=useState({}),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  const field=(key,value)=>setForm({...form,[key]:value});
  const fields=[['maxCartons','Kapasitas karton'],['maxWeightKg','Kapasitas berat (kg)'],['fuelKmPerLiter','Konsumsi BBM (km/liter)'],['fuelPricePerLiter','Harga BBM per liter (Rp)']];
  async function save(e){
    e.preventDefault();if(busy)return;setBusy(true);setMessage('');
    try {
      const result=kind==='DIVISION'?await divisionsApi.create({name:form.name,code:form.code}):await vehiclesApi.create({name:form.name,code:form.code,fuelType:form.fuelType,...Object.fromEntries(fields.map(([key])=>[key,Number(form[key])]))});
      setMessage(`${kind==='DIVISION'?'Divisi':'Kendaraan'} tersimpan: ${result.data?.code || result.data?.name}.`);setForm({});
      if(kind==='DIVISION')await fetchDivisions();
    }catch(e){setMessage(e.message);}finally{setBusy(false);}
  }
  return <details className="p-5 rounded-2xl border border-border-glass space-y-3">
    <summary className="font-semibold cursor-pointer">Tambah master divisi / kendaraan</summary>
    <form onSubmit={save} className="space-y-3 pt-3">
      <label className="app-field">Jenis master<select value={kind} disabled={busy} onChange={e=>{setKind(e.target.value);setForm({});setMessage('');}}><option value="DIVISION">Divisi</option><option value="VEHICLE">Kendaraan</option></select></label>
      <BusinessCodeInput entity={kind} value={form.code || ''} onChange={value=>field('code',value)} optional={kind==='DIVISION'} disabled={busy}/>
      <label className="app-field">Nama<input required minLength={2} maxLength={150} value={form.name || ''} onChange={e=>field('name',e.target.value)} disabled={busy}/></label>
      {kind==='VEHICLE'&&<>
        <label className="app-field">Jenis BBM<input required minLength={2} value={form.fuelType || ''} onChange={e=>field('fuelType',e.target.value)} disabled={busy}/></label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{fields.map(([key,label])=><label key={key} className="app-field">{label}<input type="number" required min={1} step={key==='fuelKmPerLiter'?'0.1':'1'} value={form[key] || ''} onChange={e=>field(key,e.target.value)} disabled={busy}/></label>)}</div>
      </>}
      {message&&<p role="status" className="text-sm">{message}</p>}
      <button type="submit" disabled={busy} className="btn btn-primary">{busy?'Menyimpan…':'Simpan master'}</button>
    </form>
  </details>;
}
