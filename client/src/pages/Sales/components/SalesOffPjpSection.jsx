import React from 'react';
import {SalesOffPjpCard} from './SalesOffPjpCard';
export function SalesOffPjpSection({offPjpAttendances=[]}){
  return <section className="sales-offpjp-list"><div className="sales-section-toolbar"><div><h2>Kunjungan luar PJP hari ini</h2><p className="sales-note">Pengajuan dan hasil validasi kunjungan tambahan pada tanggal operasional hari ini.</p></div><span className="sales-note">{offPjpAttendances.length} pengajuan</span></div>{offPjpAttendances.map(item=><SalesOffPjpCard key={item.id} item={item}/>)}{!offPjpAttendances.length&&<p className="sales-panel sales-empty">Belum ada kunjungan luar PJP hari ini. Gunakan Catat kunjungan luar PJP setelah tiba di lokasi.</p>}</section>;
}
