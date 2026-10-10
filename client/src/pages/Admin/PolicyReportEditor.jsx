import React from 'react';
import {REPORT_PRESENTATION,reportSelection} from '../../../../shared/report-presentation.mjs';
const labels={calls:'Kunjungan',ec:'Kunjungan efektif',revenue:'Nilai order disetujui',anomalies:'Bukti dan anomali',calendar:'Kalender kerja',target:'Target dan pencapaian',comparison:'Perbandingan bulan lalu',cluster:'Klaster',days:'Rincian per hari',callRate:'Persentase kunjungan',ecRate:'Persentase kunjungan efektif',achievement:'Pencapaian target',lastMonth:'Nilai bulan lalu',sku:'Jumlah SKU'};
export function PolicyReportEditor({id,value,onChange,disabled}){
 let selected;try{selected=reportSelection(id,value||'');}catch{selected=[];}
 const reorder=id.endsWith('_WIDGETS');
 const toggle=(item,checked)=>onChange((checked?[...selected,item]:selected.filter(x=>x!==item)).join(','));
 const move=(item,offset)=>{const next=[...selected],index=next.indexOf(item);[next[index],next[index+offset]]=[next[index+offset],next[index]];onChange(next.join(','));};
 return <fieldset id={id} disabled={disabled} className="space-y-2" aria-describedby={`${id}-help`}>
  <legend className="config-visually-hidden">Pilihan tampilan laporan</legend>
  {REPORT_PRESENTATION[id].map(item=><label key={item} className="flex items-center gap-3 min-h-11"><input type="checkbox" checked={selected.includes(item)} onChange={e=>toggle(item,e.target.checked)}/><span>{labels[item]}</span></label>)}
  {reorder&&selected.length>1&&<details className="border-t border-border-glass pt-2"><summary className="text-sm min-h-11 cursor-pointer">Atur urutan kartu</summary><ol>{selected.map((item,index)=><li key={item} className="flex items-center gap-2 min-h-11"><span className="flex-1">{index+1}. {labels[item]}</span><button type="button" className="app-button" aria-label={`Naikkan ${labels[item]}`} disabled={disabled||index===0} onClick={()=>move(item,-1)}>↑</button><button type="button" className="app-button" aria-label={`Turunkan ${labels[item]}`} disabled={disabled||index===selected.length-1} onClick={()=>move(item,1)}>↓</button></li>)}</ol></details>}
 </fieldset>;
}
