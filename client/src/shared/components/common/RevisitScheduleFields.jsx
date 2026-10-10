import React from 'react';
export function RevisitScheduleFields({value,onChange}){
 const set=(key,next)=>onChange({...value,[key]:next});
 return <div className="app-form"><p className="app-notice">Agenda satu kali pada tanggal tujuan. Laporan toko tutup hari asal tetap tersimpan; pola PJP rutin tidak berubah. Jam menggunakan WIB. Jika sudah ada agenda reguler yang belum dimulai, agenda tersebut digunakan.</p><label className="app-field">Tanggal kunjungan kembali<input type="date" required value={value.date||''} onChange={e=>set('date',e.target.value)}/></label><label className="app-field">Jam mulai (WIB)<input type="time" required value={value.time||'08:00'} onChange={e=>set('time',e.target.value)}/></label><label className="app-field">Kode PJP (bila penomoran manual)<input maxLength={100} value={value.manualCode||''} onChange={e=>set('manualCode',e.target.value)}/></label></div>;
}
