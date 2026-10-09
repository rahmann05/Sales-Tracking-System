import React,{useEffect,useState} from 'react';
import {configApi} from '../../services/api';
import {CONFIG_PARAMS,parseConfigValue} from '../../../../shared/config.mjs';
import {POLICY_SECRET_KEYS} from '../../../../shared/operational-policy.mjs';
export function PolicyLibrary({editor}){
 const [items,setItems]=useState([]),[selected,setSelected]=useState(''),[name,setName]=useState(''),[description,setDescription]=useState('');
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const load=async()=>{const response=await configApi.policyLibrary();setItems(response.data);};
 useEffect(()=>{load().catch(e=>setError(e.message));},[]);
 const choose=id=>{setSelected(id);const item=items.find(i=>i.id===id);setName(item?.name||'');setDescription(item?.description||'');setMessage('');};
 const save=async()=>{setBusy(true);setError('');setMessage('');try{
  const item=items.find(i=>i.id===selected),values=Object.fromEntries(CONFIG_PARAMS.filter(p=>!POLICY_SECRET_KEYS.includes(p.key)).map(p=>[p.key,parseConfigValue(p,editor.values[p.key])]));
  const response=await configApi.savePolicyLibrary({...(item?{id:item.id}:{}),revision:item?.revision||0,name,description,reason:editor.reason,values});
  await load();setSelected(response.data.id);setMessage('Profil salinan tersimpan. Aturan aktif belum berubah.');
 }catch(e){setError(e.message);}finally{setBusy(false);}};
 const copy=async()=>{if(editor.dirty&&!window.confirm('Perubahan lokal belum disimpan. Ganti dengan profil salinan?'))return;
  setBusy(true);setError('');setMessage('');try{const item=items.find(i=>i.id===selected);await configApi.copyPolicyLibrary({id:item.id,templateRevision:item.revision,scope:editor.scope,revision:editor.data.profile.revision,reason:editor.reason});await editor.load();setMessage('Profil disalin ke draf lingkup terpilih. Tinjau dampak sebelum menerbitkan.');}catch(e){setError(e.message);}finally{setBusy(false);}
 };
 return <section className="policy-panel"><header><h2>Profil aturan tersimpan</h2><p>Simpan kombinasi aturan dengan nama, lalu gunakan sebagai draf perusahaan, role, atau tim.</p></header><div className="policy-panel-body">
 <label className="policy-field">Profil<select className="config-input" value={selected} disabled={busy} onChange={e=>choose(e.target.value)}><option value="">Buat profil baru</option>{items.map(item=><option key={item.id} value={item.id}>{item.name} · revisi {item.revision}</option>)}</select></label>
 <label className="policy-field">Nama profil<input className="config-input" value={name} maxLength={100} disabled={busy} onChange={e=>setName(e.target.value)}/></label>
 <label className="policy-field">Keterangan<textarea className="config-input" value={description} maxLength={1000} disabled={busy} onChange={e=>setDescription(e.target.value)}/></label>
 <p className="policy-note">Penyimpanan memakai nilai yang sedang terlihat pada editor. Rahasia integrasi dan sesi tidak disalin. Isi alasan perubahan pada bilah draf di bawah.</p>
 <div className="policy-transfer"><button className="config-button" disabled={busy||editor.busy||name.trim().length<3||editor.reason.trim().length<5} onClick={save}>{selected?'Perbarui profil dari editor':'Simpan editor sebagai profil'}</button><button className="config-button" disabled={busy||editor.busy||!selected||editor.reason.trim().length<5} onClick={copy}>Salin profil ke draf {editor.scope==='GLOBAL'?'perusahaan':'terpilih'}</button></div>
 {error&&<p className="policy-error" role="alert">{error}</p>}{message&&<p className="policy-success" role="status">{message}</p>}
 </div></section>;
}
