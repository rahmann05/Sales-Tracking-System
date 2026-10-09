import React,{useState} from 'react';
import {CONFIG_PARAMS} from '../../../../shared/config.mjs';
import {displayValue} from './AdminConfigPage.shared';
const countLabels={users:'Pengguna dalam lingkup',shifts:'Shift aktif',visits:'Kunjungan aktif',orders:'Order menunggu',registrations:'Pengajuan outlet',trips:'Trip terbuka',packing:'Packing draf',followUps:'Tugas terbuka'};
export function PolicyPublishPanel({editor}){
 const [effectiveAt,setEffectiveAt]=useState('');const {preview,busy,dirty}=editor;
 return <section className="policy-panel"><header><h2>Tinjau & terapkan</h2><p>Publikasi membentuk versi baru. Draf dapat diperbaiki tanpa memengaruhi kegiatan berjalan.</p></header>
 {!preview?<div className="policy-panel-body"><p>Simpan draf, lalu periksa dampak sebelum menerbitkan aturan.</p><button className="config-button" disabled={busy||dirty||!editor.data||!Object.keys(editor.data.profile.draft).length} onClick={editor.review}>Periksa dampak draf</button></div>:<div className="policy-panel-body">
 <div className="policy-impact-grid">{Object.entries(preview.counts).map(([key,value])=><div key={key}><strong>{value}</strong><span>{countLabels[key]}</span></div>)}</div>
 <p className="policy-note">{preview.note}</p>
 {preview.conflicts.length>0&&<div role="alert" className="policy-error"><strong>Konflik yang harus diperbaiki</strong><ul>{preview.conflicts.map(issue=><li key={issue}>{issue}</li>)}</ul></div>}
 <div className="policy-change-list">{preview.changes.map(c=>{const p=CONFIG_PARAMS.find(p=>p.key===c.key);return <div key={c.key}><strong>{p?.label||c.key}</strong><span>{displayValue(p,c.before)} → {displayValue(p,c.after)}</span></div>;})}</div>
 {!preview.changes.length&&<p>Tidak ada nilai efektif yang berubah.</p>}
 <label className="policy-field">Waktu berlaku<select className="config-input" value={effectiveAt?'scheduled':'now'} onChange={e=>setEffectiveAt(e.target.value==='now'?'':new Date(Date.now()+3600000-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16))}><option value="now">Sekarang</option><option value="scheduled">Jadwalkan</option></select></label>
 {effectiveAt&&<label className="policy-field">Tanggal dan jam lokal<input className="config-input" type="datetime-local" value={effectiveAt} onChange={e=>setEffectiveAt(e.target.value)}/></label>}
 <button className="config-button config-button-primary" disabled={busy||dirty||preview.conflicts.length>0||!preview.changes.length} onClick={()=>editor.publish(effectiveAt)}>Terbitkan {preview.changes.length} perubahan</button>
 </div>}
 </section>;
}
