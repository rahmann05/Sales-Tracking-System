import React from 'react';
import {stamp} from '../../OutletManagement/outletPresentation';
const labels={name:'Nama',address:'Alamat',ownerName:'Pemilik',phone:'Telepon',latitude:'Latitude',longitude:'Longitude',taxType:'Status pajak',taxNumber:'NIK / NPWP',taxName:'Nama dokumen',taxAddress:'Alamat dokumen',visitDays:'Hari kunjungan',visitIntervalWeeks:'Interval minggu',channel:'Channel',subChannel:'Jenis outlet',area:'Area',mappingLocation:'Patokan',photoId:'Referensi foto'};
export function RegistrationRevisionHistory({history=[]}) {
 if(!history.length)return null;
 return <details className="outlet-disclosure"><summary>Riwayat revisi ({history.length})</summary>{history.map((h,i)=><article className="app-form" key={i}><strong>{h.reason}</strong><small>{stamp(h.at)} · {h.actor.name}</small><p>Catatan sebelumnya: {h.rejectionNote}</p><dl className="outlet-facts">{Object.keys(h.after || {}).map(k=><React.Fragment key={k}><dt>{labels[k] || k}</dt><dd>{typeof h.after[k]==='object'?'Referensi diperbarui':`${h.before[k] ?? 'Kosong'} → ${h.after[k] ?? 'Kosong'}`}</dd></React.Fragment>)}</dl></article>)}</details>;
}
