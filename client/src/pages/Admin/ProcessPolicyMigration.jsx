import React,{useEffect,useState} from 'react';
import {configApi} from '../../services/api';
import {CONFIG_PARAMS} from '../../../../shared/config.mjs';
const labels={ORDER:'Order menunggu pemeriksaan',REGISTRATION:'Pengajuan outlet',PACKING:'Packing draf',TRIP:'Trip belum dimulai',VISIT:'Langkah berikutnya kunjungan Sales',SHIFT:'Penyelesaian shift aktif',FOLLOW_UP:'Tindak lanjut belum dikirim'};
export function ProcessPolicyMigration(){
 const [kind,setKind]=useState('ORDER'),[data,setData]=useState(null),[ids,setIds]=useState([]),[preview,setPreview]=useState(null),[reason,setReason]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const load=async()=>{setBusy(true);setError('');setPreview(null);setIds([]);try{setData((await configApi.migrationCandidates(kind)).data);}catch(e){setError(e.message);}finally{setBusy(false);}};
 useEffect(()=>{setData(null);setMessage('');load();},[kind]);
 const review=async()=>{setBusy(true);setError('');try{setPreview((await configApi.previewMigration({kind,ids})).data);}catch(e){setError(e.message);}finally{setBusy(false);}};
 const apply=async()=>{setBusy(true);setError('');try{const r=await configApi.migrateProcesses({kind,ids,reason,fingerprint:preview.fingerprint});await load();setMessage(`${r.data.count} proses memakai aturan langkah berikutnya yang telah ditinjau.`);setReason('');}catch(e){setError(e.message);setPreview(null);}finally{setBusy(false);}};
 const select=id=>{setPreview(null);setIds(old=>old.includes(id)?old.filter(value=>value!==id):[...old,id]);};
 return <section className="policy-panel"><header><h2>Migrasi aturan langkah berikutnya</h2><p>Pilih pekerjaan tertentu untuk mengikuti aturan yang sudah berlaku. Publikasi draf tidak memigrasikan pekerjaan secara otomatis.</p></header><div className="policy-panel-body">
 <label className="policy-field">Proses<select className="config-input" disabled={busy} value={kind} onChange={e=>setKind(e.target.value)}>{Object.entries(labels).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
 <p className="policy-note">{data?.note}</p><div className="policy-migration-list" aria-busy={busy}>{data?.items.map(item=><label key={item.id}><input type="checkbox" checked={ids.includes(item.id)} disabled={busy||!item.eligible||ids.length>=20&&!ids.includes(item.id)} onChange={()=>select(item.id)}/><span><strong>{item.label}</strong><small>{item.status} · {item.changes.length} perubahan</small>{item.reason&&<small>{item.reason}</small>}</span></label>)}</div>
 {!busy&&!data?.items.length&&<p>Tidak ada pekerjaan terbuka pada jenis ini.</p>}{data?.truncated&&<p>Menampilkan 100 pekerjaan terbaru. Pilihan dibatasi 20 proses per migrasi.</p>}
 <button className="config-button" disabled={busy||!ids.length} onClick={review}>Tinjau {ids.length} proses terpilih</button>
 {preview&&<div className="policy-migration-preview"><h3>Perubahan yang akan diterapkan</h3>{preview.items.map(item=><article key={item.id}><strong>{item.label}</strong>{item.reason&&<p>{item.reason}</p>}<ul>{item.changes.map(change=><li key={change.key}>{CONFIG_PARAMS.find(p=>p.key===change.key)?.label||change.key}: {String(change.before)} → {String(change.after)}</li>)}</ul></article>)}<label className="policy-field">Alasan migrasi<textarea className="config-input" maxLength={2000} disabled={busy} value={reason} onChange={e=>setReason(e.target.value)}/></label><button className="config-button config-button-primary" disabled={busy||!preview.ready||reason.trim().length<5} onClick={apply}>Terapkan aturan pada {preview.items.length} proses</button></div>}
 {busy&&<p role="status">Memproses…</p>}{error&&<p role="alert" className="policy-error">{error}</p>}{message&&<p role="status" className="policy-success">{message}</p>}
 </div></section>;
}
