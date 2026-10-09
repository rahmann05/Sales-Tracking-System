import {ConfigHistory} from './ConfigHistory';
import React from 'react';
export function PolicyVersionHistory({editor}){
 const versions=editor.data?.profile.versions||[];
 return <section className="policy-panel"><header><h2>Riwayat versi</h2><p>Pemulihan versi menghasilkan draf baru dan tetap memerlukan peninjauan.</p></header><div className="policy-panel-body">
 {!versions.length&&<p>Belum ada versi yang diterbitkan pada profil ini. Nilai mengikuti aturan sebelumnya.</p>}
 {[...versions].reverse().map(v=><article className="policy-version" key={v.id}><div><strong>Versi {v.revision}</strong><span className="policy-badge">{v.cancelledAt?'Jadwal dibatalkan':+new Date(v.effectiveAt)>Date.now()?'Terjadwal':'Diterbitkan'}</span><p>{v.reason}</p><small>Berlaku {new Date(v.effectiveAt).toLocaleString('id-ID')} · {v.actorName||'Admin'}</small></div><button className="config-button" disabled={editor.busy||editor.dirty} onClick={()=>editor.restore(v.id)}>Salin ke draf</button>{!v.cancelledAt&&+new Date(v.effectiveAt)>Date.now()&&<button className="config-button" disabled={editor.busy||editor.dirty||editor.reason.trim().length<5} onClick={()=>editor.cancelSchedule(v.id)}>Batalkan jadwal</button>}</article>)}
 <ConfigHistory/>
 </div></section>;
}
