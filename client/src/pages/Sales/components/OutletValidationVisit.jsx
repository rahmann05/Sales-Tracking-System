import React,{useState} from 'react';
import {SalesOutletValidationForm} from '../SalesOutletValidationForm';
import {useApp} from '../../../context/AppContext';
export function OutletValidationVisit({stop}){
 const {user}=useApp(),[open,setOpen]=useState(false),task=stop.validationTask;
 const state=stop.validationResult?.state||'PENDING';
 const labels={COMPLETE:'Validasi selesai',RESOLVED:'Kasus selesai · tidak perlu kunjungan lagi',PENDING:'Validasi belum dikerjakan',WAITING_REVIEW:'Bukti menunggu SPV',ACCEPTED:'Bukti diterima · menunggu penyelesaian master',RETURNED:'Perlu kunjungan ulang',CANCELLED:'Penugasan dibatalkan',REASSIGNED:'Penugasan dialihkan'};
 return <section className="sales-result"><h3>Validasi ulang outlet</h3><p>{labels[state]||state}</p><p className="sales-note">Konfirmasi nama pada papan toko, alamat lengkap, foto toko dan lokasi aktual. Tugas ini tidak memakai titik master yang sedang diragukan sebagai geofence.</p><p className="sales-note">{task?.schedule?.mode==='UNTIL_COMPLETE'?'Tetap dalam agenda sampai kasus selesai.':'Khusus hari penugasan. Yang belum dikerjakan tetap ditandai pada laporan hari tersebut.'}</p>{task&&user?.permissions?.can_submit_outlet_field&&<button type="button" className="app-button app-button-primary" onClick={()=>setOpen(v=>!v)}>{open?'Tutup formulir':task.status==='OPEN'?'Isi validasi ulang':'Lihat bukti validasi'}</button>}{open&&task&&<SalesOutletValidationForm taskId={task.id}/>}</section>;
}
