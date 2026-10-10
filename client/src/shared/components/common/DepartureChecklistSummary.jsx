import React from 'react';
export function DepartureChecklistSummary({route}){
 const proof=route.preparation?.DEPARTURE;
 if(!proof?.items?.length)return null;
 return <details className="app-notice"><summary>Checklist keberangkatan · {proof.actorName} · {new Date(proof.at).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})} WIB</summary><dl>{proof.items.map(item=><div key={item.key}><dt>{item.label}</dt><dd>{proof.answers[item.key]===true?'Ya':proof.answers[item.key]===false?'Tidak':proof.answers[item.key]??'Tidak diisi'}{proof.failures.some(f=>f.key===item.key)&&' · Kondisi gagal dicatat'}{proof.answers._evidence?.[item.key]?.reason&&<p>{proof.answers._evidence[item.key].reason}</p>}{proof.answers._evidence?.[item.key]?.photoUrl&&<a href={proof.answers._evidence[item.key].photoUrl} download={`checklist-${item.key}.jpg`}>Unduh foto bukti</a>}</dd></div>)}</dl></details>;
}
