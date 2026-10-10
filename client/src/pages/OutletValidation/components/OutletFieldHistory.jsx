import React from 'react';
import {stamp} from '../../OutletManagement/outletPresentation';
import {OutletFieldEvidence} from './OutletFieldEvidence';
const labels={ASSIGN:'Ditugaskan',REASSIGN:'Dijadwalkan ulang / dialihkan',SUBMIT:'Bukti dikirim',RETURN:'Bukti dikembalikan',ACCEPT:'Bukti diterima',CANCEL:'Tugas dibatalkan'};
export function OutletFieldHistory({task}){
 const history=Array.isArray(task.history)?task.history:[];
 if(!history.length)return null;
 const versions=history.filter(e=>e.action==='SUBMIT'&&e.evidence).length;
 return <details className="ov-history"><summary>Riwayat tugas · {versions} versi bukti · {history.length} aktivitas</summary><ol className="ov-history-list">{history.map((event,i)=>({event,i})).reverse().map(({event:e,i})=><li key={`${i}:${e.at}`}><div className="ov-section-heading"><strong>{labels[e.action]||e.action}{e.evidence?.requestId===task.evidence?.requestId?' · bukti terbaru':''}</strong><span className="ov-muted">{stamp(e.at)}</span></div><p>{e.actor?.name||'Sistem'}</p>{(e.reason||e.instructions)&&<p>{e.reason||e.instructions}</p>}{e.evidence&&<details><summary>Lihat versi bukti #{history.slice(0,i+1).filter(h=>h.action==='SUBMIT'&&h.evidence).length}</summary><OutletFieldEvidence evidence={e.evidence}/></details>}</li>)}</ol></details>;
}
