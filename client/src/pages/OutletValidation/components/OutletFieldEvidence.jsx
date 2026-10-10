import React from 'react';
import {stamp,point} from '../../OutletManagement/outletPresentation';
export function OutletFieldEvidence({evidence:e}){
 if(!e)return null;
 return <div className="ov-evidence"><p><strong>{{FOUND:'Toko ditemukan',NOT_FOUND:'Tidak ditemukan',MOVED:'Toko pindah',CLOSED:'Toko tutup'}[e.outcome]||e.outcome}</strong></p><p>{e.name} · {e.address}</p><p>{e.note}</p><p className="ov-muted">GPS: {point(e)} · akurasi {e.accuracyMeters??'—'} m · diambil {stamp(e.capturedAt)}</p>{e.photo&&<img className="ov-evidence-photo" src={e.photo} loading="lazy" alt={`Bukti lapangan Sales: ${e.name||'toko'}`}/>}</div>;
}
